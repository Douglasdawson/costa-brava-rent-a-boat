---
name: Neon serverless WebSocket crash
description: @neondatabase/serverless v0.10.4 throws uncaught TypeError on transient DB connection drops, crashing the production server.
---

# Neon serverless uncaught WebSocket error

## The rule
Filter out the Neon WebSocket TypeError in `process.on('uncaughtException')` — do NOT let it shut down the server.

**Why:** When the Neon DB WebSocket connection drops transiently, `@neondatabase/serverless` tries to assign to `ErrorEvent.message` (read-only in Node.js). This throws a `TypeError: Cannot set property message of #<ErrorEvent> which has only a getter`. Without the filter, this crashes the whole production server every ~30-60 minutes, causing 30-40 second downtime windows where users see a blank site.

**How to apply:** In `server/index.ts`, before calling `shutdown()` in the `uncaughtException` and `unhandledRejection` handlers, check if the error matches: `err instanceof TypeError && err.message.includes("Cannot set property message of #<ErrorEvent>")`. If it does, just log it and return without shutting down. The Neon pool retries the connection automatically.

The fix is already in place as of 2026-06-07. Re-apply if the handler is ever replaced.
