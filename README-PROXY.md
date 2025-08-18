# 🚀 ClipSmart Translation Proxy

Bezpečný proxy server pre ClipSmart Google Translate API s pokročilými bezpečnostnými funkciami.

## 📋 Prečo potrebujeme proxy server?

**Problém:** Google Translate API kľúč je exponovaný v Chrome rozšírení, čo je **bezpečnostné riziko**.

**Riešenie:** Proxy server, ktorý bezpečne spracováva preklady bez exponovania API kľúča.

## ✨ Funkcie

- 🔒 **Bezpečnosť:** API kľúč nikdy neopustí server
- 🚦 **Rate Limiting:** 100 prekladov za hodinu na IP
- 🔐 **Extension ID Overenie:** Len povolené rozšírenia
- 🌐 **CORS Obrmedzenia:** Len pre Chrome extensions
- 📊 **Monitoring:** Podrobné logy a metriky
- 🧪 **Testovanie:** Kompletné testovacie skripty
- 🚀 **Deployment:** Automatický deployment na Vercel

## 🏗️ Architektúra

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   ClipSmart     │───▶│   Proxy Server   │───▶│  Google Translate  │
│   Extension     │    │   (Vercel)       │    │      API           │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## 🚀 Rýchly Start

### **Krok 1: Inštalácia závislostí**
```bash
npm install
```

### **Krok 2: Spustenie lokálneho servera**
```bash
npm start
```

### **Krok 3: Testovanie**
```bash
npm test
```

### **Krok 4: Deployment na Vercel**
```bash
# Linux/Mac
./deploy.sh

# Windows
deploy.bat
```

## 📁 Štruktúra súborov

```
├── proxy-server.js      # Hlavný proxy server
├── package.json         # Závislosti a skripty
├── vercel.json         # Vercel konfigurácia
├── deploy.sh           # Deployment script (Linux/Mac)
├── deploy.bat          # Deployment script (Windows)
├── test-proxy.js       # Testovací script
└── README-PROXY.md     # Tento súbor
```

## ⚙️ Konfigurácia

### **Environment Variables**

```bash
# Povinné
GOOGLE_TRANSLATE_API_KEY=your_api_key_here

# Voliteľné
NODE_ENV=production
PORT=3000
```

### **Konfigurácia servera**

```javascript
const CONFIG = {
    MAX_TEXT_LENGTH: 5000,           // Max dĺžka textu
    REQUEST_TIMEOUT: 10000,          // Timeout v ms
    ALLOWED_EXTENSIONS: [            // Povolené extension ID
        'nbpndheaoecmgnlmfpleeahoicpcbppj',
        'test-extension-id'
    ],
    RATE_LIMIT: {
        windowMs: 60 * 60 * 1000,    // 1 hodina
        max: 100                      // 100 prekladov za hodinu
    }
};
```

## 🔌 API Endpoints

### **POST /translate**
Preklad textu pomocou Google Translate API.

**Request:**
```json
{
    "text": "Hello world",
    "targetLang": "sk",
    "sourceLang": "en"  // voliteľné
}
```

**Headers:**
```
Content-Type: application/json
X-Extension-Id: your_extension_id
```

**Response:**
```json
{
    "success": true,
    "translation": "Ahoj svet",
    "detectedLanguage": "en",
    "sourceLanguage": "en",
    "targetLanguage": "sk",
    "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### **GET /health**
Health check endpoint pre monitoring.

**Response:**
```json
{
    "status": "OK",
    "timestamp": "2025-01-27T10:30:00.000Z",
    "service": "ClipSmart Translation Proxy",
    "version": "1.0.0",
    "environment": "production",
    "uptime": 3600,
    "memory": {...},
    "config": {...},
    "apiKey": "✅ Configured"
}
```

### **GET /**
Informácie o službe.

**Response:**
```json
{
    "service": "ClipSmart Translation Proxy",
    "version": "1.0.0",
    "endpoints": {
        "translate": "POST /translate",
        "health": "GET /health"
    },
    "documentation": "https://github.com/your-repo/clipsmart-proxy"
}
```

## 🚀 Deployment

### **Automatický Deployment (Odporúčané)**

#### **Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

#### **Windows:**
```cmd
deploy.bat
```

### **Manuálny Deployment**

#### **Krok 1: Inštalácia Vercel CLI**
```bash
npm install -g vercel
```

#### **Krok 2: Prihlásenie**
```bash
vercel login
```

#### **Krok 3: Deployment**
```bash
vercel --prod
```

#### **Krok 4: Nastavenie API kľúča**
```bash
vercel env add GOOGLE_TRANSLATE_API_KEY
```

## 🧪 Testovanie

### **Lokálne testovanie**
```bash
# Spustite server
npm start

