#!/bin/bash

# 🕌 Al-Quran API - Simple Deployment Script
# Deploy your own Quran API on Cloudflare Workers in minutes!

set -e

echo "🕌 Al-Quran API Simple Deployment"
echo "================================="
echo ""

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Wrangler if needed
if ! command -v wrangler &> /dev/null; then
    echo "🔧 Installing Wrangler CLI..."
    npm install -g wrangler
else
    echo "✅ Wrangler CLI is already installed"
fi

# Check authentication
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  You need to login to Cloudflare first"
    echo "🚀 Opening Cloudflare login..."
    wrangler login
else
    echo "✅ Already logged in to Cloudflare"
fi

# Get user input
echo ""
echo "🎨 Let's customize your API..."
echo ""

read -p "Enter your API name (e.g., quran-api-masjid): " API_NAME
if [ -z "$API_NAME" ]; then
    API_NAME="al-quran-api-$(date +%s)"
    echo "Using default name: $API_NAME"
fi

read -p "Enter your Pages project name (e.g., quran-interface): " PAGES_NAME
if [ -z "$PAGES_NAME" ]; then
    PAGES_NAME="quran-interface-$(date +%s)"
    echo "Using default name: $PAGES_NAME"
fi

# Create temporary wrangler.toml
echo "📝 Creating configuration..."
cp wrangler.toml wrangler.toml.backup
sed "s/name = \"al-quran-api\"/name = \"$API_NAME\"/" wrangler.toml.backup > wrangler.toml

# Deploy API
echo ""
echo "🚀 Deploying API to Cloudflare Workers..."
wrangler deploy

WORKER_URL="https://$API_NAME.asrulmunir.workers.dev"
echo "✅ API deployed successfully!"
echo "   API URL: $WORKER_URL"

# Create temporary index.html for Pages
echo "📝 Preparing test interface..."
cp public/index.html public/index.html.backup
python3 -c "
import sys
with open('public/index.html.backup', 'r') as f:
    content = f.read()
content = content.replace('https://quran-api.asrulmunir.workers.dev', '$WORKER_URL')
with open('public/index.html', 'w') as f:
    f.write(content)
" 2>/dev/null || {
    # Fallback if Python is not available
    awk '{gsub(/https:\/\/quran-api\.asrulmunir\.workers\.dev/, "'"$WORKER_URL"'"); print}' public/index.html.backup > public/index.html
}

# Deploy Pages
echo ""
echo "🌐 Deploying test interface to Cloudflare Pages..."
wrangler pages deploy public --project-name="$PAGES_NAME" --commit-dirty=true

PAGES_URL="https://$PAGES_NAME.pages.dev"

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📖 Your Quran API: $WORKER_URL"
echo "🌐 Test Interface: $PAGES_URL"
echo ""
echo "📊 API Endpoints:"
echo "   $WORKER_URL/api/info"
echo "   $WORKER_URL/api/chapters"
echo "   $WORKER_URL/api/search?q=الله"
echo ""

# Test API
echo "🧪 Testing your API..."
if curl -s "$WORKER_URL/api/info" > /dev/null 2>&1; then
    echo "✅ API is working correctly!"
else
    echo "⚠️  API might still be propagating. Try again in a few minutes."
fi

echo ""
echo "🕌 Your Quran API is now serving the Ummah!"
echo "   Share it with your community and help spread Islamic knowledge."
echo ""
echo "Barakallahu feekum! 🤲"

# Restore original files
echo ""
echo "🔄 Restoring original configuration files..."
if [ -f "wrangler.toml.backup" ]; then
    mv wrangler.toml.backup wrangler.toml
fi
if [ -f "public/index.html.backup" ]; then
    mv public/index.html.backup public/index.html
fi

echo "✅ Deployment script completed successfully!"
