#!/usr/bin/env bash
# Back-fill review requests for bookings that missed the scheduler window.
#
# Usage:
#   ADMIN_COOKIE="connect.sid=..." ./scripts/backfill-review-requests.sh
#       → dry run: lists pending bookings, sends nothing
#
#   ADMIN_COOKIE="connect.sid=..." ./scripts/backfill-review-requests.sh --send
#       → sends WhatsApp review requests after explicit "yes" confirmation
#
# Optional env vars:
#   BASE        Base URL (default https://www.costabravarentaboat.com)
#   SLEEP       Seconds between calls (default 2)
#
# How to get the admin cookie:
#   1. Login to https://www.costabravarentaboat.com/admin in your browser
#   2. DevTools → Application → Cookies → copy the admin session cookie
#   3. Export it: ADMIN_COOKIE="<cookieName>=<value>"
#
# Safety:
#   - Dry-run by default
#   - Second explicit yes/no confirmation before sending
#   - Rate-limits between calls
#   - Stores per-ID status + response body for audit

set -euo pipefail

BASE="${BASE:-https://www.costabravarentaboat.com}"
SLEEP="${SLEEP:-2}"
COOKIE="${ADMIN_COOKIE:?ADMIN_COOKIE env var required. See header comment.}"

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required. Install with: brew install jq" >&2
  exit 1
fi

DO_SEND=false
if [[ "${1:-}" == "--send" ]]; then
  DO_SEND=true
elif [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,20p' "$0"
  exit 0
fi

echo "→ Fetching pending bookings from $BASE ..."
resp=$(curl -sS --fail -H "Cookie: $COOKIE" \
  "$BASE/api/admin/flywheel/review-request/pending" \
  || { echo "Failed to fetch pending list. Check cookie and base URL." >&2; exit 1; })

count=$(echo "$resp" | jq -r '.count // 0')
if [[ "$count" == "0" ]]; then
  echo "No pending bookings. Nothing to do."
  exit 0
fi

echo ""
echo "Pending bookings ($count):"
echo "$resp" | jq -r '.bookings[] | "  \(.id)  \(.customerName // "?")  \(.customerPhone // "?")  lang=\(.language // "?")  end=\(.endTime)"'
echo ""

if ! $DO_SEND; then
  echo "DRY RUN — nothing sent. To actually send, re-run with --send"
  exit 0
fi

read -r -p "Send WhatsApp review requests to all $count bookings above? (yes/no) " confirm
if [[ "$confirm" != "yes" ]]; then
  echo "Aborted."
  exit 0
fi

ids=$(echo "$resp" | jq -r '.bookings[].id')
ok=0
fail=0
log_file="$(mktemp -t backfill-reviews.XXXXXX).log"
echo "→ Logging per-ID responses to $log_file"
echo ""

for id in $ids; do
  printf "%s → " "$id"
  body_file="$(mktemp)"
  http=$(curl -sS -o "$body_file" -w "%{http_code}" \
    -X POST -H "Cookie: $COOKIE" \
    "$BASE/api/admin/flywheel/review-request/$id")
  body=$(cat "$body_file")
  echo "$id | http=$http | body=$body" >> "$log_file"

  if [[ "$http" == "200" ]]; then
    channel=$(echo "$body" | jq -r '.channel // "?"' 2>/dev/null || echo "?")
    lang=$(echo "$body" | jq -r '.language // "?"' 2>/dev/null || echo "?")
    skipped=$(echo "$body" | jq -r '.skipped // false' 2>/dev/null || echo "false")
    if [[ "$skipped" == "true" ]]; then
      echo "SKIPPED (already sent)"
    else
      echo "OK ($channel, $lang)"
    fi
    ok=$((ok + 1))
  else
    echo "FAIL http=$http"
    fail=$((fail + 1))
  fi

  rm -f "$body_file"
  sleep "$SLEEP"
done

echo ""
echo "Done. OK=$ok  FAIL=$fail  log=$log_file"
