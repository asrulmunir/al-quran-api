#!/bin/bash

# 🕌 Al-Quran API - macOS Deployment Script
# Deploy your own Quran API on Cloudflare Workers in minutes!
# Optimized for macOS without external dependencies

echo "🕌 Al-Quran API macOS Deployment"
echo "================================"
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
    API_NAME="al-quran-api-$(date +%s)"
    echo -e "${YELLOW}Using default name: $API_NAME${NC}"
fi

# Pages Project Name
read -p "Enter your Pages project name (e.g., quran-interface): " PAGES_NAME
if [ -z "$PAGES_NAME" ]; then
    PAGES_NAME="quran-interface-$(date +%s)"
    echo -e "${YELLOW}Using default name: $PAGES_NAME${NC}"
fi

# Create backups
echo -e "${BLUE}📝 Creating backups...${NC}"
cp wrangler.toml wrangler.toml.backup
cp public/index.html public/index.html.backup

# Update wrangler.toml with user's API name
echo -e "${BLUE}📝 Updating configuration...${NC}"
sed "s/name = \"al-quran-api\"/name = \"$API_NAME\"/" wrangler.toml.backup > wrangler.toml

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

# Capture deployment output to check for errors
DEPLOY_OUTPUT=$(wrangler deploy 2>&1)
DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
    WORKER_URL="https://$API_NAME.asrulmunir.workers.dev"
    echo -e "${GREEN}✅ API deployed successfully!${NC}"
    echo -e "${GREEN}   API URL: $WORKER_URL${NC}"
else
    echo -e "${RED}❌ API deployment failed${NC}"
    echo "$DEPLOY_OUTPUT"
    
    # Check for subdomain conflicts
    if echo "$DEPLOY_OUTPUT" | grep -q "subdomain.*already.*taken\|name.*already.*exists\|already.*in.*use\|Script name.*already exists"; then
        echo ""
        echo -e "${YELLOW}⚠️  The subdomain '$API_NAME' is already taken by another user.${NC}"
        echo -e "${BLUE}💡 Suggested alternatives:${NC}"
        echo -e "   • $API_NAME-$(date +%s)"
        echo -e "   • $API_NAME-masjid"
        echo -e "   • $API_NAME-$(whoami)"
        echo ""
        read -p "Enter a new API name: " NEW_API_NAME
        if [ -n "$NEW_API_NAME" ]; then
            # Update wrangler.toml with new name
            sed "s/name = \"$API_NAME\"/name = \"$NEW_API_NAME\"/" wrangler.toml > wrangler.toml.tmp && mv wrangler.toml.tmp wrangler.toml
            API_NAME="$NEW_API_NAME"
            echo -e "${BLUE}🔄 Retrying deployment with: $API_NAME${NC}"
            if wrangler deploy; then
                WORKER_URL="https://$API_NAME.asrulmunir.workers.dev"
                echo -e "${GREEN}✅ API deployed successfully with new name!${NC}"
                echo -e "${GREEN}   API URL: $WORKER_URL${NC}"
            else
                echo -e "${RED}❌ Deployment failed again.${NC}"
                WORKER_URL="https://$API_NAME.asrulmunir.workers.dev (deployment failed)"
            fi
        else
            WORKER_URL="https://$API_NAME.asrulmunir.workers.dev (deployment failed)"
        fi
    else
        WORKER_URL="https://$API_NAME.asrulmunir.workers.dev (deployment failed)"
    fi
fi

# Update the test interface to use the new API URL
echo -e "${BLUE}📝 Updating test interface...${NC}"
sed "s|https://quran-api.asrulmunir.workers.dev|$WORKER_URL|g" public/index.html.backup > public/index.html

# Deploy Pages (macOS-friendly approach)
echo ""
echo -e "${BLUE}🌐 Deploying test interface to Cloudflare Pages...${NC}"
echo -e "${YELLOW}Note: This may take a few moments. Please be patient...${NC}"
echo -e "${BLUE}Press Ctrl+C if it hangs for more than 5 minutes${NC}"

# Simple deployment without timeout dependency
if wrangler pages deploy public --project-name="$PAGES_NAME" --commit-dirty=true; then
    echo -e "${GREEN}✅ Pages deployed successfully!${NC}"
    PAGES_URL="https://$PAGES_NAME.pages.dev"
    ALIAS_URL="https://main.$PAGES_NAME.pages.dev"
    PAGES_SUCCESS=true
else
    echo -e "${YELLOW}⚠️  Pages deployment encountered an issue${NC}"
    PAGES_URL="https://$PAGES_NAME.pages.dev (manual deployment needed)"
    ALIAS_URL="https://main.$PAGES_NAME.pages.dev (manual deployment needed)"
    PAGES_SUCCESS=false
fi

# Display results
echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}========================${NC}"
echo ""
echo -e "${GREEN}📖 Your Quran API:${NC}"
echo -e "   ${BLUE}$WORKER_URL${NC}"
echo ""
echo -e "${GREEN}🌐 Test Interface:${NC}"
echo -e "   ${BLUE}$PAGES_URL${NC}"
if [ "$PAGES_SUCCESS" = true ]; then
    echo -e "   ${BLUE}$ALIAS_URL${NC}"
fi
echo ""
echo -e "${GREEN}📊 API Endpoints:${NC}"
echo -e "   ${BLUE}$WORKER_URL/api/info${NC}"
echo -e "   ${BLUE}$WORKER_URL/api/chapters${NC}"
echo -e "   ${BLUE}$WORKER_URL/api/search?q=الله${NC}"
echo ""

# Test the API
echo -e "${BLUE}🧪 Testing your API...${NC}"
if curl -s "$WORKER_URL/api/info" > /dev/null 2>&1; then
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

if [ "$PAGES_SUCCESS" = false ]; then
    echo -e "${YELLOW}📝 Manual Pages Deployment:${NC}"
    echo -e "   If Pages deployment failed, run this command manually:"
    echo -e "   ${BLUE}wrangler pages deploy public --project-name=$PAGES_NAME${NC}"
    echo ""
fi

echo -e "${GREEN}Barakallahu feekum! 🤲${NC}"

# Restore original files
echo ""
echo -e "${BLUE}🔄 Restoring original configuration files...${NC}"
if [ -f "wrangler.toml.backup" ]; then
    mv wrangler.toml.backup wrangler.toml
    echo -e "${GREEN}✅ wrangler.toml restored${NC}"
fi
if [ -f "public/index.html.backup" ]; then
    mv public/index.html.backup public/index.html
    echo -e "${GREEN}✅ index.html restored${NC}"
fi

echo -e "${GREEN}✅ Deployment script completed successfully!${NC}"
