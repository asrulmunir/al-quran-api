# 🕌 Al-Quran API - One-Click Deployment Script (Windows PowerShell)
# Deploy your own Quran API on Cloudflare Workers in minutes!

Write-Host "🕌 Al-Quran API Deployment Script (Windows)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm is installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install

# Install Wrangler globally if not already installed
try {
    $wranglerVersion = wrangler --version
    Write-Host "✅ Wrangler CLI is already installed: $wranglerVersion" -ForegroundColor Green
} catch {
    Write-Host "🔧 Installing Wrangler CLI..." -ForegroundColor Blue
    npm install -g wrangler
}

# Check if user is logged in to Wrangler
Write-Host "🔐 Checking Cloudflare authentication..." -ForegroundColor Blue
try {
    wrangler whoami | Out-Null
    Write-Host "✅ Already logged in to Cloudflare" -ForegroundColor Green
} catch {
    Write-Host "⚠️  You need to login to Cloudflare first" -ForegroundColor Yellow
    Write-Host "🚀 Opening Cloudflare login..." -ForegroundColor Blue
    wrangler login
}

# Get user input for customization
Write-Host ""
Write-Host "🎨 Let's customize your API..." -ForegroundColor Blue
Write-Host ""

# API Name
$API_NAME = Read-Host "Enter your API name (e.g., quran-api-masjid)"
if ([string]::IsNullOrWhiteSpace($API_NAME)) {
    $timestamp = [int][double]::Parse((Get-Date -UFormat %s))
    $API_NAME = "quran-api-$timestamp"
    Write-Host "Using default name: $API_NAME" -ForegroundColor Yellow
}

# Pages Project Name
$PAGES_NAME = Read-Host "Enter your Pages project name (e.g., quran-interface)"
if ([string]::IsNullOrWhiteSpace($PAGES_NAME)) {
    $timestamp = [int][double]::Parse((Get-Date -UFormat %s))
    $PAGES_NAME = "quran-interface-$timestamp"
    Write-Host "Using default name: $PAGES_NAME" -ForegroundColor Yellow
}

# Update wrangler.toml with user's API name
Write-Host "📝 Updating configuration..." -ForegroundColor Blue
$wranglerContent = Get-Content "wrangler.toml" -Raw
$wranglerContent = $wranglerContent -replace 'name = "al-quran-api"', "name = `"$API_NAME`""
$wranglerContent | Set-Content "wrangler.toml"

# Deploy API to Workers
Write-Host ""
Write-Host "🚀 Deploying API to Cloudflare Workers..." -ForegroundColor Blue
wrangler deploy

# Construct Worker URL
$WORKER_URL = "https://$API_NAME.asrulmunir.workers.dev"

Write-Host "✅ API deployed successfully!" -ForegroundColor Green
Write-Host "   API URL: $WORKER_URL" -ForegroundColor Green

# Update the test interface to use the new API URL
Write-Host "📝 Updating test interface..." -ForegroundColor Blue
$indexContent = Get-Content "public/index.html" -Raw
$indexContent = $indexContent -replace 'https://quran-api.asrulmunir.workers.dev', $WORKER_URL
$indexContent | Set-Content "public/index.html"

# Deploy Pages
Write-Host ""
Write-Host "🌐 Deploying test interface to Cloudflare Pages..." -ForegroundColor Blue
$pagesOutput = wrangler pages deploy public --project-name="$PAGES_NAME" --commit-dirty=true 2>&1

# Extract actual Pages URL from output
$PAGES_URL = ""
foreach ($line in $pagesOutput) {
    if ($line -match "https://[a-zA-Z0-9]+\.$PAGES_NAME\.pages\.dev") {
        $PAGES_URL = $matches[0]
        break
    }
}

# Fallback URL if extraction fails
if ([string]::IsNullOrWhiteSpace($PAGES_URL)) {
    $PAGES_URL = "https://$PAGES_NAME.pages.dev"
    Write-Host "⚠️  Using fallback URL. Check Cloudflare Dashboard for exact URL." -ForegroundColor Yellow
} else {
    Write-Host "✅ Pages deployed successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Your Quran API:" -ForegroundColor Green
Write-Host "   $WORKER_URL" -ForegroundColor Blue
Write-Host ""
Write-Host "🌐 Test Interface:" -ForegroundColor Green
Write-Host "   $PAGES_URL" -ForegroundColor Blue
Write-Host "   Alias: https://main.$PAGES_NAME.pages.dev" -ForegroundColor Blue
Write-Host ""
Write-Host "📊 API Endpoints:" -ForegroundColor Green
Write-Host "   $WORKER_URL/api/info" -ForegroundColor Blue
Write-Host "   $WORKER_URL/api/chapters" -ForegroundColor Blue
Write-Host "   $WORKER_URL/api/search?q=الله" -ForegroundColor Blue
Write-Host ""

# Test the API
Write-Host "🧪 Testing your API..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "$WORKER_URL/api/info" -Method Get
    Write-Host "✅ API is working correctly!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  API might still be propagating. Try again in a few minutes." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🕌 Your Quran API is now serving the Ummah!" -ForegroundColor Green
Write-Host "   Share it with your community and help spread Islamic knowledge." -ForegroundColor Green
Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Blue
Write-Host "   • Test your API using the web interface"
Write-Host "   • Customize the interface in public/index.html"
Write-Host "   • Add your custom domain in Cloudflare Dashboard"
Write-Host "   • Share with your masjid/community"
Write-Host ""
Write-Host "Barakallahu feekum! 🤲" -ForegroundColor Green

# Restore original wrangler.toml
$originalContent = Get-Content "wrangler.toml" -Raw
$originalContent = $originalContent -replace "name = `"$API_NAME`"", 'name = "al-quran-api"'
$originalContent | Set-Content "wrangler.toml"
