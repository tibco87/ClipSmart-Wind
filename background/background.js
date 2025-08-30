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

// NEW: Pro Status Manager for Chrome Sync + ExtensionPay
class ProStatusManager {
    constructor() {
        this.syncInterval = 6 * 60 * 60 * 1000; // 6 hodín
        this.setupSync();
    }
    
    async setupSync() {
        console.log('🚀 ProStatusManager: Inicializujem Chrome Sync + ExtensionPay');
        
        // 1. Skontroluj ExtensionPay
        await this.checkExtensionPay();
        
        // 2. Nastav interval pre synchronizáciu
        setInterval(() => {
            this.syncProStatus();
        }, this.syncInterval);
        
        // 3. Okamžitá synchronizácia pri štarte
        setTimeout(() => {
            this.syncProStatus();
        }, 5000); // 5 sekúnd po štarte
    }
    
    async checkExtensionPay() {
        try {
            if (typeof self.ExtPay !== 'undefined') {
                const extpay = self.ExtPay(EXTENSION_ID);
                const user = await extpay.getUser();
                
                if (user.paid) {
                    console.log('💰 ExtensionPay: Používateľ má zaplatenú Pro verziu');
                    
                    // Ulož do Chrome Sync Storage
                    await chrome.storage.sync.set({
                        isPro: true,
                        subscriptionData: user,
                        lastSync: Date.now(),
                        source: 'extensionpay',
                        extensionId: EXTENSION_ID
                    });
                    
                    // Ulož aj do local storage pre rýchly prístup
                    await chrome.storage.local.set({
                        isPro: true,
                        extensionpay_user: user,
                        lastProStatusCheck: Date.now()
                    });
                    
                    console.log('✅ Pro status synced to Chrome Sync + Local Storage');
                    return true;
                } else {
                    console.log('ℹ️ ExtensionPay: Používateľ nemá Pro verziu');
                    return false;
                }
            } else {
                console.log('⚠️ ExtensionPay not available');
                return false;
            }
        } catch (error) {
            console.error('❌ ExtensionPay check error:', error);
            return false;
        }
    }
    
    async syncProStatus() {
        try {
            console.log('🔄 ProStatusManager: Synchronizujem Pro status...');
            
            // 1. Skús ExtensionPay
            const extpayStatus = await this.checkExtensionPay();
            
            if (extpayStatus) {
                console.log('✅ Pro status aktívny cez ExtensionPay');
                return true;
            }
            
            // 2. Fallback na Chrome Sync
            const syncData = await chrome.storage.sync.get(['isPro', 'subscriptionData', 'lastSync', 'extensionId']);
            
            if (syncData.isPro && syncData.lastSync && syncData.extensionId === EXTENSION_ID) {
                const daysSinceSync = (Date.now() - syncData.lastSync) / (1000 * 60 * 60 * 24);
                
                if (daysSinceSync < 30) {
                    console.log('✅ Using cached Pro status from Chrome Sync (age: ' + daysSinceSync.toFixed(1) + ' days)');
                    
                    // Synchronizuj do local storage
                    await chrome.storage.local.set({
                        isPro: true,
                        subscriptionData: syncData.subscriptionData,
                        lastProStatusCheck: Date.now(),
                        source: 'chrome_sync'
                    });
                    
                    return true;
                } else {
                    console.log('⚠️ Chrome Sync data is too old (' + daysSinceSync.toFixed(1) + ' days), removing');
                    await chrome.storage.sync.remove(['isPro', 'subscriptionData', 'lastSync', 'source']);
                }
            }
            
            // 3. Ak nič nefunguje, deaktivuj Pro
            console.log('⚠️ No valid Pro status found, deactivating Pro features');
            await chrome.storage.local.set({ isPro: false });
            return false;
            
        } catch (error) {
            console.error('❌ Sync error:', error);
            return false;
        }
    }
    
    async getProStatus() {
        try {
            // 1. Skontroluj local storage
            const localData = await chrome.storage.local.get(['isPro', 'lastProStatusCheck']);
            
            if (localData.isPro && localData.lastProStatusCheck) {
                const hoursSinceCheck = (Date.now() - localData.lastProStatusCheck) / (1000 * 60 * 60);
                
                if (hoursSinceCheck < 24) {
                    console.log('✅ Using local Pro status (checked ' + hoursSinceCheck.toFixed(1) + ' hours ago)');
                    return localData.isPro;
                }
            }
            
            // 2. Ak local data je staré, synchronizuj
            console.log('🔄 Local Pro status is old, syncing...');
            return await this.syncProStatus();
            
        } catch (error) {
            console.error('❌ Get Pro status error:', error);
            return false;
        }
    }
}

