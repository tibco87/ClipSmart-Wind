#!/bin/bash

echo "🚀 Nasadenie ClipSmart Translation Proxy s autentifikáciou..."
echo "=================================================="

# Kontrola závislostí
echo "📋 Kontrola závislostí..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js nie je nainštalovaný. Nainštalujte Node.js najprv."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm nie je nainštalovaný. Nainštalujte npm najprv."
    exit 1
fi

if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI nie je nainštalovaný. Inštalujem..."
    npm install -g vercel
fi

echo "✅ Všetky závislosti sú k dispozícii"

# Inštalácia npm balíčkov
echo "📦 Inštalácia npm balíčkov..."
npm install

# Login do Vercel
echo "🔐 Login do Vercel..."
vercel login

# Deployment
echo "🚀 Nasadenie na Vercel..."
vercel --prod --yes

echo ""
echo "🎉 Deployment dokončený!"
echo ""
echo "📋 Ďalšie kroky:"
echo "1. Choďte na Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Vyberte projekt 'clipsmart-translation-proxy'"
echo "3. Settings → Security → Password Protection"
echo "4. Enable Password Protection"
echo "5. Nastavte heslo: clipsmart2025"
echo "6. Save"
echo ""
echo "🔧 Po nastavení hesla otestujte:"
echo "curl -u :clipsmart2025 https://your-proxy.vercel.app/health"
echo ""
echo "📱 Rozšírenie je už aktualizované s autentifikáciou!"
echo "   Heslo: clipsmart2025"
