#!/bin/bash

# Test script to check Cloudflare Pages deployment output format
echo "🧪 Testing Pages URL extraction..."

# Simulate typical wrangler pages deploy output
cat << 'EOF' > test_output.txt
⛅️ wrangler 4.31.0
───────────────────
Uploading... (0/1)
Uploading... (1/1)
✨ Success! Uploaded 1 files (1.69 sec)

✨ Uploading _redirects
🌎 Deploying...
✨ Deployment complete! Take a peek over at https://66339a49.quran-interface-test.pages.dev
✨ Deployment alias URL: https://main.quran-interface-test.pages.dev
EOF

echo "Sample output:"
cat test_output.txt
echo ""

# Test URL extraction
PAGES_URL=$(grep -o 'https://[a-zA-Z0-9]*\.quran-interface-test\.pages\.dev' test_output.txt | head -1)
ALIAS_URL=$(grep -o 'https://main\.quran-interface-test\.pages\.dev' test_output.txt)

echo "Extracted URLs:"
echo "Main URL: $PAGES_URL"
echo "Alias URL: $ALIAS_URL"

# Clean up
rm test_output.txt

echo ""
echo "✅ URL extraction test complete"
