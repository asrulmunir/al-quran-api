#!/bin/bash

# 🕌 Al-Quran API - Smart Deployment Script
# Deploy your own Quran API with intelligent error handling and name suggestions

echo "🕌 Al-Quran API Smart Deployment"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to generate unique name suggestions
generate_name_suggestions() {
    local base_name="$1"
    local type="$2"
    echo -e "${BLUE}💡 Suggested ${type} names:${NC}"
    echo -e "   • ${base_name}-$(date +%s)"
    echo -e "   • ${base_name}-masjid"
    echo -e "   • ${base_name}-$(whoami)"
    echo -e "   • ${base_name}-community"
    echo -e "   • ${base_name}-$(date +%m%d)"
    echo -e "   • my-${base_name}"
}

# Function to check if a Workers subdomain is available
check_workers_availability() {
    local name="$1"
    echo -e "${BLUE}🔍 Checking if '$name' is available...${NC}"
    # Try a simple check by attempting to get info about the worker
    if curl -s --max-time 5 "https://$name.asrulmunir.workers.dev" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  '$name' appears to be in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ '$name' appears to be available${NC}"
        return 0
    fi
}

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

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

# Check authentication
echo -e "${BLUE}🔐 Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  You need to login to Cloudflare first${NC}"
    echo -e "${BLUE}🚀 Opening Cloudflare login...${NC}"
    wrangler login
else
    echo -e "${GREEN}✅ Already logged in to Cloudflare${NC}"
fi

# Get user input with smart suggestions
echo ""
echo -e "${BLUE}🎨 Let's customize your API...${NC}"
echo ""

