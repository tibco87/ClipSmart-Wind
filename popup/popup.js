// ClipSmart Popup Script
// ExtensionPay is loaded as a global function

class ClipSmart {
    constructor() {
        this.clipboardItems = [];
        this.filteredItems = [];
        this.currentTab = 'recent';
        this.searchQuery = '';
        this.freeItemLimit = 20;
        this.freeTranslationLimit = 5; // 5 prekladov mesačne pre free verziu
        this.translationsUsed = 0;
        this.isPro = false;
        this.defaultTransLangs = ['en', 'de', 'fr'];
        this.tags = new Set();
        this.translationLimit = 5; // 5 prekladov mesačne pre free verziu
        this.availableLanguages = ['en', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'nl', 'da', 'sv', 'cs', 'sk', 'hu', 'ru', 'uk', 'ar', 'tr', 'zh', 'ja', 'id', 'vi', 'ko', 'hi', 'bn'];
        this.sortOrder = 'newest'; // Predvolené zoradenie
        this.locale = 'en';
        this.messages = {};
        this.extpay = null;
        
        this.init();
    }

    async init() {
        await this.loadData();
        await this.detectAndSetLocale();
        await this.loadMessages();
        await this.initializeExtPay();
        await this.checkTranslationLimit(); // Načítanie aktuálneho stavu mesačných prekladov
        this.setupEventListeners();
        this.applyTheme();
        this.renderContent();
        this.updateItemCount();
        this.updateUIText(); // Presunuté sem po načítaní všetkých dát
        this.updatePremiumModeCheckbox();
        
        // Kontrola jsPDF načítania
        if (typeof window.jspdf === 'undefined') {
            console.warn('jsPDF library not loaded - PDF export will not work');
            console.log('Available window properties:', Object.keys(window).filter(key => key.includes('pdf') || key.includes('PDF')));
        } else {
            console.log('jsPDF library loaded successfully');
        }
    }

    async initializeExtPay() {
        // Wait for ExtensionPay to load
        let retries = 0;
        while (!window.ExtPay && retries < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        if (!window.ExtPay) {
            console.error('❌ ExtensionPay failed to load after 10 retries');
            console.log('Available globals:', Object.keys(window).filter(key => key.includes('Ext')));
            return;
        }
        
        console.log('✅ ExtensionPay loaded successfully');
        
        try {
            // ExtensionPay is available globally
            // Use the production Extension ID from Chrome Web Store
            const extensionPayId = window.EXTPAY_CONFIG?.extensionId || 'nbpndheaoecmgnlmfpleeahoicpcbppj';
            this.extpay = window.ExtPay(extensionPayId);
            console.log('✅ ExtensionPay initialized with ID:', extensionPayId);
            console.log('ℹ️ Using ExtensionPay dashboard ID, not Chrome generated ID');
            
            // Synchronize ExtensionPay data with our isPro status
            await this.syncExtensionPayData();
            
            const user = await this.extpay.getUser();
            console.log('✅ User data retrieved:', user);
            console.log('🔍 User subscriptions:', user.subscriptions);
            console.log('🔍 User subscription data:', {
                subscriptionAmount: user.subscriptionAmount,
                subscriptionInterval: user.subscriptionInterval,
                subscriptionCurrency: user.subscriptionCurrency,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionPlan: user.subscriptionPlan,
                plan: user.plan,
                planId: user.planId,
                planNickname: user.planNickname
            });
            
            // Explicit individual logging to see exact values
            console.log('💰 subscriptionAmount:', user.subscriptionAmount, typeof user.subscriptionAmount);
            console.log('📅 subscriptionInterval:', user.subscriptionInterval, typeof user.subscriptionInterval);
            console.log('💱 subscriptionCurrency:', user.subscriptionCurrency, typeof user.subscriptionCurrency);
            console.log('🏷️ planNickname:', user.planNickname, typeof user.planNickname);
            console.log('💎 paid:', user.paid, typeof user.paid);
            
            // Log all user object keys to see what's available
            console.log('🔍 All user object keys:', Object.keys(user));
            console.log('🔍 All user object values:', Object.entries(user));
            
            this.isPro = user.paid;
            
            // Detect subscription plan type
            if (user.paid) {
                // Try different ways to get subscription info from ExtensionPay API
                if (user.plan && user.plan.nickname && user.plan.interval) {
                    // Method 1: Use plan object (most reliable)
                    this.subscriptionPlan = user.plan.nickname;
                    this.subscriptionInterval = user.plan.interval;
                    console.log(`💎 Method 1 - Plan detected from user.plan: ${this.subscriptionPlan} (${this.subscriptionInterval})`);
                    console.log(`💎 Method 1 - Full plan object:`, user.plan);
                } else if (user.subscriptions && user.subscriptions.length > 0) {
                    // Method 2: Use subscriptions array (newer API)
                    const subscription = user.subscriptions[0];
                    this.subscriptionPlan = subscription.nickname || subscription.planNickname || 'unknown';
                    this.subscriptionInterval = subscription.interval || subscription.subscriptionInterval || 'month';
                    console.log(`💎 Method 2 - Subscription plan detected: ${this.subscriptionPlan} (${this.subscriptionInterval})`);
                    console.log(`💎 Method 2 - Full subscription object:`, subscription);
                } else if (user.planNickname) {
                    // Method 3A: Use planNickname field
                    this.subscriptionPlan = user.planNickname;
                    this.subscriptionInterval = user.planNickname.includes('yearly') ? 'year' : 'month';
                    console.log(`💎 Method 3A - Plan detected from planNickname: ${this.subscriptionPlan} (${this.subscriptionInterval})`);
                } else if (user.subscriptionInterval) {
                    // Method 3B: Use direct subscription fields (common API)
                    this.subscriptionInterval = user.subscriptionInterval;
                    this.subscriptionPlan = user.subscriptionInterval === 'year' ? 'clipsmart-pro-yearly' : 'clipsmart-pro-monthly';
                    console.log(`💎 Method 3B - Subscription plan detected: ${this.subscriptionPlan} (${this.subscriptionInterval})`);
                } else if (user.subscriptionAmount) {
                    // Method 4: Detect by amount (fallback)
                    if (user.subscriptionAmount >= 2999) { // 29.99 EUR in cents
                        this.subscriptionInterval = 'year';
                        this.subscriptionPlan = 'clipsmart-pro-yearly';
                    } else {
                        this.subscriptionInterval = 'month';
                        this.subscriptionPlan = 'clipsmart-pro-monthly';
                    }
                    console.log(`💎 Method 4 - Subscription plan detected by amount: ${this.subscriptionPlan} (${this.subscriptionInterval}) - €${user.subscriptionAmount/100}`);
                } else {
                    // Method 5: Default fallback
                    this.subscriptionPlan = 'clipsmart-pro-monthly';
                    this.subscriptionInterval = 'month';
                    console.log(`💎 Method 5 - Using fallback: ${this.subscriptionPlan} (${this.subscriptionInterval})`);
                }
                
                // Save subscription info
                await chrome.storage.local.set({ 
                    subscriptionPlan: this.subscriptionPlan,
                    subscriptionInterval: this.subscriptionInterval
                });
                
                console.log(`✅ Final subscription info saved: ${this.subscriptionPlan} (${this.subscriptionInterval})`);
            }
            
            this.updateLimits();
            this.updateUIText(); // Aktualizuje UI vrátane sortSelect
            this.updatePremiumModeCheckbox();
            this.updateUpgradeButton();
            
            // Save Pro status to storage
            await chrome.storage.local.set({ isPro: this.isPro });
            
            // Set up periodic payment status check (alternative to onPaid callback)
            setInterval(async () => {
                try {
                    const user = await this.extpay.getUser();
                    if (user.paid !== this.isPro) {
                        console.log('💰 Payment status changed:', user.paid);
                        this.isPro = user.paid;
                        
                        // Update subscription plan info using the same logic as initial load
                        if (user.paid) {
                            if (user.plan && user.plan.nickname && user.plan.interval) {
                                this.subscriptionPlan = user.plan.nickname;
                                this.subscriptionInterval = user.plan.interval;
                            } else if (user.subscriptions && user.subscriptions.length > 0) {
                                const subscription = user.subscriptions[0];
                                this.subscriptionPlan = subscription.nickname || subscription.planNickname || 'unknown';
                                this.subscriptionInterval = subscription.interval || subscription.subscriptionInterval || 'month';
                            } else if (user.planNickname) {
                                this.subscriptionPlan = user.planNickname;
                                this.subscriptionInterval = user.planNickname.includes('yearly') ? 'year' : 'month';
                            } else if (user.subscriptionInterval) {
                                this.subscriptionInterval = user.subscriptionInterval;
                                this.subscriptionPlan = user.subscriptionInterval === 'year' ? 'clipsmart-pro-yearly' : 'clipsmart-pro-monthly';
                            } else if (user.subscriptionAmount) {
                                if (user.subscriptionAmount >= 2999) {
                                    this.subscriptionInterval = 'year';
                                    this.subscriptionPlan = 'clipsmart-pro-yearly';
                                } else {
                                    this.subscriptionInterval = 'month';
                                    this.subscriptionPlan = 'clipsmart-pro-monthly';
                                }
                            }
                            
                            console.log(`💎 Subscription plan updated: ${this.subscriptionPlan} (${this.subscriptionInterval})`);
                            
                            // Save subscription info
                            await chrome.storage.local.set({ 
                                subscriptionPlan: this.subscriptionPlan,
                                subscriptionInterval: this.subscriptionInterval
                            });
                        }
                        
                        this.updateLimits();
                        this.updateUIText();
                        this.updatePremiumModeCheckbox();
                        this.updateUpgradeButton();
                        
                        // Save Pro status to storage
                        await chrome.storage.local.set({ isPro: this.isPro });
                        
                        if (user.paid) {
                            const planName = this.subscriptionInterval === 'year' ? 'Yearly' : 'Monthly';
                            this.showNotification(`Premium mode activated! (${planName} plan)`);
                        }
                    }
                } catch (error) {
                    // Don't show error for network issues, just log it silently
                    if (error.message && error.message.includes('Failed to fetch')) {
                        console.log('🌐 Network issue during payment status check (normal)');
                    } else {
                        console.error('❌ Payment status check error:', error);
                    }
                }
            }, 5000); // Check every 5 seconds
            
            console.log('✅ ExtensionPay setup complete');
        } catch (error) {
            console.error('❌ Error initializing ExtensionPay:', error);
        }
    }

    // New function to synchronize ExtensionPay data
    async syncExtensionPayData() {
        try {
            // Check ExtensionPay storage (both sync and local)
            const syncData = await chrome.storage.sync.get(['extensionpay_user', 'extensionpay_api_key']);
            const localData = await chrome.storage.local.get(['extensionpay_user', 'extensionpay_api_key']);
            
            // Use whichever storage has the data
            const extensionpayUser = syncData.extensionpay_user || localData.extensionpay_user;
            const extensionpayApiKey = syncData.extensionpay_api_key || localData.extensionpay_api_key;
            
            console.log('🔍 ExtensionPay data found:', {
                user: extensionpayUser ? 'Yes' : 'No',
                apiKey: extensionpayApiKey ? 'Yes' : 'No'
            });
            
            // If we have ExtensionPay data, ensure it's in both storages
            if (extensionpayUser && !syncData.extensionpay_user) {
                await chrome.storage.sync.set({ extensionpay_user: extensionpayUser });
                console.log('✅ Synced extensionpay_user to sync storage');
            }
            
            if (extensionpayApiKey && !syncData.extensionpay_api_key) {
                await chrome.storage.sync.set({ extensionpay_api_key: extensionpayApiKey });
                console.log('✅ Synced extensionpay_api_key to sync storage');
            }
            
            // If we have user data, check if they're paid
            if (extensionpayUser && extensionpayUser.paid) {
                console.log('💰 Found paid user in ExtensionPay data');
                this.isPro = true;
                await chrome.storage.local.set({ isPro: true });
                console.log('✅ Updated isPro status to true');
                this.updateUIText(); // Aktualizuje UI vrátane sortSelect
            }
            
        } catch (error) {
            console.error('❌ Error syncing ExtensionPay data:', error);
        }
    }

    updateLimits() {
        const config = window.EXTPAY_CONFIG || {
            limits: {
                free: { items: 20, translationsPerMonth: 5 }, // 5 prekladov mesačne
                premium: { items: Infinity, translationsPerMonth: Infinity }
            }
        };
        
        if (this.isPro) {
            this.freeItemLimit = config.limits.premium.items;
            this.freeTranslationLimit = config.limits.premium.translationsPerMonth;
            this.translationLimit = Infinity;
        } else {
            this.freeItemLimit = config.limits.free.items;
            this.freeTranslationLimit = config.limits.free.translationsPerMonth;
            this.translationLimit = config.limits.free.translationsPerMonth;
        }
    }

    async detectAndSetLocale() {
        // Check if user has selected a language
        const data = await chrome.storage.local.get(['settings']);
        let userLang = data.settings && data.settings.language;
        if (userLang && this.availableLanguages.includes(userLang)) {
            this.locale = userLang;
            return;
        }
        // Otherwise, use browser language if supported
        const browserLang = navigator.language.split('-')[0];
        if (this.availableLanguages.includes(browserLang)) {
            this.locale = browserLang;
        } else {
            this.locale = 'en';
        }
    }

    async loadMessages() {
        // Load messages.json for the current locale
        let url = `/_locales/${this.locale}/messages.json`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Locale not found');
            this.messages = await response.json();
        } catch (e) {
            // Fallback to English
            const response = await fetch('/_locales/en/messages.json');
            this.messages = await response.json();
        }
    }

