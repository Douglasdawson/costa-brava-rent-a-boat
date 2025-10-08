#!/bin/bash

export CHROME_PATH="/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium"
URL="https://costa-brava-rent-a-boat-web-ivanrd9.replit.app"

echo "Running Lighthouse audits..."
echo "=============================="

# Mobile audit
echo "1. Running MOBILE audit..."
npx lighthouse "$URL" \
  --no-enable-error-reporting \
  --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage" \
  --only-categories=performance,seo,best-practices,accessibility \
  --output=html,json \
  --output-path=./mobile \
  --quiet

# Tablet audit  
echo "2. Running TABLET audit (768x1024)..."
npx lighthouse "$URL" \
  --no-enable-error-reporting \
  --config-path=./tablet-config.json \
  --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage" \
  --only-categories=performance,seo,best-practices,accessibility \
  --output=html,json \
  --output-path=./tablet \
  --quiet

# Desktop audit
echo "3. Running DESKTOP audit..."
npx lighthouse "$URL" \
  --no-enable-error-reporting \
  --preset=desktop \
  --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage" \
  --only-categories=performance,seo,best-practices,accessibility \
  --output=html,json \
  --output-path=./desktop \
  --quiet

echo ""
echo "Audits completed!"
echo "Reports saved in ./lighthouse/"
ls -lh *.report.* 2>/dev/null || echo "Report files generated"
