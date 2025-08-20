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

# Capture deployment output to check for errors
try {
    $deployOutput = wrangler deploy 2>&1 | Out-String
    $deploySuccess = $LASTEXITCODE -eq 0
    
    if ($deploySuccess) {
        $WORKER_URL = "https://$API_NAME.asrulmunir.workers.dev"
        Write-Host "✅ API deployed successfully!" -ForegroundColor Green
        Write-Host "   API URL: $WORKER_URL" -ForegroundColor Green
    } else {
        Write-Host "❌ API deployment failed" -ForegroundColor Red
        Write-Host $deployOutput -ForegroundColor Yellow
        
        # Check for subdomain conflicts
        if ($deployOutput -match "subdomain.*already.*taken|name.*already.*exists|already.*in.*use|Script name.*already exists") {
            Write-Host ""
            Write-Host "⚠️  The subdomain '$API_NAME' is already taken by another user." -ForegroundColor Yellow
            Write-Host "💡 Suggested alternatives:" -ForegroundColor Blue
            $timestamp = [int][double]::Parse((Get-Date -UFormat %s))
            Write-Host "   • $API_NAME-$timestamp"
            Write-Host "   • $API_NAME-masjid"
            Write-Host "   • $API_NAME-$env:USERNAME"
            Write-Host "   • my-$API_NAME"
            Write-Host ""
            
            $NEW_API_NAME = Read-Host "Enter a new API name (or press Enter to auto-generate)"
            if ([string]::IsNullOrWhiteSpace($NEW_API_NAME)) {
                $NEW_API_NAME = "$API_NAME-$timestamp"
                Write-Host "Auto-generated name: $NEW_API_NAME" -ForegroundColor Yellow
            }
            
            # Update wrangler.toml with new name
            $wranglerContent = Get-Content "wrangler.toml" -Raw
            $wranglerContent = $wranglerContent -replace "name = `"$API_NAME`"", "name = `"$NEW_API_NAME`""
            $wranglerContent | Set-Content "wrangler.toml"
            $API_NAME = $NEW_API_NAME
            
            Write-Host "🔄 Retrying deployment with: $API_NAME" -ForegroundColor Blue
            try {
                wrangler deploy
                if ($LASTEXITCODE -eq 0) {
                    $WORKER_URL = "https://$API_NAME.asrulmunir.workers.dev"
                    Write-Host "✅ API deployed successfully with new name!" -ForegroundColor Green
                    Write-Host "   API URL: $WORKER_URL" -ForegroundColor Green
                } else {
                    Write-Host "❌ Deployment failed again." -ForegroundColor Red
                    $WORKER_URL = "https://$API_NAME.asrulmunir.workers.dev (deployment failed)"
                }
            } catch {
                Write-Host "❌ Deployment failed again." -ForegroundColor Red
                $WORKER_URL = "https://$API_NAME.asrulmunir.workers.dev (deployment failed)"
            }
        } else {
            Write-Host "⚠️  Deployment failed for unknown reason." -ForegroundColor Yellow
            $WORKER_URL = "https://$API_NAME.asrulmunir.workers.dev (deployment failed)"
        }
    }
} catch {
    Write-Host "❌ Deployment error: $_" -ForegroundColor Red
    $WORKER_URL = "https://$API_NAME.asrulmunir.workers.dev (deployment failed)"
}

# Update the test interface to use the new API URL
Write-Host "📝 Updating test interface..." -ForegroundColor Blue
$indexContent = Get-Content "public/index.html" -Raw
$indexContent = $indexContent -replace 'https://quran-api.asrulmunir.workers.dev', $WORKER_URL
$indexContent | Set-Content "public/index.html"

# Deploy Pages
Write-Host ""
Write-Host "🌐 Deploying test interface to Cloudflare Pages..." -ForegroundColor Blue
Write-Host "Note: This may take a few moments..." -ForegroundColor Yellow

try {
    $pagesOutput = wrangler pages deploy public --project-name="$PAGES_NAME" --commit-dirty=true 2>&1 | Out-String
    $pagesSuccess = $LASTEXITCODE -eq 0
    
    if ($pagesSuccess) {
        Write-Host "✅ Pages deployed successfully!" -ForegroundColor Green
        
        # Try to extract actual URL from output
        $urlMatch = [regex]::Match($pagesOutput, 'https://[a-zA-Z0-9.-]*\.pages\.dev')
        if ($urlMatch.Success) {
            $PAGES_URL = $urlMatch.Value
        } else {
            $PAGES_URL = "https://$PAGES_NAME.pages.dev"
        }
        
        Write-Host "📝 Note: The actual URL may have a hash prefix." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Pages deployment failed" -ForegroundColor Red
        Write-Host $pagesOutput -ForegroundColor Yellow
        
        # Check for Pages naming conflicts
        if ($pagesOutput -match "project.*already.*exists|name.*already.*taken|already.*in.*use") {
            Write-Host ""
            Write-Host "⚠️  The Pages project name '$PAGES_NAME' is already taken." -ForegroundColor Yellow
            Write-Host "💡 Suggested alternatives:" -ForegroundColor Blue
            $timestamp = [int][double]::Parse((Get-Date -UFormat %s))
            Write-Host "   • $PAGES_NAME-$timestamp"
            Write-Host "   • $PAGES_NAME-interface"
            Write-Host "   • $PAGES_NAME-$env:USERNAME"
            Write-Host "   • my-$PAGES_NAME"
            Write-Host ""
            
            $NEW_PAGES_NAME = Read-Host "Enter a new Pages project name (or press Enter to auto-generate)"
            if ([string]::IsNullOrWhiteSpace($NEW_PAGES_NAME)) {
                $NEW_PAGES_NAME = "$PAGES_NAME-$timestamp"
                Write-Host "Auto-generated name: $NEW_PAGES_NAME" -ForegroundColor Yellow
            }
            
            $PAGES_NAME = $NEW_PAGES_NAME
            Write-Host "🔄 Retrying Pages deployment with: $PAGES_NAME" -ForegroundColor Blue
            
            try {
                wrangler pages deploy public --project-name="$PAGES_NAME" --commit-dirty=true
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Pages deployed successfully with new name!" -ForegroundColor Green
                    $PAGES_URL = "https://$PAGES_NAME.pages.dev"
                } else {
                    Write-Host "❌ Pages deployment failed again." -ForegroundColor Red
                    $PAGES_URL = "https://$PAGES_NAME.pages.dev (deployment failed)"
                }
            } catch {
                Write-Host "❌ Pages deployment failed again." -ForegroundColor Red
                $PAGES_URL = "https://$PAGES_NAME.pages.dev (deployment failed)"
            }
        } else {
            Write-Host "⚠️  Pages deployment failed for unknown reason." -ForegroundColor Yellow
            $PAGES_URL = "https://$PAGES_NAME.pages.dev (deployment failed)"
        }
        
        Write-Host "   You can deploy manually later with:" -ForegroundColor Yellow
        Write-Host "   wrangler pages deploy public --project-name=$PAGES_NAME" -ForegroundColor Blue
    }
} catch {
    Write-Host "❌ Pages deployment error: $_" -ForegroundColor Red
    $PAGES_URL = "https://$PAGES_NAME.pages.dev (deployment failed)"
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