    getMessage(key) {
        return this.messages[key]?.message || '';
    }

    updateUIText() {
        // Tab buttons
        const recentTab = document.querySelector('[data-tab="recent"]');
        if (recentTab) recentTab.textContent = this.getMessage('recent') || 'Recent';
        const pinnedTab = document.querySelector('[data-tab="pinned"]');
        if (pinnedTab) pinnedTab.textContent = this.getMessage('pinned') || 'Pinned';
        const settingsTab = document.querySelector('[data-tab="settings"]');
        if (settingsTab) settingsTab.textContent = this.getMessage('settings') || 'Settings';
        
        // Search placeholder
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.placeholder = this.getMessage('searchPlaceholder') || 'Search clipboard...';
        
        // Sort by label
        const sortByLabel = document.getElementById('sortByLabel');
        if (sortByLabel) sortByLabel.textContent = this.getMessage('sortBy') || 'Sort by:';
        
        // Items label
        const itemsLabel = document.getElementById('itemsLabel');
        if (itemsLabel) itemsLabel.textContent = this.getMessage('items') || 'items';
        
        // Sort options
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.options[0].text = this.getMessage('newest') || 'Newest';
            sortSelect.options[1].text = this.getMessage('oldest') || 'Oldest';
            sortSelect.options[2].text = this.getMessage('az') || 'Alphabetically A-Z';
            sortSelect.options[3].text = this.getMessage('za') || 'Alphabetically Z-A';
            sortSelect.options[4].text = this.getMessage('longest') || 'Most characters';
            sortSelect.options[5].text = this.getMessage('shortest') || 'Fewest characters';
            
            // Nastav aktuálnu hodnotu sortSelect podľa this.sortOrder
            sortSelect.value = this.sortOrder;
        }
        
        // Empty states
        const recentEmptyText = document.querySelector('#recentEmpty .empty-text');
        if (recentEmptyText) recentEmptyText.textContent = this.getMessage('noClipboardItems');
        const recentEmptySub = document.querySelector('#recentEmpty .empty-subtext');
        if (recentEmptySub) recentEmptySub.textContent = this.getMessage('copyToGetStarted');
        const pinnedEmptyText = document.querySelector('#pinnedEmpty .empty-text');
        if (pinnedEmptyText) pinnedEmptyText.textContent = this.getMessage('noPinnedItems');
        const pinnedEmptySub = document.querySelector('#pinnedEmpty .empty-subtext');
        if (pinnedEmptySub) pinnedEmptySub.textContent = this.getMessage('pinFavorites');
        
        // Update subscription details title
        const subscriptionDetailsTitle = document.querySelector('[data-i18n="subscriptionDetails"]');
        if (subscriptionDetailsTitle) {
            subscriptionDetailsTitle.textContent = this.getMessage('subscriptionDetails') || 'Subscription Details';
        }
        
        // Update upgrade button based on Pro status
        this.updateUpgradeButton();
        
        // Update subscription info with current language
        this.updateSubscriptionInfo();
        
        // Update translation quota
        this.updateTranslationQuota();
        
        // Theme toggle tooltip
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.title = this.getMessage('toggleTheme') || 'Toggle theme';
        
        // Export PDF button
        const exportPDFButton = document.getElementById('exportPDFButton');
        if (exportPDFButton) {
            exportPDFButton.textContent = this.getMessage('exportToPDF') || 'Export to PDF';
        }
        
        // Settings sekcie
        const settingsTitles = document.querySelectorAll('.settings-title');
        if (settingsTitles[0]) settingsTitles[0].textContent = this.getMessage('appearance');
        if (settingsTitles[1]) settingsTitles[1].textContent = this.getMessage('language');
        if (settingsTitles[2]) settingsTitles[2].textContent = this.getMessage('storage');
        if (settingsTitles[3]) settingsTitles[3].textContent = this.getMessage('translation');
        if (settingsTitles[4]) settingsTitles[4].textContent = this.getMessage('about');
        if (settingsTitles[5]) settingsTitles[5].textContent = this.getMessage('premiumFeatures') || 'Premium Features';
        
        // Settings labels
        const settingLabels = document.querySelectorAll('.setting-label');
        if (settingLabels[0]) settingLabels[0].textContent = this.getMessage('theme');
        if (settingLabels[1]) settingLabels[1].textContent = this.getMessage('interfaceLanguage');
        if (settingLabels[2]) settingLabels[2].textContent = this.getMessage('autoDeleteAfter');
        if (settingLabels[3]) settingLabels[3].textContent = this.getMessage('defaultLanguages');
        
        // Clear all button
        const clearBtn = document.getElementById('clearAllButton');
        if (clearBtn) clearBtn.textContent = this.getMessage('clearAllItems');
        
        // Privacy & Support
        const privacyLink = document.getElementById('privacyLink');
        if (privacyLink) privacyLink.textContent = this.getMessage('privacyPolicy');
        const supportLink = document.getElementById('supportLink');
        if (supportLink) supportLink.textContent = this.getMessage('support');
        
