@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 🚀 ClipSmart Translation Proxy - Deployment Script (Windows)
REM Tento script automaticky nasadí váš proxy server na Vercel

echo 🚀 ClipSmart Translation Proxy - Deployment
echo ==================================================

REM Kontrola potrebných súborov
echo [INFO] Kontrolujem potrebné súbory...
if not exist "proxy-server.js" (
    echo [ERROR] Chýba súbor: proxy-server.js
    pause
    exit /b 1
)
if not exist "package.json" (
    echo [ERROR] Chýba súbor: package.json
    pause
    exit /b 1
)
if not exist "vercel.json" (
    echo [ERROR] Chýba súbor: vercel.json
    pause
    exit /b 1
)
echo [SUCCESS] Všetky potrebné súbory sú prítomné

REM Kontrola Node.js a npm
echo [INFO] Kontrolujem Node.js a npm...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js nie je nainštalovaný
    echo [INFO] Nainštalujte Node.js z: https://nodejs.org/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm nie je nainštalovaný
    pause
    exit /b 1
)
echo [SUCCESS] Node.js a npm sú nainštalované

REM Kontrola Vercel CLI
echo [INFO] Kontrolujem Vercel CLI...
vercel --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Vercel CLI nie je nainštalovaný
    echo [INFO] Inštalujem Vercel CLI...
    npm install -g vercel
    
    vercel --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Nepodarilo sa nainštalovať Vercel CLI
        pause
        exit /b 1
    )
)
echo [SUCCESS] Vercel CLI je nainštalovaný

REM Inštalácia závislostí
echo [INFO] Inštalujem závislosti...
if exist "node_modules" (
    echo [INFO] Odstraňujem existujúce node_modules...
    rmdir /s /q "node_modules"
)
npm install
if errorlevel 1 (
    echo [ERROR] Nepodarilo sa nainštalovať závislosti
    pause
    exit /b 1
)
echo [SUCCESS] Závislosti sú nainštalované

REM Deployment na Vercel
echo [INFO] Spúšťam deployment na Vercel...

REM Kontrola či je používateľ prihlásený
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Nie ste prihlásený na Vercel
    echo [INFO] Prihlasujem sa...
    vercel login
)

REM Deployment
echo [INFO] Deployujem na produkciu...
vercel --prod --yes
if errorlevel 1 (
    echo [ERROR] Deployment zlyhal
    pause
    exit /b 1
)
echo [SUCCESS] Deployment dokončený!

REM Nastavenie environment variables
echo [INFO] Nastavujem environment variables...
echo [WARNING] Nastavte váš Google Translate API key:
echo vercel env add GOOGLE_TRANSLATE_API_KEY
echo Hodnota: váš skutočný API key

echo.
echo ✅ Deployment dokončený!
echo.
echo 📋 Ďalšie kroky:
echo 1. Nastavte váš Google Translate API key:
echo    vercel env add GOOGLE_TRANSLATE_API_KEY
echo.
echo 2. Aktualizujte background.js s novou URL:
echo    const TRANSLATE_PROXY_URL = 'https://your-project.vercel.app/translate';
echo.
echo 3. Testujte rozšírenie
echo.
echo 🔗 Užitočné odkazy:
echo - Vercel Dashboard: https://vercel.com/dashboard
echo - Google Cloud Console: https://console.cloud.google.com/
echo - ClipSmart Documentation: https://github.com/your-repo/clipsmart

pause