# API Name with availability checking
while true; do
    read -p "Enter your API name (e.g., quran-api-masjid): " API_NAME
    if [ -z "$API_NAME" ]; then
        API_NAME="al-quran-api-$(date +%s)"
        echo -e "${YELLOW}Using default name: $API_NAME${NC}"
        break
    fi
    
    # Basic name validation
    if [[ ! "$API_NAME" =~ ^[a-zA-Z0-9-]+$ ]]; then
        echo -e "${RED}❌ Name can only contain letters, numbers, and hyphens${NC}"
        continue
    fi
    
    if [ ${#API_NAME} -gt 63 ]; then
        echo -e "${RED}❌ Name must be 63 characters or less${NC}"
        continue
    fi
    
    break
done

# Pages Project Name
while true; do
    read -p "Enter your Pages project name (e.g., quran-interface): " PAGES_NAME
    if [ -z "$PAGES_NAME" ]; then
        PAGES_NAME="quran-interface-$(date +%s)"
        echo -e "${YELLOW}Using default name: $PAGES_NAME${NC}"
        break
    fi
    
    # Basic name validation
    if [[ ! "$PAGES_NAME" =~ ^[a-zA-Z0-9-]+$ ]]; then
        echo -e "${RED}❌ Name can only contain letters, numbers, and hyphens${NC}"
        continue
    fi
    
    break
done

# Create backups
echo -e "${BLUE}📝 Creating backups...${NC}"
cp wrangler.toml wrangler.toml.backup
cp public/index.html public/index.html.backup

# Update wrangler.toml with user's API name
echo -e "${BLUE}📝 Updating configuration...${NC}"
sed "s/name = \"al-quran-api\"/name = \"$API_NAME\"/" wrangler.toml.backup > wrangler.toml

# Deploy API to Workers with smart error handling
echo ""
echo -e "${BLUE}🚀 Deploying API to Cloudflare Workers...${NC}"

RETRY_COUNT=0
MAX_RETRIES=3

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    DEPLOY_OUTPUT=$(wrangler deploy 2>&1)
    DEPLOY_STATUS=$?
    
    if [ $DEPLOY_STATUS -eq 0 ]; then
        WORKER_URL="https://$API_NAME.asrulmunir.workers.dev"
        echo -e "${GREEN}✅ API deployed successfully!${NC}"
        echo -e "${GREEN}   API URL: $WORKER_URL${NC}"
        break
    else
        echo -e "${RED}❌ API deployment failed (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)${NC}"
        
        # Check for subdomain conflicts
        if echo "$DEPLOY_OUTPUT" | grep -q "subdomain.*already.*taken\|name.*already.*exists\|already.*in.*use\|Script name.*already exists"; then
            echo ""
            echo -e "${YELLOW}⚠️  The subdomain '$API_NAME' is already taken.${NC}"
            generate_name_suggestions "$API_NAME" "API"
            echo ""
            read -p "Enter a new API name (or press Enter to auto-generate): " NEW_API_NAME
            
            if [ -z "$NEW_API_NAME" ]; then
                NEW_API_NAME="$API_NAME-$(date +%s)"
                echo -e "${YELLOW}Auto-generated name: $NEW_API_NAME${NC}"
            fi
            
            # Update wrangler.toml with new name
            sed "s/name = \"$API_NAME\"/name = \"$NEW_API_NAME\"/" wrangler.toml > wrangler.toml.tmp && mv wrangler.toml.tmp wrangler.toml
            API_NAME="$NEW_API_NAME"
            echo -e "${BLUE}🔄 Retrying with: $API_NAME${NC}"
        else
            echo "$DEPLOY_OUTPUT"
            echo -e "${YELLOW}⚠️  Unknown deployment error. Retrying...${NC}"
            sleep 2
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Failed to deploy API after $MAX_RETRIES attempts${NC}"
    WORKER_URL="https://$API_NAME.asrulmunir.workers.dev (deployment failed)"
fi

# Update test interface
echo -e "${BLUE}📝 Updating test interface...${NC}"
sed "s|https://quran-api.asrulmunir.workers.dev|$WORKER_URL|g" public/index.html.backup > public/index.html

# Deploy Pages with smart error handling
echo ""
echo -e "${BLUE}🌐 Deploying test interface to Cloudflare Pages...${NC}"

PAGES_RETRY_COUNT=0
while [ $PAGES_RETRY_COUNT -lt $MAX_RETRIES ]; do
    PAGES_OUTPUT=$(wrangler pages deploy public --project-name="$PAGES_NAME" --commit-dirty=true 2>&1)
    PAGES_STATUS=$?
    
    if [ $PAGES_STATUS -eq 0 ]; then
        echo -e "${GREEN}✅ Pages deployed successfully!${NC}"
        PAGES_URL="https://$PAGES_NAME.pages.dev"
        ALIAS_URL="https://main.$PAGES_NAME.pages.dev"
        break
    else
        echo -e "${RED}❌ Pages deployment failed (attempt $((PAGES_RETRY_COUNT + 1))/$MAX_RETRIES)${NC}"
        
        if echo "$PAGES_OUTPUT" | grep -q "project.*already.*exists\|name.*already.*taken"; then
            echo ""
            echo -e "${YELLOW}⚠️  The Pages project '$PAGES_NAME' is already taken.${NC}"
            generate_name_suggestions "$PAGES_NAME" "Pages"
            echo ""
            read -p "Enter a new Pages project name (or press Enter to auto-generate): " NEW_PAGES_NAME
            
            if [ -z "$NEW_PAGES_NAME" ]; then
                NEW_PAGES_NAME="$PAGES_NAME-$(date +%s)"
                echo -e "${YELLOW}Auto-generated name: $NEW_PAGES_NAME${NC}"
            fi
            
            PAGES_NAME="$NEW_PAGES_NAME"
            echo -e "${BLUE}🔄 Retrying Pages with: $PAGES_NAME${NC}"
        else
            echo "$PAGES_OUTPUT"
            sleep 2
        fi
        
        PAGES_RETRY_COUNT=$((PAGES_RETRY_COUNT + 1))
    fi
done

if [ $PAGES_RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Failed to deploy Pages after $MAX_RETRIES attempts${NC}"
    PAGES_URL="https://$PAGES_NAME.pages.dev (deployment failed)"
    ALIAS_URL="https://main.$PAGES_NAME.pages.dev (deployment failed)"
fi

# Display results
echo ""
echo -e "${GREEN}🎉 Deployment Summary${NC}"
echo -e "${GREEN}=====================${NC}"
echo ""
echo -e "${GREEN}📖 Your Quran API:${NC}"
echo -e "   ${BLUE}$WORKER_URL${NC}"
echo ""
echo -e "${GREEN}🌐 Test Interface:${NC}"
echo -e "   ${BLUE}$PAGES_URL${NC}"
if [[ "$PAGES_URL" != *"deployment failed"* ]]; then
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
if curl -s --max-time 10 "$WORKER_URL/api/info" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is working correctly!${NC}"
else
    echo -e "${YELLOW}⚠️  API might still be propagating. Try again in a few minutes.${NC}"
fi

echo ""
echo -e "${GREEN}🕌 Your Quran API is now serving the Ummah!${NC}"
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

echo -e "${GREEN}✅ Smart deployment completed!${NC}"
