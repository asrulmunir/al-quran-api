# 🕌 Al-Quran API - Windows Smart Deployment Script
# Deploy your own Quran API with intelligent error handling and name suggestions

Write-Host "🕌 Al-Quran API Windows Smart Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Function to generate unique name suggestions
function Generate-NameSuggestions {
    param($BaseName, $Type)
    Write-Host "💡 Suggested $Type names:" -ForegroundColor Blue
    $timestamp = [int][double]::Parse((Get-Date -UFormat %s))
    Write-Host "   • $BaseName-$timestamp"
    Write-Host "   • $BaseName-masjid"
    Write-Host "   • $BaseName-$env:USERNAME"
    Write-Host "   • $BaseName-community"
    Write-Host "   • my-$BaseName"
}

# Function to validate name format
function Test-NameFormat {
    param($Name)
    if ($Name -match '^[a-zA-Z0-9-]+$' -and $Name.Length -le 63) {
        return $true
    }
    return $false
}

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

# Get user input with validation
Write-Host ""
Write-Host "🎨 Let's customize your API..." -ForegroundColor Blue
Write-Host ""

# API Name with validation
do {
    $API_NAME = Read-Host "Enter your API name (e.g., quran-api-masjid)"
    if ([string]::IsNullOrWhiteSpace($API_NAME)) {
        $timestamp = [int][double]::Parse((Get-Date -UFormat %s))
        $API_NAME = "al-quran-api-$timestamp"
        Write-Host "Using default name: $API_NAME" -ForegroundColor Yellow
        break
    }
    
    if (-not (Test-NameFormat $API_NAME)) {
        Write-Host "❌ Name can only contain letters, numbers, and hyphens (max 63 characters)" -ForegroundColor Red
        continue
    }
    break
} while ($true)

# Pages Project Name with validation
do {
    $PAGES_NAME = Read-Host "Enter your Pages project name (e.g., quran-interface)"
    if ([string]::IsNullOrWhiteSpace($PAGES_NAME)) {
        $timestamp = [int][double]::Parse((Get-Date -UFormat %s))
        $PAGES_NAME = "quran-interface-$timestamp"
        Write-Host "Using default name: $PAGES_NAME" -ForegroundColor Yellow
        break
    }
    
    if (-not (Test-NameFormat $PAGES_NAME)) {
        Write-Host "❌ Name can only contain letters, numbers, and hyphens" -ForegroundColor Red
        continue
    }
    break
} while ($true)

# Create backups
Write-Host "📝 Creating backups..." -ForegroundColor Blue
Copy-Item "wrangler.toml" "wrangler.toml.backup"
Copy-Item "public/index.html" "public/index.html.backup"

# Update wrangler.toml with user's API name
Write-Host "📝 Updating configuration..." -ForegroundColor Blue
$wranglerContent = Get-Content "wrangler.toml" -Raw
$wranglerContent = $wranglerContent -replace 'name = "al-quran-api"', "name = `"$API_NAME`""
$wranglerContent | Set-Content "wrangler.toml"

# Deploy API to Workers with smart retry
Write-Host ""
Write-Host "🚀 Deploying API to Cloudflare Workers..." -ForegroundColor Blue

$retryCount = 0
$maxRetries = 3

while ($retryCount -lt $maxRetries) {
    try {
        $deployOutput = wrangler deploy 2>&1 | Out-String
        $deploySuccess = $LASTEXITCODE -eq 0
        
        if ($deploySuccess) {
            $WORKER_URL = "https://$API_NAME.asrulmunir.workers.dev"
            Write-Host "✅ API deployed successfully!" -ForegroundColor Green
            Write-Host "   API URL: $WORKER_URL" -ForegroundColor Green
            break
        } else {
            Write-Host "❌ API deployment failed (attempt $($retryCount + 1)/$maxRetries)" -ForegroundColor Red
            
            # Check for subdomain conflicts
            if ($deployOutput -match "subdomain.*already.*taken|name.*already.*exists|already.*in.*use|Script name.*already exists") {
                Write-Host ""
                Write-Host "⚠️  The subdomain '$API_NAME' is already taken." -ForegroundColor Yellow
                Generate-NameSuggestions $API_NAME "API"
                Write-Host ""
                
                $NEW_API_NAME = Read-Host "Enter a new API name (or press Enter to auto-generate)"
                if ([string]::IsNullOrWhiteSpace($NEW_API_NAME)) {
                    $timestamp = [int][double]::Parse((Get-Date -UFormat %s))
                    $NEW_API_NAME = "$API_NAME-$timestamp"
                    Write-Host "Auto-generated name: $NEW_API_NAME" -ForegroundColor Yellow
                }
                
                # Update wrangler.toml with new name
                $wranglerContent = Get-Content "wrangler.toml" -Raw
                $wranglerContent = $wranglerContent -replace "name = `"$API_NAME`"", "name = `"$NEW_API_NAME`""
                $wranglerContent | Set-Content "wrangler.toml"
                $API_NAME = $NEW_API_NAME
                Write-Host "🔄 Retrying with: $API_NAME" -ForegroundColor Blue
            } else {
                Write-Host $deployOutput -ForegroundColor Yellow
                Write-Host "⚠️  Unknown deployment error. Retrying..." -ForegroundColor Yellow
                Start-Sleep 2
            }
        }
    } catch {
        Write-Host "❌ Deployment error: $_" -ForegroundColor Red
    }
    
    $retryCount++
}

