#!/bin/bash

# 🚀 ClipSmart Translation Proxy - Deployment Script
# Tento script automaticky nasadí váš proxy server na Vercel

set -e  # Zastaví sa pri prvej chybe

# Farba pre výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcia pre výpis
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kontrola prítomnosti potrebných súborov
check_files() {
    print_status "Kontrolujem potrebné súbory..."
    
    required_files=("proxy-server.js" "package.json" "vercel.json")
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Chýba súbor: $file"
            exit 1
        fi
    done
    
    print_success "Všetky potrebné súbory sú prítomné"
}

# Kontrola Node.js a npm
check_dependencies() {
    print_status "Kontrolujem Node.js a npm..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js nie je nainštalovaný"
        print_status "Nainštalujte Node.js z: https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm nie je nainštalovaný"
        exit 1
    fi
    
    print_success "Node.js $(node --version) a npm $(npm --version) sú nainštalované"
}

# Kontrola Vercel CLI
check_vercel() {
    print_status "Kontrolujem Vercel CLI..."
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI nie je nainštalovaný"
        print_status "Inštalujem Vercel CLI..."
        npm install -g vercel
        
        if ! command -v vercel &> /dev/null; then
            print_error "Nepodarilo sa nainštalovať Vercel CLI"
            exit 1
        fi
    fi
    
    print_success "Vercel CLI je nainštalovaný"
}

# Inštalácia závislostí
install_dependencies() {
    print_status "Inštalujem závislosti..."
    
    if [ -d "node_modules" ]; then
        print_status "Odstraňujem existujúce node_modules..."
        rm -rf node_modules
    fi
    
    npm install
    print_success "Závislosti sú nainštalované"
}

# Deployment na Vercel
deploy_to_vercel() {
    print_status "Spúšťam deployment na Vercel..."
    
    # Kontrola či je používateľ prihlásený
    if ! vercel whoami &> /dev/null; then
        print_warning "Nie ste prihlásený na Vercel"
        print_status "Prihlasujem sa..."
        vercel login
    fi
    
    # Deployment
    print_status "Deployujem na produkciu..."
    vercel --prod --yes
    
    print_success "Deployment dokončený!"
}

# Nastavenie environment variables
setup_environment() {
    print_status "Nastavujem environment variables..."
    
    # Získanie URL z posledného deploymentu
    PROJECT_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "")
    
    if [ -z "$PROJECT_URL" ]; then
        print_warning "Nepodarilo sa získať URL projektu"
        print_status "Nastavte environment variables manuálne:"
        echo "vercel env add GOOGLE_TRANSLATE_API_KEY"
        return
    fi
    
    print_success "Projekt URL: $PROJECT_URL"
    
    # Kontrola či už existuje API key
    if vercel env ls | grep -q "GOOGLE_TRANSLATE_API_KEY"; then
        print_status "API key už existuje"
    else
        print_warning "Nastavte váš Google Translate API key:"
        echo "vercel env add GOOGLE_TRANSLATE_API_KEY"
        echo "Hodnota: váš skutočný API key"
    fi
}

# Test proxy servera
test_proxy() {
    print_status "Testujem proxy server..."
    
    PROJECT_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "")
    
    if [ -z "$PROJECT_URL" ]; then
        print_warning "Nepodarilo sa získať URL pre testovanie"
        return
    fi
    
    print_status "Testujem health endpoint..."
    
    if command -v curl &> /dev/null; then
        HEALTH_RESPONSE=$(curl -s "$PROJECT_URL/health")
        if echo "$HEALTH_RESPONSE" | grep -q "status.*OK"; then
            print_success "Health check úspešný"
        else
            print_warning "Health check zlyhal: $HEALTH_RESPONSE"
        fi
    else
        print_warning "curl nie je dostupný pre testovanie"
    fi
}

# Hlavná funkcia
main() {
    echo -e "${BLUE}🚀 ClipSmart Translation Proxy - Deployment${NC}"
    echo "=================================================="
    
    check_files
    check_dependencies
    check_vercel
    install_dependencies
    deploy_to_vercel
    setup_environment
    test_proxy
    
    echo ""
    echo -e "${GREEN}✅ Deployment dokončený!${NC}"
    echo ""
    echo -e "${BLUE}📋 Ďalšie kroky:${NC}"
    echo "1. Nastavte váš Google Translate API key:"
    echo "   vercel env add GOOGLE_TRANSLATE_API_KEY"
    echo ""
    echo "2. Aktualizujte background.js s novou URL:"
    echo "   const TRANSLATE_PROXY_URL = 'https://your-project.vercel.app/translate';"
    echo ""
    echo "3. Testujte rozšírenie"
    echo ""
    echo -e "${BLUE}🔗 Užitočné odkazy:${NC}"
    echo "- Vercel Dashboard: https://vercel.com/dashboard"
    echo "- Google Cloud Console: https://console.cloud.google.com/"
    echo "- ClipSmart Documentation: https://github.com/your-repo/clipsmart"
}

# Spustenie hlavnej funkcie
main "$@"
