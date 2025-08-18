# 🚀 Deployment Guide - ClipSmart Translation Proxy

## 📋 Prečo potrebujeme proxy server?

**Problém:** Váš Google Translate API kľúč je exponovaný v kóde rozšírenia, čo je **bezpečnostné riziko**.

**Riešenie:** Proxy server, ktorý bezpečne spracováva preklady bez exponovania API kľúča.

## 🎯 Kroky na deployment:

### **Krok 1: Inštalácia Vercel CLI**
```bash
npm install -g vercel
```

### **Krok 2: Prihlásenie na Vercel**
```bash
vercel login
```

### **Krok 3: Deployment proxy servera**
```bash
# V priečinku s proxy-server.js
vercel

# Alebo priamo na produkciu
vercel --prod
```

### **Krok 4: Nastavenie environment variables**
```bash
# Nastavte váš Google Translate API kľúč
vercel env add GOOGLE_TRANSLATE_API_KEY

# Hodnota: váš skutočný API kľúč
AIzaSyBel24LTIb-LYj5I5kcbr2quZkAS35RAD0
```

### **Krok 5: Získanie URL proxy servera**
Po deployment dostanete URL ako:
```
https://clipsmart-proxy-xyz.vercel.app
```

### **Krok 6: Aktualizácia background.js**
```javascript
// Zmeňte túto URL na vašu
const TRANSLATE_PROXY_URL = 'https://clipsmart-proxy-xyz.vercel.app/translate';
```

## 🔒 Bezpečnostné opatrenia:

### **1. Google Cloud Console obmedzenia:**
- Choďte na [Google Cloud Console](https://console.cloud.google.com/)
- APIs & Services → Credentials
- Kliknite na váš API kľúč
- Nastavte obmedzenia:

```
HTTP referrer obmedzenia:
https://clipsmart-proxy-xyz.vercel.app/*

API obmedzenia:
- Povoľte len: Cloud Translation API

Kvóty:
- Denný limit: 1,000 prekladov
- Limit per minute: 10 prekladov
```

### **2. Proxy server bezpečnosť:**
- ✅ Rate limiting (100 prekladov/hodinu na IP)
- ✅ Extension ID overenie
- ✅ CORS obmedzenia len pre Chrome extensions
- ✅ Validácia vstupu
- ✅ Timeout (10 sekúnd)
- ✅ Error handling

## 🧪 Testovanie:

### **Test proxy servera:**
```bash
curl -X POST https://clipsmart-proxy-xyz.vercel.app/translate \
  -H "Content-Type: application/json" \
  -H "X-Extension-Id: nbpndheaoecmgnlmfpleeahoicpcbppj" \
  -d '{"text":"Hello world","targetLang":"sk"}'
```

### **Test rozšírenia:**
1. Nainštalujte rozšírenie
2. Skopírujte text
3. Skúste preklad
4. Skontrolujte console pre chyby

## 📊 Monitoring:

### **Vercel Dashboard:**
- Functions → Logs
- Analytics → Function invocations
- Environment variables

### **Google Cloud Console:**
- APIs & Services → Dashboard
- Cloud Translation API → Quotas
- Monitoring → Metrics

## 🚨 Troubleshooting:

### **Chyba: "Unauthorized extension"**
- Skontrolujte `X-Extension-Id` header
- Overte extension ID v `proxy-server.js`

### **Chyba: "API quota exceeded"**
- Skontrolujte Google Cloud kvóty
- Zvýšte limity ak potrebujete

### **Chyba: "Translation failed"**
- Skontrolujte Vercel logs
- Overte environment variables

## ✅ Výhody tohto riešenia:

1. **Bezpečnosť:** API kľúč nikdy neopustí server
2. **Kontrola:** Rate limiting a validácia
3. **Monitoring:** Logy a metriky
4. **Škálovateľnosť:** Vercel serverless
5. **Náklady:** Zadarmo pre malé objemy

## 🔄 Alternatívne riešenia:

### **1. Cloudflare Workers:**
- Rýchlejšie, lacnejšie
- Komplexnejšia konfigurácia

### **2. Firebase Functions:**
- Google ekosystém
- Drahšie pre väčšie objemy

### **3. Vlastný server:**
- Plná kontrola
- Vysoké náklady na údržbu

## 📞 Podpora:

Ak máte problémy:
1. Skontrolujte Vercel logs
2. Overte environment variables
3. Testujte proxy server samostatne
4. Skontrolujte Google Cloud obmedzenia
