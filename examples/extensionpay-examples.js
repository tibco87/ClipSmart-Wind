// ExtensionPay Usage Examples for ClipSmart

// 1. Základná inicializácia
const extpay = window.ExtPay(chrome.runtime.id);

// 2. Získanie informácií o používateľovi
async function getUserInfo() {
    try {
        const user = await extpay.getUser();
        console.log('User info:', user);
        
        if (user.paid) {
            console.log('User has premium subscription');
            console.log('Paid at:', user.paidAt);
        } else {
            console.log('User has free account');
        }
        
        console.log('Installed at:', user.installedAt);
        if (user.trialStartedAt) {
            console.log('Trial started at:', user.trialStartedAt);
        }
        
        return user;
    } catch (error) {
        console.error('Error getting user info:', error);
        return null;
    }
}

// 3. Sledovanie platby
function setupPaymentListener() {
    extpay.onPaid.addListener((user) => {
        console.log('Payment received!', user);
        
        // Aktualizujte UI
        updateUIForPremium();
        
        // Zobrazte notifikáciu
        showNotification('Premium activated!');
        
        // Aktualizujte limity
        updateLimits();
    });
}

// 4. Otvorenie platobnej stránky
async function openPayment() {
    try {
        await extpay.openPaymentPage();
        console.log('Payment page opened');
    } catch (error) {
        console.error('Error opening payment page:', error);
        showNotification('Payment failed. Please try again.');
    }
}

// 5. Otvorenie platobnej stránky pre konkrétny plán
async function openSpecificPlan(planNickname) {
    try {
        await extpay.openPaymentPage(planNickname);
        console.log(`Payment page opened for plan: ${planNickname}`);
    } catch (error) {
        console.error('Error opening payment page:', error);
    }
}

// 6. Získanie dostupných plánov
async function getAvailablePlans() {
    try {
        const plans = await extpay.getPlans();
        console.log('Available plans:', plans);
        return plans;
    } catch (error) {
        console.error('Error getting plans:', error);
        return [];
    }
}

// 7. Trial funkcionalita
async function startTrial(period = '1 week') {
    try {
        await extpay.openTrialPage(period);
        console.log(`Trial page opened for ${period}`);
    } catch (error) {
        console.error('Error opening trial page:', error);
    }
}

// 8. Login pre existujúcich používateľov
async function openLoginPage() {
    try {
        await extpay.openLoginPage();
        console.log('Login page opened');
    } catch (error) {
        console.error('Error opening login page:', error);
    }
}

// 9. Kontrola limity pre free používateľov
function checkLimits(user, currentUsage) {
    const config = window.EXTPAY_CONFIG;
    
    if (user.paid) {
        return {
            canAddItem: true,
            canTranslate: true,
            canExport: true,
            canUseTags: true
        };
    } else {
        return {
            canAddItem: currentUsage.items < config.limits.free.items,
            canTranslate: currentUsage.translations < config.limits.free.translationsPerDay,
            canExport: config.limits.free.exportFormats.includes('txt'),
            canUseTags: config.limits.free.tags
        };
    }
}

// 10. Zobrazovanie upgrade promptu
function showUpgradePrompt(feature) {
    const upgradeMessage = `Upgrade to Premium to unlock ${feature}!`;
    
    // Zobrazte modal alebo notifikáciu
    showModal({
        title: 'Premium Feature',
        message: upgradeMessage,
        buttons: [
            {
                text: 'Upgrade Now',
                action: () => openPayment()
            },
            {
                text: 'Maybe Later',
                action: () => closeModal()
            }
        ]
    });
}

// 11. Kompletná implementácia pre ClipSmart
class ClipSmartPaymentManager {
    constructor() {
        this.extpay = window.ExtPay(chrome.runtime.id);
        this.user = null;
        this.setupListeners();
    }
    
    async initialize() {
        try {
            this.user = await this.extpay.getUser();
            this.updateLimits();
            this.updateUI();
            return this.user;
        } catch (error) {
            console.error('Error initializing payment manager:', error);
            return null;
        }
    }
    
    setupListeners() {
        this.extpay.onPaid.addListener((user) => {
            this.user = user;
            this.updateLimits();
            this.updateUI();
            this.showNotification('Premium activated!');
        });
        
        this.extpay.onTrialStarted.addListener((user) => {
            this.user = user;
            this.showNotification('Trial started!');
        });
    }
    
    updateLimits() {
        const config = window.EXTPAY_CONFIG;
        
        if (this.user && this.user.paid) {
            this.itemLimit = config.limits.premium.items;
            this.translationLimit = config.limits.premium.translationsPerDay;
            this.canUseTags = config.limits.premium.tags;
            this.exportFormats = config.limits.premium.exportFormats;
        } else {
            this.itemLimit = config.limits.free.items;
            this.translationLimit = config.limits.free.translationsPerDay;
            this.canUseTags = config.limits.free.tags;
            this.exportFormats = config.limits.free.exportFormats;
        }
    }
    
    updateUI() {
        // Aktualizujte UI podľa premium statusu
        const upgradeButton = document.getElementById('upgradeButton');
        if (upgradeButton) {
            upgradeButton.style.display = this.user && this.user.paid ? 'none' : 'block';
        }
        
        // Aktualizujte badge
        if (this.user && this.user.paid) {
            document.body.classList.add('premium');
        } else {
            document.body.classList.remove('premium');
        }
    }
    
    async upgrade() {
        try {
            await this.extpay.openPaymentPage();
        } catch (error) {
            console.error('Upgrade failed:', error);
            this.showNotification('Upgrade failed. Please try again.');
        }
    }
    
    canAddItem(currentCount) {
        return this.user && this.user.paid ? true : currentCount < this.itemLimit;
    }
    
    canTranslate(currentCount) {
        return this.user && this.user.paid ? true : currentCount < this.translationLimit;
    }
    
    canExport(format) {
        return this.exportFormats.includes(format);
    }
    
    canUseTags() {
        return this.canUseTags;
    }
    
    showNotification(message) {
        // Implementácia notifikácie
        console.log('Notification:', message);
    }
}

// Export pre použitie
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getUserInfo,
        setupPaymentListener,
        openPayment,
        openSpecificPlan,
        getAvailablePlans,
        startTrial,
        openLoginPage,
        checkLimits,
        showUpgradePrompt,
        ClipSmartPaymentManager
    };
} 