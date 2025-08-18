# Debugovanie ExtensionPay

Tento dokument obsahuje inštrukcie pre debugovanie ExtensionPay integrácie.

## 🔍 **Identifikované problémy:**

### **Chyba 1:** `window.ExtPay is not a function` ✅ **OPRAVENÉ**
**Príčina:** ExtensionPay skript sa nenačíta správne alebo sa nenačíta v správnom poradí.
**Riešenie:** Pridané `window.ExtPay = ExtPay;` na koniec extpay.js

### **Chyba 2:** `window is not defined` v background.js ✅ **OPRAVENÉ**
**Príčina:** Service worker nemá prístup k `window` objektu.
**Riešenie:** 
- Pridané `self.ExtPay = ExtPay;` do extpay.js
- Použitie `self.ExtPay` namiesto `window.ExtPay` v background.js

### **Chyba 3:** ExtensionPay content script konfigurácia ✅ **OPRAVENÉ**
**Príčina:** onPaid callback vyžaduje content script setup.
**Riešenie:** Nahradené periodickým kontrolovaním stavu platby

### **Chyba 4:** Payment error ✅ **OPRAVENÉ**
**Príčina:** Používal sa Chrome generovaný Extension ID namiesto ExtensionPay dashboard ID.
**Riešenie:** Použitie správneho ExtensionPay dashboard ID (`biijlghfcgccgokncemdmjodpelojhki`)

### **Chyba 5:** Context menu error ✅ **OPRAVENÉ**
**Príčina:** Pokus o odstránenie neexistujúceho menu item.
**Riešenie:** Použitie `removeAll()` namiesto `remove()`

## 🧪 **Testovanie:**

### **1. Test súbor**
Otvorte `test-extensionpay.html` v prehliadači:
```bash
# V root priečinku projektu
open test-extensionpay.html
```

### **2. Background script test**
Otvorte `test-background.html` v prehliadači:
```bash
# V root priečinku projektu
open test-background.html
```

### **3. ExtensionPay ID test**
Otvorte `test-extension-id.html` v prehliadači:
```bash
# V root priečinku projektu
open test-extension-id.html
```

### **2. Console logy**
Otvorte popup a pozrite sa na console logy:
```
🔧 Initializing ExtensionPay...
⏳ Waiting for ExtensionPay... (1/10)
✅ ExtensionPay loaded successfully
✅ ExtensionPay initialized with ID: biijlghfcgccgokncemdmjodpelojhki
✅ User data retrieved: {paid: false, ...}
✅ ExtensionPay setup complete
```

### **3. Network tab**
Skontrolujte, či sa ExtensionPay skripty načítali:
1. Otvorte Developer Tools
2. Prejdite na Network tab
3. Obnovte popup
4. Hľadajte `extpay.js` a `extensionpay-config.js`

## 🐛 **Bežné problémy a riešenia:**

### **Problém 1: ExtensionPay sa nenačíta**
```
❌ ExtensionPay failed to load after 10 retries
```

**Riešenie:**
1. Skontrolujte, či sú súbory v správnych priečinkoch
2. Overte, či sú skripty správne načítané v popup.html
3. Skontrolujte console pre chyby

### **Problém 2: Extension ID chyba**
```
Error: Extension ID not found
```

**Riešenie:**
1. Overte `extensionpay-config.js` - Extension ID by mal byť `biijlghfcgccgokncemdmjodpelojhki`
2. Skontrolujte, či je extension nainštalovaný správne

### **Problém 3: Network chyby**
```
Failed to fetch: https://extensionpay.com/...
```

**Riešenie:**
1. Skontrolujte internetové pripojenie
2. Overte, či nie je blokované extensionpay.com
3. Skontrolujte CORS nastavenia

## 🔧 **Debugovacie kroky:**

### **Krok 1: Základné testovanie**
```javascript
// V popup console
console.log('ExtensionPay available:', typeof window.ExtPay);
console.log('Extension ID:', chrome.runtime.id);
console.log('Config:', window.EXTPAY_CONFIG);
```

### **Krok 2: Testovanie inicializácie**
```javascript
// V popup console
const extpay = window.ExtPay(chrome.runtime.id);
console.log('ExtPay instance:', extpay);
```

### **Krok 3: Testovanie API**
```javascript
// V popup console
extpay.getUser().then(user => {
    console.log('User:', user);
}).catch(error => {
    console.error('Error:', error);
});
```

### **Krok 4: Testovanie platby**
```javascript
// V popup console
extpay.openPaymentPage('clipsmart-pro').then(() => {
    console.log('Payment page opened');
}).catch(error => {
    console.error('Payment error:', error);
});
```

## 📊 **Očakávané výstupy:**

### **Úspešné načítanie:**
```
🔧 Initializing ExtensionPay...
✅ ExtensionPay loaded successfully
✅ ExtensionPay initialized with ID: biijlghfcgccgokncemdmjodpelojhki
ℹ️ Using ExtensionPay dashboard ID, not Chrome generated ID
✅ User data retrieved: {paid: false, paidAt: null, installedAt: "2024-...", trialStartedAt: null}
✅ ExtensionPay setup complete
```

### **Background script:**
```
✅ ExtensionPay initialized in background with ID: biijlghfcgccgokncemdmjodpelojhki
```

### **Payment test:**
```
🔗 Opening payment page for plan: clipsmart-pro
✅ Payment page opened successfully
```

### **Free user:**
```javascript
{
    paid: false,
    paidAt: null,
    installedAt: "2024-01-01T00:00:00.000Z",
    trialStartedAt: null
}
```

### **Premium user:**
```javascript
{
    paid: true,
    paidAt: "2024-01-01T00:00:00.000Z",
    installedAt: "2024-01-01T00:00:00.000Z",
    trialStartedAt: null
}
```

## 🚨 **Kritické chyby:**

### **Chyba 1: ExtensionPay nie je funkcia**
```
TypeError: window.ExtPay is not a function
```
**Riešenie:** Skontrolujte, či je extpay.js správne načítaný

### **Chyba 2: Extension ID neexistuje**
```
Error: Extension ID not found in ExtensionPay dashboard
```
**Riešenie:** Overte Extension ID v extensionpay-config.js

### **Chyba 3: Network timeout**
```
Error: Network timeout
```
**Riešenie:** Skontrolujte internetové pripojenie a CORS

## 📞 **Kontakt pre podporu:**

Ak problémy pretrvávajú:
1. Zbierajte console logy
2. Urobte screenshot chyby
3. Opíšte kroky, ktoré viedli k chybe
4. Kontaktujte vývojára s detailmi 