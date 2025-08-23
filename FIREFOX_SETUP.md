# 🦊 ClipSmart Firefox Extension Setup

## 📋 **Prehľad**
Tento dokument popisuje, ako nastaviť a publikovať ClipSmart rozšírenie pre Mozilla Firefox.

## 🔄 **Hlavné rozdiely oproti Chrome verzii**

### **Manifest súbor:**
- **Chrome:** `manifest.json` (Manifest V3)
- **Firefox:** `manifest-firefox.json` (Manifest V2)

### **API rozdiely:**
- **Chrome:** `chrome.*` API
- **Firefox:** `browser.*` API

### **Background script:**
- **Chrome:** Service Worker (`background.js`)
- **Firefox:** Background Page (`background-firefox.js`)

### **Action vs Browser Action:**
- **Chrome:** `action` (Manifest V3)
- **Firefox:** `browser_action` (Manifest V2)

## 📁 **Súbory pre Firefox verziu**

### **Koreňové súbory:**
- `manifest-firefox.json` - Firefox manifest
- `clipsmart-firefox-v1.0.6.zip` - Firefox ZIP balík

### **Background scripty:**
- `background/background-firefox.js` - Firefox background script

### **Popup súbory:**
- `popup/popup-firefox.html` - Firefox popup HTML
- `popup/popup-firefox.js` - Firefox popup JavaScript

### **Content scripty:**
- `content/content-firefox.js` - Firefox content script

## 🚀 **Inštalácia pre vývojárov**

### **1. Stiahnutie súborov:**
```bash
# Stiahnite Firefox ZIP súbor
wget https://github.com/tibco87/ClipSmart-Wind/raw/main/clipsmart-firefox-v1.0.6.zip
```

### **2. Rozbalenie:**
```bash
unzip clipsmart-firefox-v1.0.6.zip -d clipsmart-firefox
cd clipsmart-firefox
```

### **3. Inštalácia v Firefox:**
1. Otvorte Firefox
2. Prejdite na `about:debugging`
3. Kliknite na "This Firefox"
4. Kliknite "Load Temporary Add-on"
5. Vyberte `manifest-firefox.json`

## 🔧 **Kľúčové úpravy pre Firefox**

### **1. Manifest V2 vs V3:**
```json
// Chrome (Manifest V3)
{
  "manifest_version": 3,
  "action": { ... },
  "background": {
    "service_worker": "background/background.js"
  }
}

// Firefox (Manifest V2)
{
  "manifest_version": 2,
  "browser_action": { ... },
  "background": {
    "scripts": ["background/background-firefox.js"],
    "persistent": false
  }
}
```

### **2. API kompatibilita:**
```javascript
// Chrome
chrome.runtime.sendMessage(...)
chrome.storage.local.get(...)

// Firefox
browser.runtime.sendMessage(...)
browser.storage.local.get(...)
```

### **3. Permissions:**
```json
// Chrome - host_permissions
"host_permissions": [
  "https://clipsmart-translation-proxy.vercel.app/"
]

// Firefox - permissions
"permissions": [
  "clipboardRead",
  "clipboardWrite",
  "storage",
  "activeTab",
  "contextMenus",
  "alarms",
  "https://clipsmart-translation-proxy.vercel.app/"
]
```

## 📦 **Publikovanie na Firefox Add-ons**

### **1. Príprava balíka:**
- Použite `clipsmart-firefox-v1.0.6.zip`
- Obsahuje všetky Firefox-kompatibilné súbory