# V novom termináli
npm test
```

### **Testovanie po deploymente**
```bash
# Zmeňte PROXY_URL v test-proxy.js
# Spustite testy
node test-proxy.js
```

### **Manuálne testovanie**
```bash
# Health check
curl https://your-proxy.vercel.app/health

# Preklad
curl -X POST https://your-proxy.vercel.app/translate \
  -H "Content-Type: application/json" \
  -H "X-Extension-Id: test-extension-id" \
  -d '{"text":"Hello","targetLang":"sk"}'
```

## 🔒 Bezpečnosť

### **Implementované opatrenia**

1. **API Key Ochránenie**
   - API kľúč je uložený ako environment variable
   - Nikdy sa neposiela klientom

2. **Extension ID Overenie**
   - Len povolené extension ID môžu používať službu
   - Konfigurovateľný zoznam povolených ID

3. **Rate Limiting**
   - 100 prekladov za hodinu na IP adresu
   - Konfigurovateľné limity

4. **CORS Obrmedzenia**
   - Len Chrome extensions môžu pristupovať
   - Blokuje webové stránky

5. **Input Validácia**
   - Kontrola dĺžky textu (max 5000 znakov)
   - Validácia jazykových kódov
   - Sanitizácia vstupu

6. **Error Handling**
   - Bezpečné error správy
   - Logovanie pre monitoring
   - Timeout ochrana

### **Google Cloud Console Obmedzenia**

Nastavte obmedzenia na váš API kľúč:

```
HTTP referrer obmedzenia:
https://your-proxy.vercel.app/*

API obmedzenia:
- Povoľte len: Cloud Translation API

Kvóty:
- Denný limit: 1,000 prekladov
- Limit per minute: 10 prekladov
```

## 📊 Monitoring

### **Vercel Dashboard**
- Functions → Logs
- Analytics → Function invocations
- Environment variables

### **Health Check**
```bash
curl https://your-proxy.vercel.app/health
```

### **Logy**
Všetky requesty a chyby sú logované s timestampom a detailmi.

## 🚨 Troubleshooting

### **Chyba: "Unauthorized extension"**
- Skontrolujte `X-Extension-Id` header
- Overte extension ID v `CONFIG.ALLOWED_EXTENSIONS`

### **Chyba: "API quota exceeded"**
- Skontrolujte Google Cloud kvóty
- Zvýšte limity ak potrebujete

### **Chyba: "Translation failed"**
- Skontrolujte Vercel logs
- Overte environment variables
- Skontrolujte Google Translate API status

### **Chyba: "Rate limit exceeded"**
- Počkajte do resetu limitu (1 hodina)
- Zvýšte `RATE_LIMIT.max` ak potrebujete

## 🔄 Aktualizácia

### **Aktualizácia kódu**
```bash
git pull origin main
npm install
./deploy.sh
```

### **Aktualizácia závislostí**
```bash
npm update
./deploy.sh
```

## 📞 Podpora

### **Užitočné odkazy**
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Translate API Docs](https://cloud.google.com/translate/docs)

### **Problémy**
1. Skontrolujte Vercel logs
2. Overte environment variables
3. Testujte proxy server samostatne
4. Skontrolujte Google Cloud obmedzenia

## 📄 Licencia

MIT License - pozri [LICENSE](LICENSE) súbor.

## 🤝 Príspevky

Príspevky sú vítané! Prosím:
1. Fork repozitára
2. Vytvorte feature branch
3. Commit zmeny
4. Push do branch
5. Vytvorte Pull Request

---

**ClipSmart Translation Proxy** - Bezpečné preklady pre vaše rozšírenie! 🚀