// Initialize ProStatusManager
let proStatusManager;

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

    // Initialize ProStatusManager for Chrome Sync
    proStatusManager = new ProStatusManager();

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
            periodInMinutes: 5/60 // Every 5 seconds instead of every second
        });

        // NEW: Add alarm for checking Pro status and subscription expiry
        await chrome.alarms.create('checkProStatus', {
            periodInMinutes: 60 * 6 // Every 6 hours
        });

        // NEW: Add alarm for checking subscription expiry (daily)
        await chrome.alarms.create('checkSubscriptionExpiry', {
            periodInMinutes: 60 * 24 // Daily
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
                if (!tab || !tab.id) {
                    console.log('📱 Žiadny aktívny tab pre clipboard kontrolu');
                    return;
                }

                console.log('🔍 Kontrolujem clipboard pre tab:', tab.url);

                // Pošli správu content scriptu, aby prečítal schránku
                chrome.tabs.sendMessage(tab.id, { action: "getClipboardText" }, async (response) => {
                    if (chrome.runtime.lastError) {
                        // Content script nie je načítaný v tomto tabe, ignoruj chybu
                        console.log('⚠️ Content script nie je načítaný v tabe:', tab.url);
                        return;
                    }
                    
                    const text = response?.text;
                    console.log('📋 Clipboard obsah:', text ? text.substring(0, 50) + '...' : '(prázdne)');
                    
                    if (text && text !== this.lastText) {
                        console.log('✅ Nový text načítaný, pridávam do histórie');
                        await this.addItem(text);
                    } else if (text === this.lastText) {
                        console.log('ℹ️ Text sa nezmenil');
                    }
                });
            } catch (error) {
                console.error('❌ Clipboard check error:', error);
            }
        },

    async addItem(text) {
        if (!text || text === this.lastText) {
            console.log('ℹ️ Text sa nezmenil alebo je prázdny');
            return;
        }
        
        console.log('➕ Pridávam novú položku:', text.substring(0, 50) + '...');
        this.lastText = text;
        
        // Get current items and check ExtensionPay status
        const data = await chrome.storage.local.get(['clipboardItems', 'isPro']);
        let items = data.clipboardItems || [];
        let isPro = data.isPro || false;
        
        console.log('📊 Aktuálny stav:', {
            pocetPoloziek: items.length,
            isPro: isPro
        });
        
        // Check ExtensionPay data to ensure isPro is correct
        isPro = await this.checkExtensionPayStatus(isPro);
        
        // Check if item already exists
        const existingIndex = items.findIndex(item => item.text === text);
        if (existingIndex !== -1) {
            console.log('🔄 Položka už existuje, presúvam na vrch');
            // Move to top
            const [existing] = items.splice(existingIndex, 1);
            existing.timestamp = Date.now();
            // Pridaj charCount ak neexistuje
            if (typeof existing.charCount === 'undefined') {
                existing.charCount = existing.text.length;
            }
            items.unshift(existing);
        } else {
            console.log('🆕 Vytváram novú položku');
            // Create new item
            const newItem = {
                id: this.generateId(),
                text: text,
                type: this.detectType(text),
                timestamp: Date.now(),
                tags: new Set(),
                charCount: text.length // Pridaj charCount pre zoradenie podľa dĺžky
            };
            
            console.log('📝 Nová položka:', {
                id: newItem.id,
                type: newItem.type,
                charCount: newItem.charCount
            });
            
            // Check limits for free users
            if (!isPro && items.length >= 20) {
                console.log('⚠️ Dosiahnutý limit pre free používateľov, odstraňujem najstaršiu položku');
                // Remove oldest item
                items.pop();
            }
            
            items.unshift(newItem);
        }
        
        // Save items
        await chrome.storage.local.set({ clipboardItems: items });
        console.log('💾 Položky uložené, celkový počet:', items.length);
        
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

    // New function to check ExtensionPay status using ProStatusManager
    async checkExtensionPayStatus(currentIsPro) {
        try {
            if (proStatusManager) {
                const proStatus = await proStatusManager.getProStatus();
                console.log('🔄 ProStatusManager: Pro status:', proStatus);
                return proStatus;
            } else {
                console.log('⚠️ ProStatusManager not available, using fallback');
                // Fallback na pôvodnú logiku
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
            }
        } catch (error) {
            console.error('❌ Error checking ExtensionPay status:', error);
            return currentIsPro;
        }
    }
};

// Google Translate API Integration - Using proxy server for security
const TRANSLATE_PROXY_URL = 'https://clipsmart-translation-proxy.vercel.app/translate';

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
    } else if (request.action === 'clipboardChanged') {
        // Handle clipboard changes from content script events
        console.log('📋 Clipboard changed event:', {
            text: request.text ? request.text.substring(0, 50) + '...' : '(prázdne)',
            source: request.source
        });
        
        if (request.text) {
            clipboardMonitor.addItem(request.text);
        }
        
        sendResponse({ success: true });
    } else if (request.action === 'syncProStatus') {
        // NEW: Handle Pro status sync request from popup
        console.log('🔄 Popup requested Pro status sync');
        
        if (proStatusManager) {
            proStatusManager.syncProStatus().then(proStatus => {
                sendResponse({ success: true, isPro: proStatus });
            }).catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        } else {
            sendResponse({ success: false, error: 'ProStatusManager not available' });
        }
        
        return true; // async response
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
    } else if (alarm.name === 'checkProStatus') {
        // NEW: Check Pro status every 6 hours
        checkProStatus();
    } else if (alarm.name === 'checkSubscriptionExpiry') {
        // NEW: Check subscription expiry daily
        checkSubscriptionExpiry();
    }
});

