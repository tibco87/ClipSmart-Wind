# Zabezpečenie Google Translate API kľúča

## 1. Obmedzenia v Google Cloud Console (Najjednoduchšie)

### Kroky:
1. Choď na [Google Cloud Console](https://console.cloud.google.com/)
2. Vyber svoj projekt
3. Choď na "APIs & Services" → "Credentials"
4. Klikni na tvoj API kľúč
5. Nastav obmedzenia:

### A) HTTP referrer obmedzenia:
```
chrome-extension://nbpndheaoecmgnlmfpleeahoicpcbppj
chrome-extension://*/
```

### B) API obmedzenia:
- Povoľ len: Cloud Translation API

### C) Kvóty:
- Nastav denný limit (napr. 10,000 prekladov)
- Nastav limit per minute (napr. 100 prekladov)

## 2. Proxy Server (Najbezpečnejšie)

### Vytvor jednoduchý proxy server (Node.js + Vercel):

**server.js:**
```javascript
const express = require('express');
const axios = require('axios');
const app = express();

// Ulož API kľúč ako environment variable
const GOOGLE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const ALLOWED_EXTENSION_ID = 'nbpndheaoecmgnlmfpleeahoicpcbppj';

app.use(express.json());

// CORS pre extension
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && origin.includes(`chrome-extension://${ALLOWED_EXTENSION_ID}`)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'POST');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
    }
    next();
});

app.post('/translate', async (req, res) => {
    try {
        // Overenie extension ID
        const extensionId = req.headers['x-extension-id'];
        if (extensionId !== ALLOWED_EXTENSION_ID) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { text, targetLang } = req.body;
        
        // Rate limiting (jednoduchý príklad)
        // V produkcii použi Redis alebo podobné
        
        const response = await axios.post(
            `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
            {
                q: text,
                target: targetLang,
                format: 'text'
            }
        );
        
        res.json(response.data);
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Translation failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

**package.json:**
```json
{
  "name": "clipsmart-translate-proxy",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.4.0"
  }
}
```

### Deploy na Vercel:
```bash
# Nainštaluj Vercel CLI
npm i -g vercel

# Deploy
vercel

# Nastav environment variable
vercel env add GOOGLE_TRANSLATE_API_KEY
```

## 3. Zmena v Extension kóde

### Uprav background.js:
```javascript
// Namiesto priameho API kľúča
// const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyBel24LTIb-LYj5I5kcbr2quZkAS35RAD0';

// Použi proxy server
const TRANSLATE_PROXY_URL = 'https://your-proxy.vercel.app/translate';

// Listen for messages from popup.js for translation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translateText') {
        const { text, targetLang } = request;
        
        fetch(TRANSLATE_PROXY_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Extension-Id': chrome.runtime.id
            },
            body: JSON.stringify({
                text: text,
                targetLang: targetLang
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data && data.data && data.data.translations) {
                sendResponse({ 
                    success: true, 
                    translation: data.data.translations[0].translatedText 
                });
            } else {
                sendResponse({ success: false, error: 'Translation failed' });
            }
        })
        .catch(error => {
            console.error('Translation error:', error);
            sendResponse({ success: false, error: error.message });
        });
        
        return true; // Keep message channel open for async response
    }
});
```

## 4. Cloudflare Workers (Alternatíva k Vercel)

**worker.js:**
```javascript
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

const GOOGLE_API_KEY = GOOGLE_TRANSLATE_API_KEY // Environment variable
const ALLOWED_EXTENSION = 'nbpndheaoecmgnlmfpleeahoicpcbppj'

async function handleRequest(request) {
    // CORS
    const headers = {
        'Access-Control-Allow-Origin': `chrome-extension://${ALLOWED_EXTENSION}`,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers })
    }

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
    }

    try {
        const { text, targetLang } = await request.json()
        
        const response = await fetch(
            `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: text,
                    target: targetLang,
                    format: 'text'
                })
            }
        )
        
        const data = await response.json()
        return new Response(JSON.stringify(data), {
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            }
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Translation failed' }), {
            status: 500,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            }
        })
    }
}
```

## 5. Šifrovanie API kľúča (Menej bezpečné, ale lepšie ako nič)

**background.js:**
```javascript
// Jednoduchá obfuskácia (NIE je to skutočné zabezpečenie!)
const encryptedKey = 'QUl6YVN5QmVsMjRMVEliLUxZajVJNWtjYnIycXVaa0FTMzVSQUQw'; // Base64

function getApiKey() {
    // Dekóduj pri použití
    return atob(encryptedKey);
}

// Použitie
const GOOGLE_TRANSLATE_API_KEY = getApiKey();
```

## Odporúčané riešenie:

**Pre produkciu odporúčam kombináciu:**
1. **Proxy server** (Vercel/Cloudflare) - API kľúč nikdy neopustí server
2. **Obmedzenia v Google Console** - ako záloha
3. **Rate limiting** na proxy serveri
4. **Monitoring** využitia API

**Pre development/testovanie:**
- Použi obmedzenia v Google Console
- Nastav nízke kvóty
- Monitoruj využitie
