// ClipSmart Background Service Worker

// ExtensionPay Configuration
const EXTENSION_ID = 'nbpndheaoecmgnlmfpleeahoicpcbppj';
const EXTPAY_CONFIG = {
    extensionId: EXTENSION_ID,
    limits: {
        free: {
            items: 20,
            translationsPerDay: 5,
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
};

// Load ExtensionPay script
importScripts('../js/extpay.js');

// ExtensionPay is loaded as a global function

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        // Set default settings on first install
        await chrome.storage.local.set({
            clipboardItems: [],
            settings: {
                theme: 'auto',
                language: 'en',
                autoDelete: 'never',
                translationLangs: ['en', 'de', 'fr']
            },
            isPro: false,
            translationsUsed: 0,
            installDate: Date.now()
        });

        // Open welcome page
        chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
    }

            // Initialize ExtensionPay
    setTimeout(() => {
        if (typeof self.ExtPay !== 'undefined') {
            // Use the production Extension ID from Chrome Web Store
            const extensionPayId = 'nbpndheaoecmgnlmfpleeahoicpcbppj';
            const extpay = self.ExtPay(extensionPayId);
            extpay.startBackground();
            console.log('✅ ExtensionPay initialized in background with ID:', extensionPayId);
        } else {
            console.error('ExtensionPay not available in background');
            console.log('Available globals:', Object.keys(self).filter(key => key.includes('Ext')));
        }
    }, 100);

    // Create context menu
    chrome.contextMenus.removeAll(function() {
        chrome.contextMenus.create({
            id: 'save-to-clipsmart',
            title: 'Save to ClipSmart',
            contexts: ['selection']
        });
    });

    // Create alarms
    try {
        await chrome.alarms.create('resetTranslations', {
            periodInMinutes: 60 * 24 * 30 // Monthly
        });
        
        await chrome.alarms.create('cleanup', {
            periodInMinutes: 60 * 24 // Daily
        });

        await chrome.alarms.create('checkClipboard', {
            periodInMinutes: 1/60 // Every second
        });
    } catch (error) {
        console.error('Failed to create alarms:', error);
    }
});

    // Handle clipboard monitoring
    let clipboardMonitor = {
        lastText: '',
        
        async checkClipboard() {
            try {
                // Získaj aktívny tab
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab || !tab.id) return;

                // Pošli správu content scriptu, aby prečítal schránku
                chrome.tabs.sendMessage(tab.id, { action: "getClipboardText" }, async (response) => {
                    if (chrome.runtime.lastError) {
                        // Content script nie je načítaný v tomto tabe, ignoruj chybu
                        return;
                    }
                    const text = response?.text;
                    if (text && text !== this.lastText) {
                        await this.addItem(text);
                    }
                });
            } catch (error) {
                console.error('Clipboard check error:', error);
            }
        },

    async addItem(text) {
        if (!text || text === this.lastText) return;
        
        this.lastText = text;
        
        // Get current items and check ExtensionPay status
        const data = await chrome.storage.local.get(['clipboardItems', 'isPro']);
        let items = data.clipboardItems || [];
        let isPro = data.isPro || false;
        
        // Check ExtensionPay data to ensure isPro is correct
        isPro = await this.checkExtensionPayStatus(isPro);
        
        // Check if item already exists
        const existingIndex = items.findIndex(item => item.text === text);
        if (existingIndex !== -1) {
            // Move to top
            const [existing] = items.splice(existingIndex, 1);
            existing.timestamp = Date.now();
            // Pridaj charCount ak neexistuje
            if (typeof existing.charCount === 'undefined') {
                existing.charCount = existing.text.length;
            }
            items.unshift(existing);
        } else {
            // Create new item
            const newItem = {
                id: this.generateId(),
                text: text,
                type: this.detectType(text),
                timestamp: Date.now(),
                tags: new Set(),
                charCount: text.length // Pridaj charCount pre zoradenie podľa dĺžky
            };
            
            // Check limits for free users
            if (!isPro && items.length >= 20) {
                // Remove oldest item
                items.pop();
            }
            
            items.unshift(newItem);
        }
        
        // Save items
        await chrome.storage.local.set({ clipboardItems: items });
        
        // Update badge
        this.updateBadge(items.length);
    },

    detectType(text) {
        // URL detection
        if (/^https?:\/\/|^www\./i.test(text)) {
            return 'url';
        }
        
        // Email detection
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
            return 'email';
        }
        
        // Code detection (simple heuristic)
        if (text.includes('{') || text.includes('}') || 
            text.includes('function') || text.includes('const') ||
            text.includes('=>') || text.includes('import')) {
            return 'code';
        }
        
        return 'text';
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    updateBadge(count) {
        chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });
        // Použijeme modrú farbu pozadia s bielym textom
        chrome.action.setBadgeBackgroundColor({ color: '#2196f3' });
    },

    // New function to check ExtensionPay status
    async checkExtensionPayStatus(currentIsPro) {
        try {
            // Check ExtensionPay storage for user data
            const syncData = await chrome.storage.sync.get(['extensionpay_user']);
            const localData = await chrome.storage.local.get(['extensionpay_user']);
            
            const extensionpayUser = syncData.extensionpay_user || localData.extensionpay_user;
            
            if (extensionpayUser && extensionpayUser.paid && !currentIsPro) {
                console.log('💰 Found paid user in ExtensionPay data, updating isPro status');
                await chrome.storage.local.set({ isPro: true });
                return true;
            } else if (extensionpayUser && !extensionpayUser.paid && currentIsPro) {
                console.log('⚠️ User is not paid in ExtensionPay data, updating isPro status');
                await chrome.storage.local.set({ isPro: false });
                return false;
            }
            
            return currentIsPro;
            
        } catch (error) {
            console.error('❌ Error checking ExtensionPay status:', error);
            return currentIsPro;
        }
    }
};

