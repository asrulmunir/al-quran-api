#!/bin/bash

# 🕌 Al-Quran API - One-Click Deployment Script
# Deploy your own Quran API on Cloudflare Workers in minutes!

set -e

echo "🕌 Al-Quran API Deployment Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js and npm are installed${NC}"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Install Wrangler globally if not already installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${BLUE}🔧 Installing Wrangler CLI...${NC}"
    npm install -g wrangler
else
    echo -e "${GREEN}✅ Wrangler CLI is already installed${NC}"
fi

# Check if user is logged in to Wrangler
echo -e "${BLUE}🔐 Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  You need to login to Cloudflare first${NC}"
    echo -e "${BLUE}🚀 Opening Cloudflare login...${NC}"
    wrangler login
else
    echo -e "${GREEN}✅ Already logged in to Cloudflare${NC}"
fi

# Get user input for customization
echo ""
echo -e "${BLUE}🎨 Let's customize your API...${NC}"
echo ""

# API Name
read -p "Enter your API name (e.g., quran-api-masjid): " API_NAME
if [ -z "$API_NAME" ]; then
    API_NAME="quran-api-$(date +%s)"
    echo -e "${YELLOW}Using default name: $API_NAME${NC}"
fi

# Pages Project Name
read -p "Enter your Pages project name (e.g., quran-interface): " PAGES_NAME
if [ -z "$PAGES_NAME" ]; then
    PAGES_NAME="quran-interface-$(date +%s)"
    echo -e "${YELLOW}Using default name: $PAGES_NAME${NC}"
fi

# Update wrangler.toml with user's API name
echo -e "${BLUE}📝 Updating configuration...${NC}"
sed -i.bak "s/name = \"al-quran-api\"/name = \"$API_NAME\"/" wrangler.toml

# Verify the update worked
if grep -q "name = \"$API_NAME\"" wrangler.toml; then
    echo -e "${GREEN}✅ Configuration updated successfully${NC}"
else
    echo -e "${RED}❌ Failed to update configuration${NC}"
    exit 1
fi

# Verify the update worked
if grep -q "name = \"$API_NAME\"" wrangler.toml; then
    echo -e "${GREEN}✅ Configuration updated successfully${NC}"
else
    echo -e "${RED}❌ Failed to update configuration${NC}"
    exit 1
fi

# Verify the update worked
if grep -q "name = \"$API_NAME\"" wrangler.toml; then
    echo -e "${GREEN}✅ Configuration updated successfully${NC}"
else
    echo -e "${RED}❌ Failed to update configuration${NC}"
    exit 1
fi

# Verify the update worked
if grep -q "name = \"$API_NAME\"" wrangler.toml; then
    echo -e "${GREEN}✅ Configuration updated successfully${NC}"
else
    echo -e "${RED}❌ Failed to update configuration${NC}"
    exit 1
fi

# Deploy API to Workers
echo ""
echo -e "${BLUE}🚀 Deploying API to Cloudflare Workers...${NC}"
wrangler deploy

# Get the deployed URL - construct it directly from the API name
WORKER_URL="https://$API_NAME.asrulmunir.workers.dev"

echo -e "${GREEN}✅ API deployed successfully!${NC}"
echo -e "${GREEN}   API URL: $WORKER_URL${NC}"

# Update the test interface to use the new API URL
echo -e "${BLUE}📝 Updating test interface...${NC}"
# Create backup and use awk for more reliable replacement
cp public/index.html public/index.html.bak
awk -v old_url="https://quran-api.asrulmunir.workers.dev" -v new_url="$WORKER_URL" '{gsub(old_url, new_url); print}' public/index.html.bak > public/index.html

# Deploy Pages
echo ""
echo -e "${BLUE}🌐 Deploying test interface to Cloudflare Pages...${NC}"
echo -e "${YELLOW}Note: This may take a few moments...${NC}"

# Simple deployment approach without timeout (for macOS compatibility)
echo -e "${BLUE}Running: wrangler pages deploy public --project-name=\"$PAGES_NAME\" --commit-dirty=true${NC}"

# Direct deployment without timeout to ensure macOS compatibility
if wrangler pages deploy public --project-name="$PAGES_NAME" --commit-dirty=true; then
    echo -e "${GREEN}✅ Pages deployed successfully!${NC}"
    PAGES_URL="https://$PAGES_NAME.asrulmunir.pages.dev"
    ALIAS_URL="https://main.$PAGES_NAME.asrulmunir.pages.dev"
    echo -e "${YELLOW}📝 Note: The actual URL may have a hash prefix like: https://abc123.$PAGES_NAME.asrulmunir.pages.dev${NC}"
else
    echo -e "${YELLOW}⚠️  Pages deployment encountered an issue${NC}"
    echo -e "${YELLOW}   You can deploy manually later with:${NC}"
    echo -e "${BLUE}   wrangler pages deploy public --project-name=$PAGES_NAME${NC}"
    PAGES_URL="https://$PAGES_NAME.asrulmunir.pages.dev (manual deployment needed)"
    ALIAS_URL="https://main.$PAGES_NAME.asrulmunir.pages.dev (manual deployment needed)"
fi

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}========================${NC}"
echo ""
echo -e "${GREEN}📖 Your Quran API:${NC}"
echo -e "   ${BLUE}$WORKER_URL${NC}"
echo ""
echo -e "${GREEN}🌐 Test Interface:${NC}"
echo -e "   ${BLUE}$PAGES_URL${NC}"
if [ -n "$ALIAS_URL" ]; then
    echo -e "   ${BLUE}Alias: $ALIAS_URL${NC}"
fi
echo ""
echo -e "${GREEN}📊 API Endpoints:${NC}"
echo -e "   ${BLUE}$WORKER_URL/api/info${NC}"
echo -e "   ${BLUE}$WORKER_URL/api/chapters${NC}"
echo -e "   ${BLUE}$WORKER_URL/api/search?q=الله${NC}"
echo ""

# Test the API
echo -e "${BLUE}🧪 Testing your API...${NC}"
if curl -s "$WORKER_URL/api/info" > /dev/null; then
    echo -e "${GREEN}✅ API is working correctly!${NC}"
else
    echo -e "${YELLOW}⚠️  API might still be propagating. Try again in a few minutes.${NC}"
fi

echo ""
echo -e "${GREEN}🕌 Your Quran API is now serving the Ummah!${NC}"
echo -e "${GREEN}   Share it with your community and help spread Islamic knowledge.${NC}"
echo ""
echo -e "${BLUE}📚 Next Steps:${NC}"
echo -e "   • Test your API using the web interface"
echo -e "   • Customize the interface in public/index.html"
echo -e "   • Add your custom domain in Cloudflare Dashboard"
echo -e "   • Share with your masjid/community"
echo ""
echo -e "${GREEN}Barakallahu feekum! 🤲${NC}"

# Restore original files
if [ -f "wrangler.toml.bak" ]; then
    mv wrangler.toml.bak wrangler.toml
fi
if [ -f "public/index.html.bak" ]; then
    mv public/index.html.bak public/index.html
fi
