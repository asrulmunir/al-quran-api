@echo off
REM 🕌 Al-Quran API - One-Click Deployment Script (Windows Batch)
REM Deploy your own Quran API on Cloudflare Workers in minutes!

echo 🕌 Al-Quran API Deployment Script (Windows)
echo =============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ npm is installed

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Install Wrangler globally if not already installed
wrangler --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔧 Installing Wrangler CLI...
    npm install -g wrangler
) else (
    echo ✅ Wrangler CLI is already installed
)

REM Check if user is logged in to Wrangler
echo 🔐 Checking Cloudflare authentication...
wrangler whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  You need to login to Cloudflare first
    echo 🚀 Opening Cloudflare login...
    wrangler login
) else (
    echo ✅ Already logged in to Cloudflare
)

echo.
echo 🎨 Let's customize your API...
echo.

REM Get API name
set /p API_NAME="Enter your API name (e.g., quran-api-masjid): "
if "%API_NAME%"=="" (
    for /f %%i in ('powershell -command "Get-Date -UFormat %%s"') do set timestamp=%%i
    set API_NAME=quran-api-%timestamp%
    echo Using default name: %API_NAME%
)

REM Get Pages project name
set /p PAGES_NAME="Enter your Pages project name (e.g., quran-interface): "
if "%PAGES_NAME%"=="" (
    for /f %%i in ('powershell -command "Get-Date -UFormat %%s"') do set timestamp=%%i
    set PAGES_NAME=quran-interface-%timestamp%
    echo Using default name: %PAGES_NAME%
)

REM Update wrangler.toml
echo 📝 Updating configuration...
powershell -command "(Get-Content 'wrangler.toml') -replace 'name = \"al-quran-api\"', 'name = \"%API_NAME%\"' | Set-Content 'wrangler.toml'"

REM Deploy API to Workers
echo.
echo 🚀 Deploying API to Cloudflare Workers...

REM Capture deployment output
wrangler deploy > deploy_output.tmp 2>&1
set DEPLOY_STATUS=%errorlevel%

if %DEPLOY_STATUS% equ 0 (
    set WORKER_URL=https://%API_NAME%.asrulmunir.workers.dev
    echo ✅ API deployed successfully!
    echo    API URL: %WORKER_URL%
) else (
    echo ❌ API deployment failed
    type deploy_output.tmp
    
    REM Check for subdomain conflicts
    findstr /i "subdomain.*already.*taken name.*already.*exists already.*in.*use Script.*name.*already.*exists" deploy_output.tmp >nul
    if %errorlevel% equ 0 (
        echo.
        echo ⚠️  The subdomain '%API_NAME%' is already taken by another user.
        echo 💡 Suggested alternatives:
        for /f %%i in ('powershell -command "Get-Date -UFormat %%s"') do set timestamp=%%i
        echo    • %API_NAME%-%timestamp%
        echo    • %API_NAME%-masjid
        echo    • %API_NAME%-%USERNAME%
        echo    • my-%API_NAME%
        echo.
        
        set /p NEW_API_NAME="Enter a new API name (or press Enter to auto-generate): "
        if "%NEW_API_NAME%"=="" (
            set NEW_API_NAME=%API_NAME%-%timestamp%
            echo Auto-generated name: %NEW_API_NAME%
        )
        
        REM Update wrangler.toml with new name
        powershell -command "(Get-Content 'wrangler.toml') -replace 'name = \"%API_NAME%\"', 'name = \"%NEW_API_NAME%\"' | Set-Content 'wrangler.toml'"
        set API_NAME=%NEW_API_NAME%
        
        echo 🔄 Retrying deployment with: %API_NAME%
        wrangler deploy
        if %errorlevel% equ 0 (
            set WORKER_URL=https://%API_NAME%.asrulmunir.workers.dev
            echo ✅ API deployed successfully with new name!
            echo    API URL: %WORKER_URL%
        ) else (
            echo ❌ Deployment failed again.
            set WORKER_URL=https://%API_NAME%.asrulmunir.workers.dev (deployment failed)
        )
    ) else (
        echo ⚠️  Deployment failed for unknown reason.
        set WORKER_URL=https://%API_NAME%.asrulmunir.workers.dev (deployment failed)
    )
)

REM Clean up temp file
del deploy_output.tmp 2>nul

REM Update test interface
echo 📝 Updating test interface...
powershell -command "(Get-Content 'public/index.html') -replace 'https://quran-api.asrulmunir.workers.dev', '%WORKER_URL%' | Set-Content 'public/index.html'"

