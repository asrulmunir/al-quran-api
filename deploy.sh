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
sed -i.bak "s/name = \"quran-api\"/name = \"$API_NAME\"/" wrangler.toml

# Deploy API to Workers
echo ""
echo -e "${BLUE}🚀 Deploying API to Cloudflare Workers...${NC}"
wrangler deploy

# Get the deployed URL
WORKER_URL=$(wrangler deployments list --name="$API_NAME" --format=json 2>/dev/null | head -1 | grep -o 'https://[^"]*' || echo "")

if [ -z "$WORKER_URL" ]; then
    # Fallback URL construction
    ACCOUNT_ID=$(wrangler whoami | grep "Account ID" | awk '{print $NF}')
    WORKER_URL="https://$API_NAME.$(wrangler whoami | grep -o '[^@]*@[^.]*' | cut -d'@' -f2).workers.dev"
fi

echo -e "${GREEN}✅ API deployed successfully!${NC}"
echo -e "${GREEN}   API URL: $WORKER_URL${NC}"

# Update the test interface to use the new API URL
echo -e "${BLUE}📝 Updating test interface...${NC}"
sed -i.bak "s|https://quran-api.asrulmunir.workers.dev|$WORKER_URL|g" public/index.html

# Deploy Pages
echo ""
echo -e "${BLUE}🌐 Deploying test interface to Cloudflare Pages...${NC}"
wrangler pages deploy public --project-name="$PAGES_NAME" --commit-dirty=true

# Get Pages URL (simplified)
PAGES_URL="https://$PAGES_NAME.pages.dev"

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}========================${NC}"
echo ""
echo -e "${GREEN}📖 Your Quran API:${NC}"
echo -e "   ${BLUE}$WORKER_URL${NC}"
echo ""
echo -e "${GREEN}🌐 Test Interface:${NC}"
echo -e "   ${BLUE}$PAGES_URL${NC}"
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
mv wrangler.toml.bak wrangler.toml 2>/dev/null || true
mv public/index.html.bak public/index.html 2>/dev/null || true