// NEW: Function to check Pro status using ProStatusManager
async function checkProStatus() {
    try {
        console.log('🔍 Checking Pro status...');
        
        if (proStatusManager) {
            const proStatus = await proStatusManager.syncProStatus();
            console.log('✅ ProStatusManager: Pro status synchronized:', proStatus);
            return proStatus;
        } else {
            console.log('⚠️ ProStatusManager not available, using fallback');
            
            // Get current Pro status from storage
            const storage = await chrome.storage.local.get(['isPro', 'extensionpay_user']);
            const currentIsPro = storage.isPro || false;
            
            // Try to get ExtensionPay data
            if (typeof self.ExtPay !== 'undefined') {
                const extpay = self.ExtPay(EXTENSION_ID);
                
                try {
                    const user = await extpay.getUser();
                    console.log('💰 ExtensionPay user data:', {
                        paid: user.paid,
                        paidAt: user.paidAt,
                        plan: user.plan,
                        subscriptions: user.subscriptions
                    });
                    
                    // Update Pro status if it changed
                    if (user.paid !== currentIsPro) {
                        console.log(`🔄 Pro status changed from ${currentIsPro} to ${user.paid}`);
                        await chrome.storage.local.set({ 
                            isPro: user.paid,
                            extensionpay_user: user,
                            lastProStatusCheck: Date.now()
                        });
                        
                        // Update badge if needed
                        if (user.paid) {
                            console.log('✅ Pro status activated');
                        } else {
                            console.log('⚠️ Pro status deactivated');
                        }
                    }
                    
                    // Save ExtensionPay user data
                    await chrome.storage.local.set({ 
                        extensionpay_user: user,
                        lastProStatusCheck: Date.now()
                    });
                    
                } catch (error) {
                    console.log('⚠️ ExtensionPay check failed, using cached status:', error.message);
                    // Use cached status if ExtensionPay is unavailable
                    const lastCheck = storage.lastProStatusCheck || 0;
                    const daysSinceCheck = (Date.now() - lastCheck) / (1000 * 60 * 60 * 24);
                    
                    if (daysSinceCheck > 7) {
                        console.log('⚠️ Pro status is older than 7 days, deactivating Pro features');
                        await chrome.storage.local.set({ isPro: false });
                    }
                }
            } else {
                console.log('⚠️ ExtensionPay not available, using cached status');
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking Pro status:', error);
    }
}

// NEW: Function to check subscription expiry and show notifications
async function checkSubscriptionExpiry() {
    try {
        console.log('📅 Checking subscription expiry...');
        
        const storage = await chrome.storage.local.get(['extensionpay_user', 'lastExpiryNotification']);
        const user = storage.extensionpay_user;
        const lastNotification = storage.lastExpiryNotification;
        
        if (user && user.paid && user.paidAt) {
            const paidDate = new Date(user.paidAt);
            let expiryDate;
            
            // Determine expiry date based on subscription type
            if (user.plan && user.plan.interval === 'year') {
                expiryDate = new Date(paidDate);
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            } else {
                // Default to monthly
                expiryDate = new Date(paidDate);
                expiryDate.setMonth(expiryDate.getMonth() + 1);
            }
            
            const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
            const today = new Date().toDateString();
            
            console.log('📅 Subscription expiry check:', {
                paidDate: paidDate.toLocaleDateString(),
                expiryDate: expiryDate.toLocaleDateString(),
                daysUntilExpiry: daysUntilExpiry,
                lastNotification: lastNotification
            });
            
            // Show notification 3 days before expiry (Chrome compatible)
            if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
                if (lastNotification !== today) {
                    console.log(`⚠️ Subscription expires in ${daysUntilExpiry} days - showing console warning`);
                    
                    // For Chrome, we'll use console warnings instead of notifications
                    console.warn(`🚨 CLIPSMART PRO EXPIRES SOON: Your subscription expires in ${daysUntilExpiry} days!`);
                    console.warn(`💳 Please renew your subscription to maintain uninterrupted access.`);
                    
                    // Save notification date
                    await chrome.storage.local.set({ lastExpiryNotification: today });
                }
            }
            
            // Deactivate Pro if expired
            if (daysUntilExpiry <= 0) {
                console.log('❌ Subscription expired, deactivating Pro features');
                await chrome.storage.local.set({ isPro: false });
                
                // Show expiry warning in console (Chrome compatible)
                console.error(`🚨 CLIPSMART PRO EXPIRED: Your subscription has expired!`);
                console.error(`💳 Please renew your subscription to access Premium features.`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking subscription expiry:', error);
    }
}

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

// Google Translate function - Using proxy server for security
async function translateText(text, targetLang) {
    try {
        const response = await fetch(TRANSLATE_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Extension-Id': EXTENSION_ID
            },
            body: JSON.stringify({
                text: text,
                targetLang: targetLang,
                extensionId: EXTENSION_ID
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.translation;
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
}