        // Premium sekcia
        const premiumLabel = document.querySelector('label[for="premiumMode"]');
        if (premiumLabel) premiumLabel.textContent = this.getMessage('enablePremium');
        const premiumInfo = document.querySelector('.premium-info p');
        if (premiumInfo) premiumInfo.textContent = this.getMessage('premiumIncludes');
        const premiumList = document.querySelectorAll('.premium-info ul li');
        if (premiumList[0]) premiumList[0].textContent = this.getMessage('unlimitedHistory');
        if (premiumList[1]) premiumList[1].textContent = this.getMessage('exportTxtCsvPdf');
        
        // Export feature text (nový element)
        const exportFeatureText = document.getElementById('exportFeatureText');
        if (exportFeatureText) exportFeatureText.textContent = this.getMessage('exportTxtCsvPdf');
        if (premiumList[2]) premiumList[2].textContent = this.getMessage('advancedTagging');
        if (premiumList[3]) premiumList[3].textContent = this.getMessage('unlimitedTranslations');
        
        // Theme select options
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.options[0].text = this.getMessage('themeAuto') || 'Auto';
            themeSelect.options[1].text = this.getMessage('themeLight') || 'Light';
            themeSelect.options[2].text = this.getMessage('themeDark') || 'Dark';
        }
        
        // Auto-delete select options
        const autoDeleteSelect = document.getElementById('autoDeleteSelect');
        if (autoDeleteSelect) {
            autoDeleteSelect.options[0].text = this.getMessage('never') || 'Never';
            autoDeleteSelect.options[1].text = this.getMessage('oneDay') || '1 day';
            autoDeleteSelect.options[2].text = this.getMessage('sevenDays') || '7 days';
            autoDeleteSelect.options[3].text = this.getMessage('thirtyDays') || '30 days';
        }
        
        // Update premium mode checkbox after UI text update
        this.updatePremiumModeCheckbox();
    }

    // New function to update upgrade button based on Pro status
    updateUpgradeButton() {
        const upgradeBtn = document.getElementById('upgradeButton');
        if (!upgradeBtn) return;
        
        if (this.isPro) {
            // User is Pro - show "Manage Subscription"
            upgradeBtn.textContent = this.getMessage('manageSubscription') || 'Manage Subscription';
            upgradeBtn.className = 'upgrade-button pro-active';
            upgradeBtn.title = this.getMessage('manageSubscriptionTooltip') || 'Manage your Pro subscription';
        } else {
            // User is not Pro - show "Upgrade Pro"
            upgradeBtn.textContent = this.getMessage('upgradePro') || 'Upgrade Pro';
            upgradeBtn.className = 'upgrade-button';
            upgradeBtn.title = this.getMessage('upgradeProTooltip') || 'Upgrade to Pro for unlimited features';
        }
    }

    async loadData() {
        try {
            const data = await chrome.storage.local.get(['clipboardItems', 'settings', 'isPro', 'tags', 'sortOrder', 'subscriptionPlan', 'subscriptionInterval']);
            this.clipboardItems = (data.clipboardItems || []).map(item => {
                if (item.tags) {
                    if (Array.isArray(item.tags)) {
                        item.tags = new Set(item.tags);
                    } else if (typeof item.tags === 'string') {
                        item.tags = new Set([item.tags]);
                    } else if (!(item.tags instanceof Set)) {
                        item.tags = new Set();
                    }
                }
                
                // Pridaj charCount property pre zoradenie podľa dĺžky
                if (item.text && typeof item.text === 'string') {
                    item.charCount = item.text.length;
                } else {
                    item.charCount = 0;
                }
                
                // Ak položka nemá charCount, pridaj ho
                if (typeof item.charCount === 'undefined' && item.text) {
                    item.charCount = item.text.length;
                }
                
                return item;
            });
            
            // Load Pro status and subscription info from storage
            this.isPro = data.isPro || false;
            this.subscriptionPlan = data.subscriptionPlan || 'unknown';
            this.subscriptionInterval = data.subscriptionInterval || 'month';
            this.settings = data.settings || this.getDefaultSettings();
            this.sortOrder = data.sortOrder || 'newest'; // Načítaj sortOrder z storage
            
            // Load tags
            if (data.tags) {
                if (Array.isArray(data.tags)) {
                    this.tags = new Set(data.tags);
                } else if (typeof data.tags === 'string') {
                    this.tags = new Set([data.tags]);
                } else {
                    this.tags = new Set();
                }
            } else {
                this.tags = new Set();
            }
            
            // Check ExtensionPay data to ensure isPro is correct
            await this.checkExtensionPayStatus();
            
            // Clean up old items based on auto-delete setting
            await this.cleanupOldItems();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    // New function to check ExtensionPay status
    async checkExtensionPayStatus() {
        try {
            // Check ExtensionPay storage for user data
            const syncData = await chrome.storage.sync.get(['extensionpay_user']);
            const localData = await chrome.storage.local.get(['extensionpay_user']);
            
            const extensionpayUser = syncData.extensionpay_user || localData.extensionpay_user;
            
            if (extensionpayUser && extensionpayUser.paid && !this.isPro) {
                console.log('💰 Found paid user in ExtensionPay data, updating isPro status');
                this.isPro = true;
                await chrome.storage.local.set({ isPro: true });
                console.log('✅ Updated isPro status to true from ExtensionPay data');
                this.updateUpgradeButton();
                this.updateUIText(); // Aktualizuje UI vrátane sortSelect
            } else if (extensionpayUser && !extensionpayUser.paid && this.isPro) {
                console.log('⚠️ User is not paid in ExtensionPay data, updating isPro status');
                this.isPro = false;
                await chrome.storage.local.set({ isPro: false });
                console.log('✅ Updated isPro status to false from ExtensionPay data');
                this.updateUpgradeButton();
                this.updateUIText(); // Aktualizuje UI vrátane sortSelect
            }
            
        } catch (error) {
            console.error('❌ Error checking ExtensionPay status:', error);
        }
    }



    getDefaultSettings() {
        return {
            theme: 'auto',
            language: 'en',
            autoDelete: 'never',
            translationLangs: ['en', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'nl', 'da', 'sv', 'no', 'fi', 'hr', 'sl', 'bg', 'sr', 'ro', 'lv', 'lt', 'et', 'ur', 'fa', 'th', 'he', 'el', 'cs', 'sk', 'hu', 'ru', 'uk', 'ar', 'tr', 'zh', 'ja', 'id', 'vi', 'ko', 'hi', 'bn']
        };
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        console.log('🔍 DOM ready state:', document.readyState);
        console.log('🔍 Body exists:', !!document.body);
        
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
                // updateUIText() sa nevolá pre zmenu tabov, len renderContent()
            });
        });

        // Search
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.filterItems();
            // Volaj renderContent() namiesto renderItems() aby fungoval search aj v Pinned záložke
            this.renderContent();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
            // updateUIText() sa nevolá pre zmenu témy, len toggleTheme()
        });

        // Settings
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.updateSetting('theme', e.target.value);
            this.applyTheme();
            // updateUIText() sa nevolá pre zmenu témy, len applyTheme()
        });

        document.getElementById('languageSelect').addEventListener('change', (e) => {
            this.updateSetting('language', e.target.value);
            // updateUIText() sa volá v updateSetting() pre zmenu jazyka
        });

        document.getElementById('autoDeleteSelect').addEventListener('change', (e) => {
            this.updateSetting('autoDelete', e.target.value);
            // updateUIText() sa nevolá pre zmenu auto-delete
        });

        // Translation language selects
        const langCodes = ['en', 'de', 'fr', 'es', 'it', 'pl', 'nl', 'da', 'sv', 'no', 'fi', 'hr', 'sl', 'bg', 'sr', 'ro', 'lv', 'lt', 'et', 'ur', 'fa', 'th', 'he', 'el', 'cs', 'ru', 'uk', 'ar', 'tr', 'zh', 'ja', 'id', 'vi', 'ko', 'hi', 'bn'];
        ['transLang1', 'transLang2', 'transLang3'].forEach((id, index) => {
            const select = document.getElementById(id);
            // Vymaž existujúce možnosti
            select.innerHTML = '';
            langCodes.forEach(code => {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = code.toUpperCase();
                select.appendChild(option);
            });
            select.value = this.settings.translationLangs[index] || langCodes[index];
            select.addEventListener('change', (e) => {
                this.settings.translationLangs[index] = e.target.value;
                this.updateSetting('translationLangs', this.settings.translationLangs);
                // updateUIText() sa nevolá pre zmenu translation languages
            });
        });

        // Clear all button (optional - only exists in Settings)
        const clearAllButton = document.getElementById('clearAllButton');
        if (clearAllButton) {
            clearAllButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all clipboard items?')) {
                    this.clearAllItems();
                }
            });
        }

        // Export PDF button (optional - only exists in Settings)
        const exportPDFButton = document.getElementById('exportPDFButton');
        if (exportPDFButton) {
            exportPDFButton.addEventListener('click', () => {
                this.exportToPDF();
            });
        }

        // Test Auto-Delete button (optional - only exists in Settings)
        const testAutoDeleteButton = document.getElementById('testAutoDeleteButton');
        if (testAutoDeleteButton) {
            testAutoDeleteButton.addEventListener('click', async () => {
                console.log('🧪 Manuálny test auto-delete funkcie...');
                await this.cleanupOldItems();
                this.renderContent();
                this.updateItemCount();
                this.showNotification('Auto-delete test dokončený - pozrite konzolu pre detaily');
            });
        }

        // Create Old Items button (for testing - optional)
        const createOldItemsButton = document.getElementById('createOldItemsButton');
        if (createOldItemsButton) {
            createOldItemsButton.addEventListener('click', async () => {
            const now = Date.now();
            const testItems = [
                {
                    id: 'test-old-1',
                    text: 'Stará položka - 2 dni',
                    type: 'text',
                    timestamp: now - (2 * 24 * 60 * 60 * 1000), // 2 dni dozadu
                    charCount: 20,
                    tags: new Set(),
                    pinned: false
                },
                {
                    id: 'test-old-2', 
                    text: 'Stará položka - 8 dní',
                    type: 'text',
                    timestamp: now - (8 * 24 * 60 * 60 * 1000), // 8 dní dozadu
                    charCount: 20,
                    tags: new Set(),
                    pinned: false
                },
                {
                    id: 'test-old-3',
                    text: 'Stará PRIPNUTÁ položka - 35 dní',
                    type: 'text', 
                    timestamp: now - (35 * 24 * 60 * 60 * 1000), // 35 dní dozadu
                    charCount: 35,
                    tags: new Set(),
                    pinned: true // Táto sa nemá vymazať!
                }
            ];
            
            // Pridaj testové položky
            this.clipboardItems.unshift(...testItems);
            await this.saveData();
            this.renderContent();
            this.updateItemCount();
            
            console.log('📅 Vytvorené testové staré položky:', testItems);
            this.showNotification('Vytvorené testové staré položky - teraz môžete testovať auto-delete');
            });
        }

        // Simple direct approach - trigger click programmatically after DOM is ready
        setTimeout(() => {
            const upgradeBtn = document.getElementById('upgradeButton');
            if (upgradeBtn) {
                console.log('✅ Setting up upgrade button with dispatchEvent...');
                
                // Add a custom click handler
                const handleUpgradeClick = () => {
                    console.log('🔄 Upgrade Pro clicked!');
                    
                    try {
                        if (this.isPro) {
                            console.log('👑 Opening subscription management...');
                            this.manageSubscription();
                        } else {
                            console.log('⬆️ Opening upgrade modal...');
                            this.togglePremiumMode(true);
                        }
                    } catch (error) {
                        console.error('❌ Error in upgrade handler:', error);
                    }
                };
                
                // Use modern event handling
                upgradeBtn.addEventListener('click', handleUpgradeClick, { passive: true });
                
                // Also add mousedown as backup
                upgradeBtn.addEventListener('mousedown', (e) => {
                    if (e.button === 0) { // Left click only
                        handleUpgradeClick();
                    }
                }, { passive: true });
                
                console.log('✅ Upgrade button handlers attached successfully');
            } else {
                console.error('❌ Upgrade button still not found after timeout');
            }
        }, 100); // Small delay to ensure DOM is ready





        // Links
        document.getElementById('welcomeLink').addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
        });

        document.getElementById('privacyLink').addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'https://tibco87.github.io/ClipSmart_ExtPay-/privacy.html' });
        });

        document.getElementById('supportLink').addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'https://tibco87.github.io/ClipSmart_ExtPay/index.html' });
        });

        // Premium mode toggle
        document.getElementById('premiumMode').addEventListener('change', (e) => {
            this.togglePremiumMode(e.target.checked);
            // updateUIText() sa volá v togglePremiumMode() ak je potrebné
        });

        // Zoradenie
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortOrder = e.target.value;
                // Volaj renderContent() namiesto renderItems() aby fungoval sort aj v Pinned záložke
                this.renderContent();
                // Ulož sortOrder do storage
                chrome.storage.local.set({ sortOrder: this.sortOrder });
            });
        }
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tab);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}Tab`);
        });

        // Show/hide search based on tab
        document.getElementById('searchContainer').style.display = 
            tab === 'settings' ? 'none' : 'block';

        // Render content for the current tab
        this.renderContent();
    }

    renderContent() {
        switch (this.currentTab) {
            case 'recent':
                this.filterItems();
                this.renderItems();
                break;
            case 'pinned':
                this.renderPinnedItems();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }
    }

    filterItems() {
        let items = this.clipboardItems.filter(item => !item.pinned && item.type !== 'translation');
        if (!this.searchQuery) {
            this.filteredItems = items;
            return;
        }
        const query = this.searchQuery.toLowerCase();
        this.filteredItems = items.filter(item => {
            return (
                item.text.toLowerCase().includes(query) ||
                (item.tags && Array.from(item.tags).some(tagText => tagText.toLowerCase().includes(query)))
            );
        });
    }

    filterPinnedItems() {
        // Zober len pinned položky
        let pinnedItems = this.clipboardItems.filter(item => item.pinned);
        if (!this.searchQuery) {
            return pinnedItems;
        }
        const query = this.searchQuery.toLowerCase();
        return pinnedItems.filter(item => {
            return (
                item.text.toLowerCase().includes(query) ||
                (item.tags && Array.from(item.tags).some(tagText => tagText.toLowerCase().includes(query)))
            );
        });
    }

    renderItems() {
        const container = document.getElementById('recentList');
        const emptyState = document.getElementById('recentEmpty');
        
        if (this.filteredItems.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = '';

        // Zoradenie podľa sortOrder
        let itemsToShow = [...this.filteredItems];
        switch (this.sortOrder) {
            case 'newest':
                itemsToShow.sort((a, b) => b.timestamp - a.timestamp);
                break;
            case 'oldest':
                itemsToShow.sort((a, b) => a.timestamp - b.timestamp);
                break;
            case 'az':
                itemsToShow.sort((a, b) => {
                    const aFirst = a.text.charAt(0).toLowerCase();
                    const bFirst = b.text.charAt(0).toLowerCase();
                    return aFirst.localeCompare(bFirst);
                });
                break;
            case 'za':
                itemsToShow.sort((a, b) => {
                    const aFirst = a.text.charAt(0).toLowerCase();
                    const bFirst = b.text.charAt(0).toLowerCase();
                    return bFirst.localeCompare(aFirst);
                });
                break;
            case 'longest':
                itemsToShow.sort((a, b) => b.charCount - a.charCount);
                break;
            case 'shortest':
                itemsToShow.sort((a, b) => a.charCount - b.charCount);
                break;
        }

        // Limit items for free users
        itemsToShow = this.isPro ? itemsToShow : itemsToShow.slice(0, this.freeItemLimit);

        itemsToShow.forEach(item => {
            const element = this.createItemElement(item);
            container.appendChild(element);
        });

        // Show upgrade prompt if there are more items
        if (!this.isPro && this.filteredItems.length > this.freeItemLimit) {
            const upgradePrompt = this.createUpgradePrompt();
            container.appendChild(upgradePrompt);
        }
    }

    renderPinnedItems() {
        const container = document.getElementById('pinnedList');
        const emptyState = document.getElementById('pinnedEmpty');
        
        // Použi filtrované pinned položky
        const filteredPinned = this.filterPinnedItems();
        
        if (filteredPinned.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = '';

        // Aplikuj zoradenie na pinned položky rovnako ako pri recent položkách
        let itemsToShow = [...filteredPinned];
        switch (this.sortOrder) {
            case 'newest':
                itemsToShow.sort((a, b) => b.timestamp - a.timestamp);
                break;
            case 'oldest':
                itemsToShow.sort((a, b) => a.timestamp - b.timestamp);
                break;
            case 'az':
                itemsToShow.sort((a, b) => {
                    const aFirst = a.text.charAt(0).toLowerCase();
                    const bFirst = b.text.charAt(0).toLowerCase();
                    return aFirst.localeCompare(bFirst);
                });
                break;
            case 'za':
                itemsToShow.sort((a, b) => {
                    const aFirst = a.text.charAt(0).toLowerCase();
                    const bFirst = b.text.charAt(0).toLowerCase();
                    return bFirst.localeCompare(aFirst);
                });
                break;
            case 'longest':
                itemsToShow.sort((a, b) => b.charCount - a.charCount);
                break;
            case 'shortest':
                itemsToShow.sort((a, b) => a.charCount - b.charCount);
                break;
        }

        itemsToShow.forEach(item => {
            const element = this.createItemElement(item);
            container.appendChild(element);
        });
    }

    createItemElement(item) {
        const template = document.getElementById('clipboardItemTemplate');
        const element = template.content.cloneNode(true).querySelector('.clipboard-item');
        
        // Set data attributes
        element.dataset.id = item.id;
        element.dataset.type = item.type;
        if (item.pinned) element.classList.add('pinned');

        // Set type icon
        const typeIcon = element.querySelector('.item-type-icon');
        typeIcon.textContent = this.getTypeIcon(item.type);

        // Set time
        const timeElement = element.querySelector('.item-time');
        timeElement.textContent = this.formatTime(item.timestamp);

        // Set content with expand/collapse functionality
        const contentElement = element.querySelector('.item-content');
        contentElement.textContent = item.text;
        
        // Pridaj funkcionalitu rozbalenia/zbalenia pre dlhý text
        if (item.text.length > 150) { // Ak je text dlhší ako 150 znakov
            contentElement.classList.add('expandable');
            contentElement.style.cursor = 'pointer';
            
            // Pridaj indikátor rozbalenia
            const expandIndicator = document.createElement('div');
            expandIndicator.className = 'expand-indicator';
            expandIndicator.innerHTML = this.getMessage('expand') || '📄 Expand';
            
            // Vlož indikátor po obsahu
            contentElement.parentNode.insertBefore(expandIndicator, contentElement.nextSibling);
            
            // Event listener pre rozbalenie/zbalenie
            const toggleExpand = () => {
                if (contentElement.classList.contains('expanded')) {
                    // Zbal
                    contentElement.classList.remove('expanded');
                    expandIndicator.innerHTML = this.getMessage('expand') || '📄 Expand';
                } else {
                    // Rozbal
                    contentElement.classList.add('expanded');
                    expandIndicator.innerHTML = this.getMessage('collapse') || '📄 Collapse';
                }
            };
            
            contentElement.addEventListener('click', toggleExpand);
            expandIndicator.addEventListener('click', toggleExpand);
        }

        // Set character count
        const charCount = element.querySelector('.item-char-count');
        charCount.textContent = `${item.charCount} characters`;

        // Add tags as heading
        const tagsContainer = element.querySelector('.item-tags');
        tagsContainer.innerHTML = '';
        if (item.tags) {
            let tagsArray = [];
            if (item.tags instanceof Set) {
                tagsArray = Array.from(item.tags);
            } else if (Array.isArray(item.tags)) {
                tagsArray = item.tags;
            } else if (typeof item.tags === 'string') {
                tagsArray = [item.tags];
            }
            
            if (tagsArray.length > 0) {
                tagsArray.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'item-tag';
                    tagElement.textContent = tag;
                    tagElement.title = tag;
                    tagsContainer.appendChild(tagElement);
                });
            }
        }

        // Add tag button handler
        const tagBtn = element.querySelector('.tag-btn');
        tagBtn.addEventListener('click', () => {
            const tag = prompt('Enter tag:');
            if (tag) {
                this.addTag(item.id, tag);
            }
        });

        // Nastav dynamické tooltipy
        element.querySelector('.translate-btn').title = this.getMessage('tooltipTranslate');
        
        // Dynamicky nastav tooltip pre pin button podľa stavu a záložky
        const pinBtn = element.querySelector('.pin-btn');
        if (item.pinned && this.currentTab === 'pinned') {
            // Ak je položka pripnutá a sme v záložke "Pripnuté", zobraz "Odopnúť"
            pinBtn.title = this.getMessage('tooltipUnpin');
        } else {
            // Inak zobraz "Pripnúť"
            pinBtn.title = this.getMessage('tooltipPin');
        }
        
        element.querySelector('.copy-btn').title = this.getMessage('tooltipCopy');
        element.querySelector('.delete-btn').title = this.getMessage('tooltipDelete');
        element.querySelector('.export-btn').title = this.getMessage('tooltipExport');

        // Setup action buttons
        this.setupItemActions(element, item);

        return element;
    }

    setupItemActions(element, item) {
        // Copy button
        element.querySelector('.copy-btn').addEventListener('click', () => {
            this.copyToClipboard(item.text);
            this.showNotification('Copied to clipboard!');
        });

        // Pin button
        const pinBtn = element.querySelector('.pin-btn');
        if (item.pinned) {
            pinBtn.innerHTML = '<span>📍</span>';
        }
        pinBtn.addEventListener('click', () => {
            this.togglePin(item.id);
        });
        
        // Aktualizuj tooltip pre pin button po kliknutí
        const updatePinTooltip = () => {
            if (item.pinned && this.currentTab === 'pinned') {
                pinBtn.title = this.getMessage('tooltipUnpin');
            } else {
                pinBtn.title = this.getMessage('tooltipPin');
            }
        };
        
        // Pridaj event listener pre aktualizáciu tooltipu
        pinBtn.addEventListener('mouseenter', updatePinTooltip);

        // Delete button
        element.querySelector('.delete-btn').addEventListener('click', () => {
            this.deleteItem(item.id);
        });

        // Translate button - vždy zobraziť
        const translateBtn = element.querySelector('.translate-btn');
        translateBtn.style.display = '';
        translateBtn.addEventListener('click', () => {
            this.showLanguageSelect(element, item);
        });

        // Export button (exportuje len túto položku) - zobrazené pre všetkých, ale kontroluje Pro status
        const exportBtn = element.querySelector('.export-btn');
        if (exportBtn) {
            exportBtn.style.display = '';
            exportBtn.addEventListener('click', () => {
                this.showExportMenu(element, item);
            });
        }
    }

    showLanguageSelect(element, item) {
        // Remove old panel if exists
        let oldPanel = element.querySelector('.translation-panel');
        if (oldPanel) oldPanel.remove();

        // Unique IDs for select and button
        const selectId = `langSelect-${item.id}`;
        const btnId = `translateGoBtn-${item.id}`;

        // Create language selection panel
        const panel = document.createElement('div');
        panel.className = 'translation-panel';
        panel.style.display = 'block';
        panel.innerHTML = `
            <div class="translation-list">
                <label for="${selectId}">${this.getMessage('selectTranslationLanguage') || 'Select translation language:'}</label>
                <select id="${selectId}">
                    <option value="en">English</option>
                    <option value="de">German</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="pl">Polish</option>
                    <option value="nl">Dutch</option>
                    <option value="da">Danish</option>
                    <option value="sv">Swedish</option>
                    <option value="no">Norwegian</option>
                    <option value="fi">Finnish</option>
                    <option value="hr">Croatian</option>
                    <option value="sl">Slovenian</option>
                    <option value="bg">Bulgarian</option>
                    <option value="sr">Serbian</option>
                    <option value="ro">Romanian</option>
                    <option value="lv">Latvian</option>
                    <option value="lt">Lithuanian</option>
                    <option value="et">Estonian</option>
                    <option value="ur">Urdu</option>
                    <option value="fa">Persian/Farsi</option>
                    <option value="th">Thai</option>
                    <option value="he">Hebrew</option>
                    <option value="el">Greek</option>
                    <option value="cs">Czech</option>
                    <option value="sk">Slovak</option>
                    <option value="hu">Hungarian</option>
                    <option value="ru">Russian</option>
                    <option value="uk">Ukrainian</option>
                    <option value="ar">Standard Arabic</option>
                    <option value="tr">Turkish</option>
                    <option value="zh">Mandarin Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="id">Indonesian</option>
                    <option value="vi">Vietnamese</option>
                    <option value="ko">Korean</option>
                    <option value="hi">Hindi</option>
                    <option value="bn">Bengali</option>
                </select>
                <button id="${btnId}">${this.getMessage('translate') || 'Translate'}</button>
                <div class="translation-result"></div>
            </div>
        `;
        element.appendChild(panel);

        const select = panel.querySelector(`#${selectId}`);
        const goBtn = panel.querySelector(`#${btnId}`);
        const resultDiv = panel.querySelector('.translation-result');

        goBtn.addEventListener('click', async () => {
            resultDiv.innerHTML = `<div class="loading">${this.getMessage('translating') || 'Translating...'}</div>`;
            const lang = select.value;
            try {
                const translation = await this.translateText(item.text, lang);
                resultDiv.innerHTML = '';
                if (translation) {
                    const transItem = this.createTranslationElement(lang, translation);
                    resultDiv.appendChild(transItem);
                } else {
                    resultDiv.innerHTML = `<div class="error">${this.getMessage('translationFailed') || 'Translation failed.'}</div>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<div class="error">${this.getMessage('translationFailed') || 'Translation failed.'}</div>`;
            }
        });
    }

    async translateText(text, targetLang) {
        // Kontrola limitu prekladov
        const canTranslate = await this.checkTranslationLimit();
        if (!canTranslate) {
            this.showUpgradeModal('Monthly translation limit reached. Upgrade to Pro for unlimited translations.');
            return null;
        }

        try {
            const translation = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(
                    { action: 'translateText', text, targetLang },
                    (response) => {
                        if (response && response.success) resolve(response.translation);
                        else reject(response?.error || 'Translation failed');
                    }
                );
            });
            
            // Zvýšenie počtu použitých prekladov
            await this.incrementTranslationCount();
            this.updateTranslationQuota();
            
            return translation;
        } catch (error) {
            console.error('Translation error:', error);
            return null;
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.error('Copy failed:', error);
        }
    }

    async togglePin(itemId) {
        const item = this.clipboardItems.find(i => i.id === itemId);
        if (item) {
            item.pinned = !item.pinned;
            await this.saveData();
            this.renderContent();
        }
    }

    async deleteItem(itemId) {
        this.clipboardItems = this.clipboardItems.filter(i => i.id !== itemId);
        await this.saveData();
        this.renderContent();
        this.updateItemCount();
        // Aktualizuj badge v backgrounde
        chrome.runtime.sendMessage({ action: 'updateBadge', count: this.clipboardItems.length });
    }

    async clearAllItems() {
        this.clipboardItems = [];
        await this.saveData();
        this.renderContent();
        this.updateItemCount();
        // Aktualizuj badge v backgrounde
        chrome.runtime.sendMessage({ action: 'updateBadge', count: 0 });
    }

    async saveData() {
        try {
            // Pri ukladaní konvertuj Set na pole
            const itemsToSave = this.clipboardItems.map(item => {
                const newItem = { ...item };
                if (item.tags) {
                    if (item.tags instanceof Set) {
                        newItem.tags = Array.from(item.tags);
                    } else if (Array.isArray(item.tags)) {
                        newItem.tags = item.tags;
                    } else if (typeof item.tags === 'string') {
                        newItem.tags = [item.tags];
                    } else {
                        newItem.tags = [];
                    }
                }
                return newItem;
            });
            await chrome.storage.local.set({ 
                clipboardItems: itemsToSave,
                tags: this.tags && this.tags instanceof Set ? Array.from(this.tags) : [],
                isPro: this.isPro,
                sortOrder: this.sortOrder // Ulož sortOrder do storage
            });
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    updateItemCount() {
        document.getElementById('itemCount').textContent = this.clipboardItems.length;
    }

    renderSettings() {
        // Update theme select
        document.getElementById('themeSelect').value = this.settings.theme;
        
        // Update language select
        document.getElementById('languageSelect').value = this.settings.language;
        
        // Update auto-delete select
        document.getElementById('autoDeleteSelect').value = this.settings.autoDelete;
        
        // Update translation language selects
        const langCodes = ['en', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'da', 'cs', 'sk', 'hu', 'uk', 'ar', 'tr', 'zh', 'ja', 'id', 'ko', 'hi'];
        ['transLang1', 'transLang2', 'transLang3'].forEach((id, index) => {
            const select = document.getElementById(id);
            select.innerHTML = '';
            langCodes.forEach(code => {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = code.toUpperCase();
                select.appendChild(option);
            });
            select.value = this.settings.translationLangs[index] || langCodes[index];
        });
        
        // Update translation quota
        this.updateTranslationQuota();
        
        // Update premium mode checkbox
        this.updatePremiumModeCheckbox();
    }

    updateTranslationQuota() {
        const quotaElement = document.getElementById('translationQuota');
        if (this.isPro) {
            quotaElement.innerHTML = `<span class="quota-text">${this.getMessage('unlimitedTranslationsPro') || 'Unlimited translations'}</span>`;
        } else {
            quotaElement.innerHTML = `
                <span class="quota-text">${this.getMessage('translationsUsed') || 'Translations used'}: 
                    <strong>${this.translationsUsed}/${this.freeTranslationLimit}</strong> ${this.getMessage('thisMonth') || 'this month'}
                </span>
            `;
        }
    }

    updatePremiumModeCheckbox() {
        const premiumCheckbox = document.getElementById('premiumMode');
        if (premiumCheckbox) {
            // Temporarily remove event listener to prevent triggering toggle
            const wasChecked = premiumCheckbox.checked;
            premiumCheckbox.checked = this.isPro;
            
            // Update label text based on Pro status
            const label = premiumCheckbox.nextElementSibling;
            if (label && label.tagName === 'LABEL') {
                if (this.isPro) {
                    label.textContent = this.getMessage('premiumModeActive') || 'Premium Mode Active';
                    label.style.color = '#28ca42';
                    label.style.fontWeight = 'bold';
                } else {
                    label.textContent = this.getMessage('enablePremium') || 'Enable Premium Mode';
                    label.style.color = '';
                    label.style.fontWeight = '';
                }
            }
            
            // Update checkbox disabled state
            premiumCheckbox.disabled = this.isPro;
            
            console.log('✅ Premium mode checkbox updated:', {
                isPro: this.isPro,
                checkboxChecked: premiumCheckbox.checked,
                checkboxDisabled: premiumCheckbox.disabled
            });
        }
        
        // Update subscription info display
        this.updateSubscriptionInfo();
    }
    
    updateSubscriptionInfo() {
        const subscriptionInfo = document.getElementById('subscriptionInfo');
        const subscriptionDetails = document.getElementById('subscriptionDetails');
        
        if (subscriptionInfo && subscriptionDetails) {
            if (this.isPro && this.subscriptionPlan && this.subscriptionInterval) {
                subscriptionInfo.style.display = 'block';
                
                const planName = this.subscriptionInterval === 'year' ? 
                    (this.getMessage('yearlyPlan') || 'Yearly Plan') : 
                    (this.getMessage('monthlyPlan') || 'Monthly Plan');
                const price = this.subscriptionInterval === 'year' ? 
                    (this.getMessage('yearlyPrice') || '€29.99/year') : 
                    (this.getMessage('monthlyPrice') || '€3.99/month');
                
                subscriptionDetails.innerHTML = `
                    <div class="subscription-details">
                        <p><strong>${this.getMessage('planIcon') || '📋'} ${this.getMessage('plan') || 'Plan'}:</strong> ${planName}</p>
                        <p><strong>${this.getMessage('priceIcon') || '💰'} ${this.getMessage('price') || 'Price'}:</strong> ${price}</p>
                        <p><strong>${this.getMessage('statusIcon') || '✅'} ${this.getMessage('status') || 'Status'}:</strong> <span style="color: #28ca42;">${this.getMessage('active') || 'Active'}</span></p>
                        ${this.subscriptionInterval === 'year' ? `<p><strong>${this.getMessage('savingsIcon') || '💡'} ${this.getMessage('savings') || 'Savings'}:</strong> ${this.getMessage('savingsAmount') || '€17.89 per year!'}</p>` : ''}
                    </div>
                `;
            } else {
                subscriptionInfo.style.display = 'none';
            }
        }
    }

    async updateSetting(key, value) {
        this.settings[key] = value;
        await chrome.storage.local.set({ settings: this.settings });
        if (key === 'language') {
            this.locale = value;
            await this.loadMessages();
            this.updateUIText(); // Aktualizuje UI vrátane sortSelect
            this.renderContent();
        }
    }

    applyTheme() {
        const theme = this.settings.theme;
        const root = document.documentElement;
        
        if (theme === 'auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', theme);
        }
        
        // Update theme icon
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = root.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.updateSetting('theme', newTheme);
        this.applyTheme();
    }

    async cleanupOldItems() {
        if (this.settings.autoDelete === 'never') {
            console.log('🗑️ Auto-delete je vypnuté (never)');
            return;
        }
        
        const now = Date.now();
        const days = parseInt(this.settings.autoDelete);
        const cutoff = now - (days * 24 * 60 * 60 * 1000);
        
        console.log('🗑️ Auto-delete diagnostika:', {
            nastavenie: this.settings.autoDelete + ' dní',
            pocetPoloziekPred: this.clipboardItems.length,
            cutoffDatum: new Date(cutoff).toLocaleString(),
            teraz: new Date(now).toLocaleString()
        });
        
        const itemsToDelete = this.clipboardItems.filter(item => 
            !item.pinned && item.timestamp <= cutoff
        );
        
        if (itemsToDelete.length > 0) {
            console.log('🗑️ Mažem staré položky:', itemsToDelete.map(item => ({
                text: item.text.substring(0, 50) + '...',
                vek: Math.floor((now - item.timestamp) / (24 * 60 * 60 * 1000)) + ' dní',
                pripnute: item.pinned
            })));
        }
        
        this.clipboardItems = this.clipboardItems.filter(item => 
            item.pinned || item.timestamp > cutoff
        );
        
        console.log('🗑️ Po vymazaní:', {
            pocetPoloziekPo: this.clipboardItems.length,
            vymazanych: itemsToDelete.length
        });
        
        if (itemsToDelete.length > 0) {
            await this.saveData();
        }
    }

    getTypeIcon(type) {
        const icons = {
            text: '📝',
            url: '🔗',
            email: '✉️',
            code: '💻'
        };
        return icons[type] || '📋';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    createUpgradePrompt() {
        const div = document.createElement('div');
        div.className = 'upgrade-prompt';
        div.innerHTML = `
            <div class="upgrade-icon">🔒</div>
            <p class="upgrade-text">
                ${this.clipboardItems.length - this.freeItemLimit} more items available
            </p>
            <button class="upgrade-btn">Upgrade to Pro</button>
        `;
        
        div.querySelector('.upgrade-btn').addEventListener('click', () => {
            this.togglePremiumMode(true);
        });
        
        return div;
    }

    showNotification(message) {
        // Create a simple notification (you can enhance this)
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--accent-color);
            color: white;
            padding: 12px 24px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }

    showUpgradeModal(message) {
        // Show upgrade modal (implement as needed)
        if (confirm(message)) {
            this.togglePremiumMode(true);
        }
    }

    async togglePremiumMode(enabled, plan = null) {
        if (enabled && !this.isPro) {
            // User wants to upgrade to Pro
            if (plan) {
                // Direct plan selection
                await this.upgradeToSpecificPlan(plan);
            } else {
                // Show plan selection modal
                this.showPlanSelectionModal();
            }
        } else if (!enabled && this.isPro) {
            // User wants to cancel Pro (this would require ExtensionPay cancel functionality)
            console.log('⚠️ Pro cancellation not implemented yet');
            this.showNotification('To cancel your Pro subscription, please contact support.');
        }
    }

    showPlanSelectionModal() {
        // Show upgrade modal (implement as needed)
        this.upgradeToSpecificPlan('monthly');
    }

    async upgradeToSpecificPlan(plan = 'monthly') {
        console.log(`🎯 upgradeToSpecificPlan called with plan: ${plan}`);
        
        try {
            if (this.extpay) {
                console.log('🚀 Opening ExtensionPay payment page...');
                
                // Simple approach - just open payment page (defaults to monthly)
                try {
                    await this.extpay.openPaymentPage();
                    console.log('✅ Payment page opened successfully');
                } catch (error) {
                    console.error('❌ ExtensionPay failed:', error);
                    
                    // Fallback: Open ExtensionPay website manually
                    console.log('🔄 Fallback: Opening ExtensionPay website');
                    chrome.tabs.create({ url: 'https://extensionpay.com/extension/nbpndheaoecmgnlmfpleeahoicpcbppj' });
                    this.showNotification('Opening payment page in new tab...');
                }
            } else {
                console.error('❌ ExtensionPay not available');
                // Fallback: Open ExtensionPay website manually
                console.log('🌐 Opening ExtensionPay website as fallback...');
                chrome.tabs.create({ url: 'https://extensionpay.com/extension/nbpndheaoecmgnlmfpleeahoicpcbppj' });
                this.showNotification('Opening payment page in new tab...');
            }
        } catch (error) {
            console.error(`❌ Error opening payment page:`, error);
            this.showNotification('Error opening payment page. Please try again.');
        }
    }

    // New function to manage subscription for Pro users
    async manageSubscription() {
        try {
            if (this.extpay) {
                console.log('🔧 Opening ExtensionPay login page for subscription management...');
                await this.extpay.openLoginPage();
            } else {
                console.error('❌ ExtensionPay not available');
                this.showNotification('Subscription management not available. Please try again later.');
            }
        } catch (error) {
            console.error('❌ Error opening subscription management:', error);
            this.showNotification('Error opening subscription management. Please try again.');
        }
    }

    async checkTranslationLimit() {
        if (this.isPro) return true;
        
        const today = new Date();
        const currentMonth = today.getFullYear() + '-' + (today.getMonth() + 1);
        const translationsThisMonth = await chrome.storage.local.get(['translationsThisMonth']);
        
        if (!translationsThisMonth.translationsThisMonth || translationsThisMonth.translationsThisMonth.month !== currentMonth) {
            // Reset pre nový mesiac
            await chrome.storage.local.set({
                translationsThisMonth: {
                    month: currentMonth,
                    count: 0
                }
            });
            this.translationsUsed = 0;
            return true;
        }
        
        this.translationsUsed = translationsThisMonth.translationsThisMonth.count;
        return this.translationsUsed < this.freeTranslationLimit;
    }

    async incrementTranslationCount() {
        if (this.isPro) return;
        
        const today = new Date();
        const currentMonth = today.getFullYear() + '-' + (today.getMonth() + 1);
        const translationsThisMonth = await chrome.storage.local.get(['translationsThisMonth']);
        
        if (!translationsThisMonth.translationsThisMonth || translationsThisMonth.translationsThisMonth.month !== currentMonth) {
            await chrome.storage.local.set({
                translationsThisMonth: {
                    month: currentMonth,
                    count: 1
                }
            });
            this.translationsUsed = 1;
        } else {
            const newCount = translationsThisMonth.translationsThisMonth.count + 1;
            await chrome.storage.local.set({
                translationsThisMonth: {
                    month: currentMonth,
                    count: newCount
                }
            });
            this.translationsUsed = newCount;
        }
    }

    async addTag(itemId, tag) {
        const item = this.clipboardItems.find(i => i.id === itemId);
        if (item) {
            // Ensure item.tags is a Set
            if (!item.tags) {
                item.tags = new Set();
            } else if (Array.isArray(item.tags)) {
                item.tags = new Set(item.tags);
            } else if (typeof item.tags === 'string') {
                item.tags = new Set([item.tags]);
            } else if (!(item.tags instanceof Set)) {
                item.tags = new Set();
            }
            
            item.tags.add(tag);
            if (!this.tags) this.tags = new Set();
            this.tags.add(tag);
            await this.saveData();
            this.renderContent();
        }
    }

    async removeTag(itemId, tag) {
        const item = this.clipboardItems.find(i => i.id === itemId);
        if (item && item.tags) {
            // Ensure item.tags is a Set
            if (Array.isArray(item.tags)) {
                item.tags = new Set(item.tags);
            } else if (typeof item.tags === 'string') {
                item.tags = new Set([item.tags]);
            } else if (!(item.tags instanceof Set)) {
                item.tags = new Set();
            }
            
            item.tags.delete(tag);
            // Check if tag is used by other items
            const isTagUsed = this.clipboardItems.some(i => {
                if (i.tags) {
                    if (Array.isArray(i.tags)) {
                        i.tags = new Set(i.tags);
                    } else if (typeof i.tags === 'string') {
                        i.tags = new Set([i.tags]);
                    } else if (!(i.tags instanceof Set)) {
                        i.tags = new Set();
                    }
                    return i.tags.has(tag);
                }
                return false;
            });
            if (!isTagUsed) {
                if (!this.tags) this.tags = new Set();
                this.tags.delete(tag);
            }
            await this.saveData();
            this.renderContent();
        }
    }

    async exportData(format) {
        if (!this.isPro) {
            this.showUpgradeModal('Export is a premium feature');
            return;
        }

        const data = this.clipboardItems.map(item => ({
            text: item.text,
            timestamp: this.formatTime(item.timestamp),
            tags: item.tags ? (item.tags instanceof Set ? Array.from(item.tags) : 
                              Array.isArray(item.tags) ? item.tags : 
                              typeof item.tags === 'string' ? [item.tags] : []) : [],
            translations: item.translations || {}
        }));

        let content;
        let filename;
        let mimeType;

        if (format === 'csv') {
            content = this.convertToCSV(data);
            filename = 'clipboard-export.csv';
            mimeType = 'text/csv';
        } else {
            content = JSON.stringify(data, null, 2);
            filename = 'clipboard-export.txt';
            mimeType = 'text/plain';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    convertToCSV(data) {
        const headers = ['Text', 'Timestamp', 'Tags', 'Translations'];
        const rows = data.map(item => [
            item.text,
            item.timestamp,
            Array.isArray(item.tags) ? item.tags.join(', ') : '',
            Object.entries(item.translations)
                .map(([lang, text]) => `${lang}: ${text}`)
                .join('; ')
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
    }

    exportSingleItem(item, format = 'txt') {
        if (!this.isPro) {
            this.showUpgradeModal('Export is a premium feature');
            return;
        }
        
        if (format === 'pdf') {
            this.exportToPDF([item]);
            return;
        }
        
        const data = {
            text: item.text,
            timestamp: this.formatTime(item.timestamp),
            tags: item.tags ? (item.tags instanceof Set ? Array.from(item.tags) : 
                              Array.isArray(item.tags) ? item.tags : 
                              typeof item.tags === 'string' ? [item.tags] : []) : [],
            translations: item.translations || {}
        };
        let content, filename, mimeType;
        if (format === 'csv') {
            content = this.convertToCSV([data]);
            filename = 'clipboard-item.csv';
            mimeType = 'text/csv';
        } else {
            content = JSON.stringify(data, null, 2);
            filename = 'clipboard-item.txt';
            mimeType = 'text/plain';
        }
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    createTranslationElement(lang, translation) {
        const div = document.createElement('div');
        div.className = 'translated-text flex items-center gap-2 p-2 bg-gray-100 rounded mt-2';
        
        div.innerHTML = `
            <strong>${lang.toUpperCase()}:</strong> <span class="translation-content">${translation}</span>
            <button class="copy-translation-btn" title="${this.getMessage('tooltipCopy') || 'Copy'}">📋</button>
            <button class="pin-translation-btn" title="${this.getMessage('tooltipPin') || 'Pin'}">⭐</button>
            <button class="export-translation-btn" title="${this.getMessage('tooltipExport') || 'Export'}">⬇️</button>
            <button class="close-translation-btn" title="${this.getMessage('close') || 'Close'}">✖️</button>
        `;
        // Copy handler
        div.querySelector('.copy-translation-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(translation);
            this.showNotification(this.getMessage('translationCopied') || 'Translation copied!');
        });
        // Pin handler
        div.querySelector('.pin-translation-btn').addEventListener('click', async () => {
            const newItem = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                text: translation,
                type: 'translation',
                timestamp: Date.now(),
                pinned: true,
                charCount: translation.length,
                translations: {},
                tags: new Set()
            };
            this.clipboardItems.push(newItem);
            await this.saveData();
            this.showNotification(this.getMessage('pinned') || 'Pinned!');
            this.renderContent();
        });
        // Export handler - zobrazené pre všetkých, ale kontroluje Pro status
        div.querySelector('.export-translation-btn').addEventListener('click', () => {
            this.exportTranslation(translation, lang);
        });
        // Close handler
        div.querySelector('.close-translation-btn').addEventListener('click', () => {
            div.remove();
        });
        return div;
    }

    exportTranslation(translation, lang) {
        if (!this.isPro) {
            this.showUpgradeModal('Export translations is a premium feature. Upgrade to Pro to export translations.');
            return;
        }
        
        // Export as TXT
        const txtBlob = new Blob([translation], { type: 'text/plain' });
        const txtUrl = URL.createObjectURL(txtBlob);
        const txtLink = document.createElement('a');
        txtLink.href = txtUrl;
        txtLink.download = `translation_${lang}.txt`;
        txtLink.click();
        URL.revokeObjectURL(txtUrl);
        // Export as CSV (jednoduchý formát: "lang,translation")
        const csvBlob = new Blob([`"${lang}","${translation.replace(/"/g, '""')}"`], { type: 'text/csv' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.download = `translation_${lang}.csv`;
        csvLink.click();
        URL.revokeObjectURL(csvUrl);
    }

    updatePinnedItems() {
        const pinnedContainer = document.getElementById('pinned-items');
        if (!pinnedContainer) return;
        pinnedContainer.innerHTML = '';
        const pinnedItems = this.clipboardItems.filter(item => item.pinned);
        if (pinnedItems.length === 0) {
            pinnedContainer.innerHTML = `<div class="text-gray-500">${this.getMessage('noPinnedItems') || 'No pinned items'}</div>`;
        } else {
            pinnedItems.forEach(item => {
                const itemElement = this.createClipboardItemElement(item);
                pinnedContainer.appendChild(itemElement);
            });
        }
    }

    exportToPDF(data = null) {
        if (!this.isPro) {
            this.showUpgradeModal('Export to PDF is a premium feature. Upgrade to Pro to export your clipboard items as PDF.');
            return;
        }

        // Použi poskytnuté dáta alebo všetky položky
        const itemsToExport = data || this.clipboardItems;
        
        if (itemsToExport.length === 0) {
            this.showNotification('No items to export');
            return;
        }

        try {
            // Kontrola či je jsPDF dostupný
            if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
                this.showNotification('PDF export is not available. Please reload the extension.');
                console.error('jsPDF library not loaded');
                return;
            }
            
            // Vytvor nový PDF dokument - jsPDF je dostupný cez window.jspdf.jsPDF
            let jsPDF;
            if (window.jspdf && window.jspdf.jsPDF) {
                jsPDF = window.jspdf.jsPDF;
                console.log('Using window.jspdf.jsPDF');
            } else {
                this.showNotification('PDF export library not available');
                console.error('jsPDF not found');
                return;
            }
            
            const doc = new jsPDF();
            
            // Nastav fonty a štýly
            doc.setFont('helvetica');
            
            // Nadpis
            doc.setFontSize(18);
            doc.setTextColor(40, 40, 40);
            doc.text('ClipSmart Export', 20, 25);
            
            // Dátum exportu
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            const exportDate = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
            doc.text(`Exportované: ${exportDate}`, 20, 35);
            
            // Počet položiek
            doc.text(`Celkovo položiek: ${itemsToExport.length}`, 20, 42);
            
            // Čiara pod hlavičkou
            doc.setDrawColor(200, 200, 200);
            doc.line(20, 50, 190, 50);
            
            // Export položiek
            let y = 65;
            let pageNumber = 1;
            
            itemsToExport.forEach((item, index) => {
                // Kontrola či sa zmestí na stránku
                if (y > 270) {
                    doc.addPage();
                    pageNumber++;
                    y = 20;
                    
                    // Hlavička na novej stránke
                    doc.setFontSize(12);
                    doc.setTextColor(100, 100, 100);
                    doc.text(`ClipSmart Export - Stránka ${pageNumber}`, 20, y);
                    y += 15;
                }
                
                // Číslo položky
                doc.setFontSize(10);
                doc.setTextColor(60, 60, 60);
                doc.text(`${index + 1}.`, 20, y);
                
                // Typ položky (ikona)
                const typeIcon = this.getTypeIcon(item.type);
                doc.text(typeIcon, 30, y);
                
                // Čas vytvorenia
                const timeText = this.formatTime(item.timestamp);
                doc.setTextColor(120, 120, 120);
                doc.setFontSize(8);
                doc.text(timeText, 45, y);
                
                // Tagy
                if (item.tags) {
                    let tagsArray = [];
                    if (item.tags instanceof Set) {
                        tagsArray = Array.from(item.tags);
                    } else if (Array.isArray(item.tags)) {
                        tagsArray = item.tags;
                    } else if (typeof item.tags === 'string') {
                        tagsArray = [item.tags];
                    }
                    
                    if (tagsArray.length > 0) {
                        const tagsText = tagsArray.join(', ');
                        doc.text(`[${tagsText}]`, 120, y);
                    }
                }
                
                y += 8;
                
                // Text položky
                doc.setFontSize(10);
                doc.setTextColor(20, 20, 20);
                
                // Rozdel text na riadky ak je dlhý
                const maxWidth = 160;
                const textLines = doc.splitTextToSize(item.text, maxWidth);
                
                textLines.forEach(line => {
                    if (y > 270) {
                        doc.addPage();
                        pageNumber++;
                        y = 20;
                    }
                    doc.text(line, 20, y);
                    y += 5;
                });
                
                // Počet znakov
                doc.setFontSize(8);
                doc.setTextColor(120, 120, 120);
                doc.text(`${item.charCount} znakov`, 20, y);
                
                y += 12;
                
                // Čiara medzi položkami (ak nie je posledná)
                if (index < itemsToExport.length - 1) {
                    doc.setDrawColor(240, 240, 240);
                    doc.line(20, y - 2, 190, y - 2);
                }
            });
            
            // Pätička
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`ClipSmart v1.0.5 - Stránka ${i} z ${totalPages}`, 20, 290);
            }
            
            // Ulož PDF
            const fileName = `clipsmart-export-${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(fileName);
            
            this.showNotification(this.getMessage('pdfExportSuccess') || 'PDF export successful!');
            
        } catch (error) {
            console.error('PDF export error:', error);
            this.showNotification('Chyba pri exporte PDF');
        }
    }

    showExportMenu(element, item) {
        // Zatvor všetky existujúce export menu
        const existingMenus = document.querySelectorAll('.export-menu');
        existingMenus.forEach(menu => menu.remove());
        
        // Ak už je menu otvorené pre túto položku, zatvor ho
        if (element.querySelector('.export-menu')) {
            return;
        }
        
        const menu = document.createElement('div');
        menu.className = 'export-menu';
        menu.innerHTML = `
            <button class="export-option" data-format="txt">${this.getMessage('exportTxt') || 'Export as TXT'}</button>
            <button class="export-option" data-format="csv">${this.getMessage('exportCsv') || 'Export as CSV'}</button>
            <button class="export-option" data-format="pdf">${this.getMessage('exportPdf') || 'Export as PDF'}</button>
        `;

        // Dropdown riešenie - menu sa zobrazí ako dropdown pod export button
        menu.style.position = 'relative';
        menu.style.top = 'auto';
        menu.style.left = 'auto';
        menu.style.transform = 'none';
        menu.style.zIndex = '1000';
        menu.style.marginTop = '5px';

        // Pridaj menu do položky
        element.appendChild(menu);

        // Kontrola, či sa menu zmestí do viewportu a ak nie, scrolluj popup
        setTimeout(() => {
            const menuRect = menu.getBoundingClientRect();
            const popupRect = document.body.getBoundingClientRect();
            const popupScrollContainer = document.querySelector('.popup-content') || document.body;

            // Ak sa menu nezmestí dole, scrolluj popup tak, aby bolo viditeľné
            if (menuRect.bottom > popupRect.height) {
                const scrollAmount = menuRect.bottom - popupRect.height + 20; // +20px pre margin
                popupScrollContainer.scrollTop += scrollAmount;
            }
        }, 10); // Malé oneskorenie pre správne výpočty

        // Funkcia na zatvorenie menu a cleanup
        const closeMenuAndCleanup = () => {
            if (menu && menu.parentNode) {
                menu.remove();
            }
            // Cleanup všetkých event listenerov
            document.removeEventListener('click', closeMenuOnClickOutside);
            document.removeEventListener('keydown', closeMenuOnEscape);
            window.removeEventListener('blur', closeMenuOnBlur);
        };

        // Zatvoriť menu pri kliknutí mimo
        const closeMenuOnClickOutside = (event) => {
            // Ak klikol na export tlačidlo tej istej položky, nezatváraj menu (toggle)
            if (event.target.closest('.export-btn') && event.target.closest('.clipboard-item') === element) {
                return;
            }
            
            // Ak klikol mimo menu (aj v tej istej položke), zatvor menu
            if (!menu.contains(event.target)) {
                closeMenuAndCleanup();
            }
        };

        // Zatvoriť menu pri stlačení Escape
        const closeMenuOnEscape = (event) => {
            if (event.key === 'Escape') {
                closeMenuAndCleanup();
            }
        };

        // Zatvoriť menu pri strate focusu
        const closeMenuOnBlur = () => {
            closeMenuAndCleanup();
        };

        // Event listener pre kliknutie na menu
        menu.addEventListener('click', (e) => {
            if (e.target.classList.contains('export-option')) {
                const format = e.target.dataset.format;
                this.exportSingleItem(item, format);
                closeMenuAndCleanup();
            }
        });

        // Pridať event listenerov (bez scroll a wheel)
        document.addEventListener('click', closeMenuOnClickOutside);
        document.addEventListener('keydown', closeMenuOnEscape);
        window.addEventListener('blur', closeMenuOnBlur);
        
        // Zatvoriť menu pri kliknutí na export tlačidlo tej istej položky (toggle)
        const exportBtn = element.querySelector('.export-btn');
        if (exportBtn) {
            const toggleMenu = (e) => {
                e.stopPropagation(); // Zabráň propagácii eventu
                if (element.querySelector('.export-menu')) {
                    closeMenuAndCleanup();
                }
            };
            exportBtn.addEventListener('click', toggleMenu);
        }
    }
}

// Initialize ClipSmart when DOM is ready
console.log('🚀 Starting ClipSmart initialization...');
console.log('🔍 Document ready state:', document.readyState);

if (document.readyState === 'loading') {
    console.log('⏳ DOM still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOMContentLoaded fired, initializing ClipSmart...');
        new ClipSmart();
    });
} else {
    console.log('✅ DOM already ready, initializing ClipSmart immediately...');
    new ClipSmart();
}