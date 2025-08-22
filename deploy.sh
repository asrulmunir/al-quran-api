#!/bin/bash

# JQuranTree API - Pure API Deployment Script
# Deploy only the Cloudflare Workers API (no UI)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🕌 JQuranTree API - Pure API Deployment${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found${NC}"
    echo -e "${YELLOW}Please install it with: npm install -g wrangler${NC}"
    exit 1
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  You need to login to Cloudflare first${NC}"
    echo -e "${BLUE}Running: wrangler login${NC}"
    wrangler login
fi

echo -e "${GREEN}✅ Wrangler CLI ready${NC}"
echo ""

# Get API name from user
echo -e "${BLUE}📝 Configuration${NC}"
read -p "Enter your API name (e.g., my-quran-api): " API_NAME
if [ -z "$API_NAME" ]; then
    API_NAME="quran-api-$(date +%s)"
    echo -e "${YELLOW}Using default name: $API_NAME${NC}"
fi

# Update wrangler.toml with user's API name
echo -e "${BLUE}📝 Updating configuration...${NC}"
sed -i.bak "s/name = \"quran-api\"/name = \"$API_NAME\"/" wrangler.toml
echo -e "${GREEN}✅ Configuration updated${NC}"

# Install dependencies
echo ""
echo -e "${BLUE}📦 Installing dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Deploy API
echo ""
echo -e "${BLUE}🚀 Deploying API to Cloudflare Workers...${NC}"
echo -e "${YELLOW}Note: This may take a few moments...${NC}"

if wrangler deploy; then
    echo -e "${GREEN}✅ API deployed successfully!${NC}"
    
    # Get the deployed URL
    WORKER_URL="https://$API_NAME.$(wrangler whoami | grep -o '[^@]*@[^@]*' | cut -d'@' -f2).workers.dev"
    
    # Try to get the actual URL from wrangler
    ACTUAL_URL=$(wrangler list | grep "$API_NAME" | awk '{print $2}' | head -1)
    if [ -n "$ACTUAL_URL" ]; then
        WORKER_URL="$ACTUAL_URL"
    fi
    
else
    echo -e "${RED}❌ API deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}========================${NC}"
echo ""
echo -e "${GREEN}📖 Your Quran API:${NC}"
echo -e "   ${BLUE}$WORKER_URL${NC}"
echo ""
echo -e "${GREEN}📊 API Endpoints:${NC}"
echo -e "   ${BLUE}$WORKER_URL/api/info${NC} - Basic information"
echo -e "   ${BLUE}$WORKER_URL/api/chapters${NC} - List all chapters"
echo -e "   ${BLUE}$WORKER_URL/api/verses/1/1${NC} - Get specific verse"
echo -e "   ${BLUE}$WORKER_URL/api/search?q=الله${NC} - Search verses"
echo -e "   ${BLUE}$WORKER_URL/api/compare/1/1${NC} - Compare translations"
echo -e "   ${BLUE}$WORKER_URL/api/translations${NC} - Available translations"
echo ""
echo -e "${GREEN}🔧 Management:${NC}"
echo -e "   ${BLUE}wrangler tail $API_NAME${NC} - View logs"
echo -e "   ${BLUE}wrangler delete $API_NAME${NC} - Delete API"
echo ""
echo -e "${GREEN}📚 Documentation:${NC}"
echo -e "   ${BLUE}$WORKER_URL/api${NC} - API documentation"
echo ""
echo -e "${YELLOW}🕌 Your Quran API is now live and ready to use!${NC}"
echo -e "${YELLOW}Barakallahu feekum! 🤲${NC}"
