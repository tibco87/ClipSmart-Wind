// ExtensionPay Configuration for ClipSmart
// This file contains configuration for ExtensionPay integration

// Extension ID from Chrome Web Store (PRODUCTION)
const EXTENSION_ID = 'nbpndheaoecmgnlmfpleeahoicpcbppj';

// ExtensionPay configuration
const EXTPAY_CONFIG = {
    // Your ExtensionPay extension ID (get this from extensionpay.com dashboard)
    extensionId: EXTENSION_ID,
    
    // Feature limits
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

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EXTPAY_CONFIG;
} else if (typeof window !== 'undefined') {
    window.EXTPAY_CONFIG = EXTPAY_CONFIG;
} 