REM Deploy Pages
echo.
echo 🌐 Deploying test interface to Cloudflare Pages...
echo Note: This may take a few moments...

REM Deploy and capture output
wrangler pages deploy public --project-name=%PAGES_NAME% --commit-dirty=true > pages_output.tmp 2>&1
set PAGES_STATUS=%errorlevel%

if %PAGES_STATUS% equ 0 (
    echo ✅ Pages deployed successfully!
    
    REM Try to extract actual URL, fallback to standard format
    for /f "tokens=*" %%i in ('findstr /r "https://.*\.pages\.dev" pages_output.tmp 2^>nul') do set PAGES_URL_LINE=%%i
    if defined PAGES_URL_LINE (
        for /f "tokens=2" %%j in ("%PAGES_URL_LINE%") do set PAGES_URL=%%j
    ) else (
        set PAGES_URL=https://%PAGES_NAME%.pages.dev
    )
    
    echo 📝 Note: The actual URL may have a hash prefix.
) else (
    echo ❌ Pages deployment failed
    type pages_output.tmp
    
    REM Check for Pages naming conflicts
    findstr /i "project.*already.*exists name.*already.*taken already.*in.*use" pages_output.tmp >nul
    if %errorlevel% equ 0 (
        echo.
        echo ⚠️  The Pages project name '%PAGES_NAME%' is already taken.
        echo 💡 Suggested alternatives:
        for /f %%i in ('powershell -command "Get-Date -UFormat %%s"') do set timestamp=%%i
        echo    • %PAGES_NAME%-%timestamp%
        echo    • %PAGES_NAME%-interface
        echo    • %PAGES_NAME%-%USERNAME%
        echo    • my-%PAGES_NAME%
        echo.
        
        set /p NEW_PAGES_NAME="Enter a new Pages project name (or press Enter to auto-generate): "
        if "%NEW_PAGES_NAME%"=="" (
            set NEW_PAGES_NAME=%PAGES_NAME%-%timestamp%
            echo Auto-generated name: %NEW_PAGES_NAME%
        )
        
        set PAGES_NAME=%NEW_PAGES_NAME%
        echo 🔄 Retrying Pages deployment with: %PAGES_NAME%
        
        wrangler pages deploy public --project-name=%PAGES_NAME% --commit-dirty=true
        if %errorlevel% equ 0 (
            echo ✅ Pages deployed successfully with new name!
            set PAGES_URL=https://%PAGES_NAME%.pages.dev
        ) else (
            echo ❌ Pages deployment failed again.
            set PAGES_URL=https://%PAGES_NAME%.pages.dev (deployment failed)
        )
    ) else (
        echo ⚠️  Pages deployment failed for unknown reason.
        set PAGES_URL=https://%PAGES_NAME%.pages.dev (deployment failed)
    )
    
    echo    You can deploy manually later with:
    echo    wrangler pages deploy public --project-name=%PAGES_NAME%
)

REM Clean up temp file
del pages_output.tmp 2>nul

echo.
echo 🎉 Deployment Complete!
echo ========================
echo.
echo 📖 Your Quran API:
echo    %WORKER_URL%
echo.
echo 🌐 Test Interface:
echo    %PAGES_URL%
echo    Alias: https://main.%PAGES_NAME%.pages.dev
echo.
echo 📊 API Endpoints:
echo    %WORKER_URL%/api/info
echo    %WORKER_URL%/api/chapters
echo    %WORKER_URL%/api/search?q=الله
echo.

REM Test the API
echo 🧪 Testing your API...
curl -s "%WORKER_URL%/api/info" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API is working correctly!
) else (
    echo ⚠️  API might still be propagating. Try again in a few minutes.
)

echo.
echo 🕌 Your Quran API is now serving the Ummah!
echo    Share it with your community and help spread Islamic knowledge.
echo.
echo 📚 Next Steps:
echo    • Test your API using the web interface
echo    • Customize the interface in public/index.html
echo    • Add your custom domain in Cloudflare Dashboard
echo    • Share with your masjid/community
echo.
echo Barakallahu feekum! 🤲

REM Restore original wrangler.toml
powershell -command "(Get-Content 'wrangler.toml') -replace 'name = \"%API_NAME%\"', 'name = \"al-quran-api\"' | Set-Content 'wrangler.toml'"

pause