// Google Translate API Integration
const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyBel24LTIb-LYj5I5kcbr2quZkAS35RAD0';

// Listen for messages from popup.js for translation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translateText') {
        const { text, targetLang } = request;
        
        translateText(text, targetLang)
            .then(translation => {
                sendResponse({ success: true, translation });
            })
            .catch(error => {
                console.error('Translation error:', error);
                sendResponse({ success: false, error: error.message });
            });
        
        return true; // async response
    } else if (request.action === 'getApiKey') {
        // Return API key for translations (stored securely)
        chrome.storage.local.get(['openaiApiKey'], (data) => {
            sendResponse({ apiKey: data.openaiApiKey });
        });
        return true; // Keep message channel open
    } else if (request.action === 'updateBadge') {
        clipboardMonitor.updateBadge(request.count);
        sendResponse({ success: true });
    } else if (request.action === 'urlChanged') {
        // Handle URL changes - could be used for tracking navigation
        console.log('URL changed:', request.url);
        sendResponse({ success: true });
    }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'save-to-clipsmart' && info.selectionText) {
        clipboardMonitor.addItem(info.selectionText);
    }
});



// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'copy-last') {
        // Get the last clipboard item
        const data = await chrome.storage.local.get(['clipboardItems']);
        const items = data.clipboardItems || [];
        
        if (items.length > 0) {
            // Send to active tab to copy
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.tabs.sendMessage(tab.id, {
                action: 'copyToClipboard',
                text: items[0].text
            });
        }
    }
});

// Reset translation count monthly
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'resetTranslations') {
        chrome.storage.local.set({ translationsUsed: 0 });
    } else if (alarm.name === 'cleanup') {
        cleanupOldItems();
    } else if (alarm.name === 'checkClipboard') {
        clipboardMonitor.checkClipboard();
    }
});

// Clean up old items
async function cleanupOldItems() {
    try {
        const data = await chrome.storage.local.get(['clipboardItems', 'settings']);
        const items = data.clipboardItems || [];
        const settings = data.settings || {};
        
        console.log('🗑️ Background cleanup spustený:', {
            pocetPoloziek: items.length,
            nastavenie: settings.autoDelete
        });
        
        if (settings.autoDelete !== 'never') {
            const days = parseInt(settings.autoDelete);
            const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
            
            const itemsToDelete = items.filter(item => 
                !item.pinned && item.timestamp <= cutoff
            );
            
            const filtered = items.filter(item => 
                item.pinned || item.timestamp > cutoff
            );
            
            console.log('🗑️ Background cleanup výsledok:', {
                predTym: items.length,
                poTom: filtered.length,
                vymazanych: itemsToDelete.length,
                cutoffDatum: new Date(cutoff).toLocaleString()
            });
            
            if (filtered.length < items.length) {
                await chrome.storage.local.set({ clipboardItems: filtered });
                console.log('✅ Background cleanup: údaje uložené');
            }
        } else {
            console.log('🗑️ Background cleanup: auto-delete je vypnuté');
        }
    } catch (error) {
        console.error('❌ Background cleanup error:', error);
    }
}

// Initialize badge on startup
chrome.storage.local.get(['clipboardItems'], (data) => {
    const items = data.clipboardItems || [];
    clipboardMonitor.updateBadge(items.length);
});

// Google Translate function
async function translateText(text, targetLang) {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                target: targetLang,
                format: 'text'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data.translations[0].translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
}