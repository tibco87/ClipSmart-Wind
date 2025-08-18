# 🔄 Aktualizácia ClipSmart Rozšírenia

Návod na aktualizáciu rozšírenia s novým bezpečným proxy serverom.

## 📋 Čo sa zmenilo?

**Pred:** Google Translate API kľúč bol exponovaný v kóde rozšírenia ⚠️  
**Po:** Bezpečný proxy server spracováva všetky preklady 🔒

## 🚀 Kroky na aktualizáciu

### **Krok 1: Deployment proxy servera**

Ak ste ešte nedeployovali proxy server:

```bash
# Linux/Mac
chmod +x deploy.sh
./deploy.sh

# Windows
deploy.bat
```

### **Krok 2: Získanie URL proxy servera**

Po úspešnom deploymente dostanete URL ako:
```
https://clipsmart-proxy-xyz.vercel.app
```

### **Krok 3: Aktualizácia background.js**

V súbore `background/background.js` zmeňte:

```javascript
// STARÁ VERZIA (ODSTRÁŇTE):
// const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyBel24LTIb-LYj5I5kcbr2quZkAS35RAD0';

// NOVÁ VERZIA (POUŽITE):
const TRANSLATE_PROXY_URL = 'https://clipsmart-proxy-xyz.vercel.app/translate';
```

### **Krok 4: Aktualizácia translateText funkcie**

Funkcia `translateText` už bola aktualizovaná, ale overte si, že vyzerá takto:

```javascript
async function translateText(text, targetLang) {
    try {
        const response = await fetch(TRANSLATE_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Extension-Id': chrome.runtime.id
            },
            body: JSON.stringify({
                text: text,
                targetLang: targetLang
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.translation) {
            return data.translation;
        } else {
            throw new Error(data.message || 'Preklad zlyhal');
        }
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
}
```

### **Krok 5: Testovanie aktualizácie**

1. **Nainštalujte aktualizované rozšírenie**
2. **Skopírujte text**
3. **Skúste preklad**
4. **Skontrolujte console pre chyby**

## 🔒 Bezpečnostné vylepšenia

### **Implementované opatrenia:**

1. ✅ **API kľúč je bezpečne uložený** na Vercel serveri
2. ✅ **Rate limiting** - 100 prekladov za hodinu na IP
3. ✅ **Extension ID overenie** - len vaše rozšírenie môže používať službu
4. ✅ **CORS obmedzenia** - blokuje webové stránky
5. ✅ **Input validácia** - kontroluje dĺžku a formát textu
6. ✅ **Error handling** - bezpečné error správy
7. ✅ **Monitoring** - podrobné logy na Vercel

### **Google Cloud Console obmedzenia:**

Nastavte obmedzenia na váš API kľúč:

```
HTTP referrer obmedzenia:
https://clipsmart-proxy-xyz.vercel.app/*

API obmedzenia:
- Povoľte len: Cloud Translation API

Kvóty:
- Denný limit: 1,000 prekladov
- Limit per minute: 10 prekladov
```

## 🧪 Testovanie

### **Test proxy servera:**
```bash
# Health check
curl https://clipsmart-proxy-xyz.vercel.app/health

# Test preklad
curl -X POST https://clipsmart-proxy-xyz.vercel.app/translate \
  -H "Content-Type: application/json" \
  -H "X-Extension-Id: nbpndheaoecmgnlmfpleeahoicpcbppj" \
  -d '{"text":"Hello world","targetLang":"sk"}'
```

### **Test rozšírenia:**
1. Otvorte rozšírenie
2. Skopírujte text
3. Skúste preklad do slovenčiny
4. Skontrolujte výsledok

## 🚨 Riešenie problémov

### **Chyba: "Translation failed"**
- Skontrolujte URL v `TRANSLATE_PROXY_URL`
- Overte, či proxy server beží
- Skontrolujte Vercel logs

### **Chyba: "Unauthorized extension"**
- Overte extension ID v proxy serveri
- Skontrolujte `X-Extension-Id` header

### **Chyba: "Rate limit exceeded"**
- Počkajte do resetu limitu (1 hodina)
- Zvýšte limity ak potrebujete

### **Chyba: "API quota exceeded"**
- Skontrolujte Google Cloud kvóty
- Zvýšte denný limit

## 📊 Monitoring

### **Vercel Dashboard:**
- Functions → Logs
- Analytics → Function invocations
- Environment variables

### **Health Check:**
```bash
curl https://clipsmart-proxy-xyz.vercel.app/health
```

## 🔄 Aktualizácie v budúcnosti

### **Aktualizácia proxy servera:**
```bash
git pull origin main
./deploy.sh
```

### **Aktualizácia rozšírenia:**
1. Zmeňte kód v `background.js`
2. Otestujte lokálne
3. Publikujte novú verziu

## ✅ Kontrolný zoznam

- [ ] Proxy server je deployovaný na Vercel
- [ ] `TRANSLATE_PROXY_URL` je aktualizovaná v `background.js`
- [ ] `translateText` funkcia je aktualizovaná
- [ ] Rozšírenie je otestované lokálne
- [ ] Google Cloud Console obmedzenia sú nastavené
- [ ] Proxy server je otestovaný
- [ ] Rozšírenie je pripravené na publikovanie

## 🎯 Výhody novej implementácie

1. **🔒 Bezpečnosť:** API kľúč je chránený
2. **📊 Kontrola:** Rate limiting a monitoring
3. **🚀 Škálovateľnosť:** Vercel serverless
4. **💰 Náklady:** Zadarmo pre malé objemy
5. **🛡️ Ochránenie:** Blokuje zneužiteľné requesty
6. **📈 Monitoring:** Podrobné logy a metriky

## 📞 Podpora

Ak máte problémy:
1. Skontrolujte Vercel logs
2. Overte environment variables
3. Testujte proxy server samostatne
4. Skontrolujte Google Cloud obmedzenia

---

**ClipSmart** je teraz bezpečnejší a profesionálnejší! 🚀✨
