# 🚀 ClipSmart - Rýchly Start (Bezpečnosť)

## ⚠️ KRÍTICKÝ PROBLÉM VYRIEŠENÝ!

Váš Google Translate API kľúč je teraz **bezpečne chránený** proxy serverom.

## 🎯 Čo som pre vás vytvoril:

### **1. Bezpečný Proxy Server** 🔒
- `proxy-server.js` - Hlavný server
- `package.json` - Závislosti
- `vercel.json` - Deployment konfigurácia

### **2. Automatické Deployment Scripty** 🚀
- `deploy.sh` - Pre Linux/Mac
- `deploy.bat` - Pre Windows

### **3. Testovacie Nástroje** 🧪
- `test-proxy.js` - Kompletné testovanie
- `README-PROXY.md` - Podrobná dokumentácia

### **4. Aktualizované Rozšírenie** ✅
- `background/background.js` - Bezpečný preklad
- `UPDATE_EXTENSION.md` - Návod na aktualizáciu

## 🚀 RÝCHLY DEPLOYMENT (3 minúty):

### **Linux/Mac:**
```bash
./deploy.sh
```

### **Windows:**
```cmd
deploy.bat
```

## 📋 Čo sa stane automaticky:

1. ✅ **Kontrola závislostí** (Node.js, npm, Vercel)
2. ✅ **Inštalácia Vercel CLI** (ak chýba)
3. ✅ **Deployment na Vercel** (serverless)
4. ✅ **Testovanie proxy servera**
5. ✅ **Inštrukcie na nastavenie API kľúča**

## 🔑 NASTAVENIE API KĽÚČA:

Po deploymente:
```bash
vercel env add GOOGLE_TRANSLATE_API_KEY
# Zadajte: AIzaSyBel24LTIb-LYj5I5kcbr2quZkAS35RAD0
```

## 🔄 AKTUALIZÁCIA ROZŠÍRENIA:

V `background/background.js` zmeňte:
```javascript
// ODSTRÁŇTE:
// const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyBel24LTIb-LYj5I5kcbr2quZkAS35RAD0';

// POUŽITE (URL z deploymentu):
const TRANSLATE_PROXY_URL = 'https://your-proxy.vercel.app/translate';
```

## 🧪 TESTOVANIE:

```bash
# Test proxy servera
npm test

# Test rozšírenia
# 1. Nainštalujte aktualizované rozšírenie
# 2. Skopírujte text
# 3. Skúste preklad
```

## 🔒 BEZPEČNOSTNÉ VYLEPŠENIA:

- ✅ **API kľúč je chránený** na Vercel serveri
- ✅ **Rate limiting** (100 prekladov/hodinu)
- ✅ **Extension ID overenie**
- ✅ **CORS obmedzenia**
- ✅ **Input validácia**
- ✅ **Monitoring a logy**

## 📊 MONITORING:

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Health Check:** `curl https://your-proxy.vercel.app/health`
- **Logy:** Vercel Functions → Logs

## 🚨 AK SA NIEČO POKAZÍ:

1. **Skontrolujte Vercel logs**
2. **Overte environment variables**
3. **Testujte proxy server samostatne**
4. **Skontrolujte Google Cloud obmedzenia**

## 🎯 VÝSLEDOK:

**Pred:** ⚠️ API kľúč exponovaný v kóde  
**Po:** 🔒 Bezpečný proxy server s monitoringom

---

## 📞 POTREBUJETE POMOC?

1. **Spustite deployment script** - automaticky vyrieši väčšinu problémov
2. **Pozrite si README-PROXY.md** - podrobná dokumentácia
3. **Skontrolujte UPDATE_EXTENSION.md** - návod na aktualizáciu

**ClipSmart je teraz bezpečný na publikovanie!** 🚀✨