if ($retryCount -eq $maxRetries) {
    Write-Host "❌ Failed to deploy API after $maxRetries attempts" -ForegroundColor Red
    $WORKER_URL = "https://$API_NAME.asrulmunir.workers.dev (deployment failed)"
}

# Update test interface
Write-Host "📝 Updating test interface..." -ForegroundColor Blue
$indexContent = Get-Content "public/index.html.backup" -Raw
$indexContent = $indexContent -replace 'https://quran-api.asrulmunir.workers.dev', $WORKER_URL
$indexContent | Set-Content "public/index.html"

# Deploy Pages with smart retry
Write-Host ""
Write-Host "🌐 Deploying test interface to Cloudflare Pages..." -ForegroundColor Blue

$pagesRetryCount = 0
while ($pagesRetryCount -lt $maxRetries) {
    try {
        $pagesOutput = wrangler pages deploy public --project-name="$PAGES_NAME" --commit-dirty=true 2>&1 | Out-String
        $pagesSuccess = $LASTEXITCODE -eq 0
        
        if ($pagesSuccess) {
            Write-Host "✅ Pages deployed successfully!" -ForegroundColor Green
            $PAGES_URL = "https://$PAGES_NAME.pages.dev"
            break
        } else {
            Write-Host "❌ Pages deployment failed (attempt $($pagesRetryCount + 1)/$maxRetries)" -ForegroundColor Red
            
            if ($pagesOutput -match "project.*already.*exists|name.*already.*taken") {
                Write-Host ""
                Write-Host "⚠️  The Pages project '$PAGES_NAME' is already taken." -ForegroundColor Yellow
                Generate-NameSuggestions $PAGES_NAME "Pages"
                Write-Host ""
                
                $NEW_PAGES_NAME = Read-Host "Enter a new Pages project name (or press Enter to auto-generate)"
                if ([string]::IsNullOrWhiteSpace($NEW_PAGES_NAME)) {
                    $timestamp = [int][double]::Parse((Get-Date -UFormat %s))
                    $NEW_PAGES_NAME = "$PAGES_NAME-$timestamp"
                    Write-Host "Auto-generated name: $NEW_PAGES_NAME" -ForegroundColor Yellow
                }
                
                $PAGES_NAME = $NEW_PAGES_NAME
                Write-Host "🔄 Retrying Pages with: $PAGES_NAME" -ForegroundColor Blue
            } else {
                Write-Host $pagesOutput -ForegroundColor Yellow
                Start-Sleep 2
            }
        }
    } catch {
        Write-Host "❌ Pages deployment error: $_" -ForegroundColor Red
    }
    
    $pagesRetryCount++
}

if ($pagesRetryCount -eq $maxRetries) {
    Write-Host "❌ Failed to deploy Pages after $maxRetries attempts" -ForegroundColor Red
    $PAGES_URL = "https://$PAGES_NAME.pages.dev (deployment failed)"
}

# Display results
Write-Host ""
Write-Host "🎉 Deployment Summary" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Your Quran API:" -ForegroundColor Green
Write-Host "   $WORKER_URL" -ForegroundColor Blue
Write-Host ""
Write-Host "🌐 Test Interface:" -ForegroundColor Green
Write-Host "   $PAGES_URL" -ForegroundColor Blue
if (-not $PAGES_URL.Contains("deployment failed")) {
    Write-Host "   https://main.$PAGES_NAME.pages.dev" -ForegroundColor Blue
}
Write-Host ""
Write-Host "📊 API Endpoints:" -ForegroundColor Green
Write-Host "   $WORKER_URL/api/info" -ForegroundColor Blue
Write-Host "   $WORKER_URL/api/chapters" -ForegroundColor Blue
Write-Host "   $WORKER_URL/api/search?q=الله" -ForegroundColor Blue
Write-Host ""

# Test the API
Write-Host "🧪 Testing your API..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "$WORKER_URL/api/info" -Method Get -TimeoutSec 10
    Write-Host "✅ API is working correctly!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  API might still be propagating. Try again in a few minutes." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🕌 Your Quran API is now serving the Ummah!" -ForegroundColor Green
Write-Host "Barakallahu feekum! 🤲" -ForegroundColor Green

# Restore original files
Write-Host ""
Write-Host "🔄 Restoring original configuration files..." -ForegroundColor Blue
if (Test-Path "wrangler.toml.backup") {
    Move-Item "wrangler.toml.backup" "wrangler.toml" -Force
    Write-Host "✅ wrangler.toml restored" -ForegroundColor Green
}
if (Test-Path "public/index.html.backup") {
    Move-Item "public/index.html.backup" "public/index.html" -Force
    Write-Host "✅ index.html restored" -ForegroundColor Green
}

Write-Host "✅ Smart deployment completed!" -ForegroundColor Green
