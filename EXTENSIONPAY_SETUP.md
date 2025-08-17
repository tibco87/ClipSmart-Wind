# ExtensionPay Setup for ClipSmart

Tento dokument vysvetľuje, ako nastaviť ExtensionPay pre vašu ClipSmart extension.

## 1. Registrácia na ExtensionPay.com

1. Prejdite na [extensionpay.com](https://extensionpay.com)
2. Vytvorte si účet
3. Pridajte novú extension
4. Získajte Extension ID

## 2. Konfigurácia

### 2.1 Extension ID
V súbore `extensionpay-config.js` je už nastavený Extension ID z ExtensionPay dashboard:

```javascript
const EXTENSION_ID = 'biijlghfcgccgokncemdmjodpelojhki';
```

### 2.2 Ceny
Ceny sú už nakonfigurované v ExtensionPay dashboard a `extensionpay-config.js`:

```javascript
plans: {
    clipsmart_pro: {
        nickname: 'clipsmart-pro',
        price: 4.99,
        currency: 'EUR',
        interval: 'month'
    }
}
```

### 2.3 Limity
Nastavte limity pre free a premium verzie:

```javascript
limits: {
    free: {
        items: 20,
        translationsPerDay: 50,
        exportFormats: ['txt'],
        tags: false
    },
    premium: {
        items: Infinity,
        translationsPerDay: Infinity,
        exportFormats: ['txt', 'csv', 'json'],
        tags: true
    }
}
```

## 3. Testovanie

### 3.1 Development Mode
ExtensionPay automaticky detekuje development mode a používa testovacie platby.

### 3.2 Testovacie platby
V development mode môžete testovať platby bez skutočných poplatkov.

## 4. Produkčné nasadenie

### 4.1 Chrome Web Store
1. Nahrajte extension na Chrome Web Store
2. Získajte Extension ID z Web Store
3. Aktualizujte `extensionpay-config.js` s reálnym Extension ID

### 4.2 ExtensionPay Dashboard
1. V ExtensionPay dashboard nastavte ceny
2. Nakonfigurujte Stripe
3. Otestujte platby

## 5. Funkcie

### 5.1 Premium Features
- Neobmedzená história položiek
- Neobmedzené preklady
- Export do CSV/JSON
- Pokročilé tagovanie

### 5.2 Free Features
- 20 položiek v histórii
- 50 prekladov mesačne
- Export do TXT
- Základné funkcie

## 6. Troubleshooting

### 6.1 Platby nefungujú
- Skontrolujte Extension ID
- Overte Stripe konfiguráciu
- Skontrolujte console pre chyby

### 6.2 ExtensionPay sa nenačíta
- Overte, či je `extpay.js` správne načítaný
- Skontrolujte manifest.json content scripts
- Overte host permissions

## 7. API Reference

### 7.1 Základné funkcie
```javascript
// Inicializácia
const extpay = window.ExtPay(chrome.runtime.id);

// Získanie používateľa
const user = await extpay.getUser();

// Otvorenie platobnej stránky
await extpay.openPaymentPage();

// Sledovanie platby
extpay.onPaid.addListener((user) => {
    console.log('User paid:', user);
});
```

### 7.2 Pokročilé funkcie
```javascript
// Získanie plánov
const plans = await extpay.getPlans();

// Trial
await extpay.openTrialPage('1 week');

// Login
await extpay.openLoginPage();
```

## 8. Podpora

Pre podporu ExtensionPay:
- [ExtensionPay Documentation](https://github.com/Glench/ExtPay)
- [ExtensionPay Support](https://extensionpay.com/support)

Pre podporu ClipSmart:
- Vytvorte issue na GitHub
- Kontaktujte vývojára 