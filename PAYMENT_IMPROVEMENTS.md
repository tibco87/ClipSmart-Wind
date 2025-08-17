# Odporúčané vylepšenia platobného systému

## 1. Zobrazenie informácií o predplatnom

### Pridať do popup.js:
```javascript
// V updateUIText() pridať zobrazenie info o predplatnom
if (this.isPro && this.extpay) {
    const user = await this.extpay.getUser();
    if (user.paidAt) {
        const paidDate = new Date(user.paidAt);
        const nextBilling = new Date(paidDate);
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        
        // Zobraz info v settings
        const subscriptionInfo = document.getElementById('subscriptionInfo');
        if (subscriptionInfo) {
            subscriptionInfo.innerHTML = `
                <div class="subscription-details">
                    <p>📅 Predplatné od: ${paidDate.toLocaleDateString()}</p>
                    <p>💳 Ďalšia platba: ${nextBilling.toLocaleDateString()}</p>
                    <p>✅ Status: Aktívne</p>
                </div>
            `;
        }
    }
}
```

## 2. Notifikácie pred vypršaním

### Pridať do background.js:
```javascript
// Kontrola blížiaceho sa vypršania
async function checkSubscriptionExpiry() {
    const storage = await chrome.storage.local.get(['extensionpay_user', 'lastExpiryNotification']);
    const user = storage.extensionpay_user;
    
    if (user && user.paidAt) {
        const paidDate = new Date(user.paidAt);
        const expiryDate = new Date(paidDate);
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        
        const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        // Notifikácia 3 dni pred vypršaním
        if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
            const lastNotification = storage.lastExpiryNotification;
            const today = new Date().toDateString();
            
            if (lastNotification !== today) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'assets/icon-128.png',
                    title: 'ClipSmart Pro vyprší čoskoro',
                    message: `Vaše predplatné vyprší o ${daysUntilExpiry} dní. Obnovte ho pre neprerušený prístup.`,
                    buttons: [{ title: 'Obnoviť teraz' }]
                });
                
                await chrome.storage.local.set({ lastExpiryNotification: today });
            }
        }
    }
}

// Volať každý deň
chrome.alarms.create('checkExpiry', { periodInMinutes: 60 * 24 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkExpiry') {
        checkSubscriptionExpiry();
    }
});
```

## 3. Zabezpečenie API kľúčov

### Možnosť A: Použiť Extension Storage pre citlivé údaje
```javascript
// Pri prvom spustení
const API_KEYS = {
    googleTranslate: 'YOUR_API_KEY_HERE'
};

// Uložiť šifrované
await chrome.storage.local.set({
    apiKeys: btoa(JSON.stringify(API_KEYS))
});

// Použitie
const storage = await chrome.storage.local.get(['apiKeys']);
const keys = JSON.parse(atob(storage.apiKeys));
```

### Možnosť B: Proxy server
```javascript
// Namiesto priameho volania Google Translate API
async function translateViaProxy(text, targetLang) {
    const response = await fetch('https://your-proxy-server.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang })
    });
    return response.json();
}
```

## 4. Lepšie error handling

```javascript
// V initializeExtPay()
async initializeExtPay() {
    try {
        // ... existing code ...
        
        // Pridať timeout pre getUser()
        const userPromise = this.extpay.getUser();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        const user = await Promise.race([userPromise, timeoutPromise]);
        
    } catch (error) {
        if (error.message === 'Timeout') {
            console.log('⏱️ ExtensionPay timeout - using cached status');
            // Použiť uložený status
            const storage = await chrome.storage.local.get(['isPro']);
            this.isPro = storage.isPro || false;
        } else {
            console.error('❌ ExtensionPay error:', error);
        }
    }
}
```

## 5. Offline podpora

```javascript
// Uložiť posledný známy status s časovou značkou
async function savePaymentStatus(isPro) {
    await chrome.storage.local.set({
        isPro: isPro,
        lastPaymentCheck: Date.now()
    });
}

// Pri štarte skontrolovať či nie je status príliš starý
async function loadPaymentStatus() {
    const storage = await chrome.storage.local.get(['isPro', 'lastPaymentCheck']);
    const daysSinceCheck = (Date.now() - storage.lastPaymentCheck) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCheck > 7) {
        // Status je starší ako týždeň, potrebná revalidácia
        return { isPro: false, needsRevalidation: true };
    }
    
    return { isPro: storage.isPro, needsRevalidation: false };
}
```

## 6. Analytics pre predplatné

```javascript
// Sledovať konverzie a zrušenia
async function trackSubscriptionEvent(event, data = {}) {
    const analyticsData = {
        event: event,
        timestamp: Date.now(),
        ...data
    };
    
    // Uložiť lokálne
    const storage = await chrome.storage.local.get(['analytics']);
    const analytics = storage.analytics || [];
    analytics.push(analyticsData);
    await chrome.storage.local.set({ analytics });
    
    // Prípadne poslať na analytics server
    if (window.gtag) {
        gtag('event', event, data);
    }
}

// Použitie
trackSubscriptionEvent('subscription_started', { plan: 'pro' });
trackSubscriptionEvent('subscription_cancelled', { reason: 'expired' });
```