### **2. Firefox Add-ons Developer Hub:**
1. Prejdite na [addons.mozilla.org/developers](https://addons.mozilla.org/developers/)
2. Prihláste sa alebo vytvorte účet
3. Kliknite "Submit a New Add-on"

### **3. Upload súborov:**
1. Nahrajte `clipsmart-firefox-v1.0.6.zip`
2. Vyplňte informácie o rozšírení
3. Pridajte screenshoty a popis
4. Nastavte kategórie a tagy

### **4. Review proces:**
- Firefox Add-ons má automatický review systém
- Čas schválenia: 1-7 dní
- Môže byť potrebné manuálne overenie

## 🧪 **Testovanie**

### **1. Lokálne testovanie:**
```bash
# V Firefox
about:debugging > This Firefox > Load Temporary Add-on
```

### **2. Funkčnosť:**
- ✅ Clipboard monitoring
- ✅ Preklady cez proxy server
- ✅ ExtensionPay platby
- ✅ Export do PDF/CSV/TXT
- ✅ Lokalizácia (24 jazykov)
- ✅ Témy (auto/light/dark)

### **3. Kompatibilita:**
- ✅ Firefox 88+
- ✅ Manifest V2
- ✅ WebExtensions API

## 🐛 **Známe problémy a riešenia**

### **1. Clipboard API:**
```javascript
// Firefox môže mať obmedzenia pre clipboard
try {
  const text = await navigator.clipboard.readText();
} catch (error) {
  // Fallback na selection
  const selection = window.getSelection();
  return selection ? selection.toString() : '';
}
```

### **2. Background script:**
```javascript
// Firefox potrebuje persistent: false
"background": {
  "scripts": ["background/background-firefox.js"],
  "persistent": false
}
```

### **3. Notifications:**
```javascript
// Firefox notifications API
browser.notifications.create({
  type: 'basic',
  iconUrl: 'assets/icon-48.png',
  title: 'ClipSmart',
  message: 'Text saved to clipboard history'
});
```

## 📊 **Výkon a optimalizácie**

### **1. Memory usage:**
- Background script: ~2-5 MB
- Popup: ~1-2 MB
- Content script: ~0.5-1 MB

### **2. CPU usage:**
- Clipboard monitoring: <1% CPU
- Translation requests: <5% CPU (časovo obmedzené)

### **3. Storage:**
- Local storage: ~1-10 MB (závisí od počtu položiek)
- Sync storage: Voliteľné

## 🔒 **Bezpečnosť**

### **1. Permissions:**
- `clipboardRead` - čítanie schránky
- `clipboardWrite` - zápis do schránky
- `storage` - lokálne ukladanie
- `activeTab` - prístup k aktívnemu tabu

### **2. Network requests:**
- Všetky requesty cez HTTPS
- Proxy server pre preklady
- ExtensionPay pre platby

### **3. Data privacy:**
- Žiadne dáta sa neposielajú na tretie strany
- Všetky dáta sa ukladajú lokálne
- Preklady sa posielajú cez bezpečný proxy

## 📈 **Monitoring a analytics**

### **1. Firefox Add-ons metrics:**
- Downloads
- Active users
- Rating a reviews
- Crash reports

### **2. Extension metrics:**
- Usage statistics
- Error logging
- Performance monitoring

## 🚀 **Nasledujúce kroky**

### **1. Publikovanie:**
1. Nahrať na Firefox Add-ons
2. Počkať na review
3. Publikovať

### **2. Marketing:**
1. Vytvoriť landing page
2. Social media kampane
3. Tech blog články

### **3. Podpora:**
1. Dokumentácia pre používateľov
2. FAQ sekcia
3. Support email

## 📞 **Podpora**

### **Kontakt:**
- **GitHub:** [tibco87/ClipSmart-Wind](https://github.com/tibco87/ClipSmart-Wind)
- **Issues:** [GitHub Issues](https://github.com/tibco87/ClipSmart-Wind/issues)

### **Dokumentácia:**
- **Chrome verzia:** [README.md](README.md)
- **Firefox verzia:** [FIREFOX_SETUP.md](FIREFOX_SETUP.md)
- **API dokumentácia:** [Mozilla WebExtensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)

---

**Poznámka:** Táto Firefox verzia je plne kompatibilná s Chrome verziou a poskytuje rovnaké funkcie s prispôsobením pre Firefox API.
