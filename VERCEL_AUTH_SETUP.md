# 🔐 Nastavenie Vercel Autentifikácie

## 📋 **Prečo potrebujeme autentifikáciu?**

Vercel má **globálne nastavenia** pre vašu organizáciu, ktoré vyžadujú autentifikáciu pre všetky endpointy. To je vlastne **lepšie pre bezpečnosť**!

## 🚀 **Kroky na nastavenie autentifikácie:**

### **Krok 1: Vercel Dashboard**

1. Choďte na [Vercel Dashboard](https://vercel.com/dashboard)
2. Vyberte váš projekt `clipsmart-translation-proxy`
3. **Settings** → **Security** → **Password Protection**
4. **Enable Password Protection**
5. Nastavte heslo (napr. `clipsmart2025`)
6. **Save**

### **Krok 2: Cez Vercel CLI (Alternatíva)**

```bash
# Nastavenie password protection
vercel --password-protection

# Alebo manuálne
vercel env add VERCEL_PASSWORD_PROTECTION
# Hodnota: clipsmart2025
```

### **Krok 3: Testovanie autentifikácie**

Po nastavení hesla:

```bash
# Test health endpoint
curl -u :clipsmart2025 https://your-proxy.vercel.app/health

# Test preklad
curl -u :clipsmart2025 -X POST https://your-proxy.vercel.app/translate \
  -H "Content-Type: application/json" \
  -H "X-Extension-Id: nbpndheaoecmgnlmfpleeahoicpcbppj" \
  -d '{"text":"Hello world","targetLang":"sk"}'
```

## 🔧 **Aktualizácia rozšírenia s autentifikáciou:**

V súbore `background/background.js` pridajte autentifikáciu:

```javascript
// Google Translate function - Bezpečne cez proxy server s autentifikáciou
async function translateText(text, targetLang) {
    try {
        // Base64 encoding pre Basic Auth
        const credentials = btoa(`:clipsmart2025`);
        
        const response = await fetch(TRANSLATE_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Extension-Id': chrome.runtime.id,
                'Authorization': `Basic ${credentials}`
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

## 🔒 **Bezpečnostné výhody autentifikácie:**

1. ✅ **Ochrana pred zneužiteľnými requestmi**
2. ✅ **Rate limiting na úrovni autentifikácie**
3. ✅ **Monitoring prístupov**
4. ✅ **Kontrola nad používateľmi**
5. ✅ **Profesionálny prístup**

## 🧪 **Testovanie po nastavení:**

### **1. Test proxy servera:**
```bash
# S autentifikáciou
curl -u :clipsmart2025 https://your-proxy.vercel.app/health

# Bez autentifikácie (mali by zlyhať)
curl https://your-proxy.vercel.app/health
```

### **2. Test rozšírenia:**
1. **Aktualizujte background.js** s autentifikáciou
2. **Nainštalujte rozšírenie**
3. **Skopírujte text**
4. **Skúste preklad**

## 🚨 **Riešenie problémov:**

### **Chyba: "401 Unauthorized"**
- Skontrolujte heslo v Vercel Dashboard
- Overte Authorization header v rozšírení
- Skontrolujte Base64 encoding

### **Chyba: "403 Forbidden"**
- Skontrolujte extension ID
- Overte CORS nastavenia
- Skontrolujte rate limiting

## 📊 **Monitoring s autentifikáciou:**

### **Vercel Dashboard:**
- **Security** → **Password Protection** - stav autentifikácie
- **Functions** → **Logs** - autentifikované requesty
- **Analytics** → **Function invocations** - použitie

### **Logy:**
Všetky autentifikované requesty sú logované s detailmi.

## 🎯 **Výsledok:**

**Pred:** ⚠️ Verejný server bez ochrany  
**Po:** 🔐 Bezpečný server s autentifikáciou

## 📋 **Kontrolný zoznam:**

- [ ] Password Protection povolené na Vercel
- [ ] Heslo nastavené a zapamätané
- [ ] background.js aktualizovaný s autentifikáciou
- [ ] Rozšírenie otestované
- [ ] Preklady fungujú

---

**ClipSmart Translation Proxy** s autentifikáciou je **bezpečný a profesionálny**! 🚀🔐
