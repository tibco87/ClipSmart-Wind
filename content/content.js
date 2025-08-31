// ClipSmart Content Script

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'copyToClipboard') {
        // Copy text to clipboard
        copyToClipboard(request.text);
        sendResponse({ success: true });
    }
    if (request.action === "getClipboardText") {
        console.log('📋 Content script: getClipboardText požiadavka prijatá');
        
        if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText()
                .then(text => {
                    console.log('📋 Clipboard obsah načítaný:', text ? text.substring(0, 50) + '...' : '(prázdne)');
                    sendResponse({ text });
                })
                .catch((error) => {
                    // Silent error handling - don't log to console to avoid Chrome extension errors
                    console.log('📋 Clipboard read failed silently');
                    sendResponse({ text: "", error: null });
                });
        } else {
            console.log('⚠️ Clipboard API nie je dostupné, používam fallback');
            sendResponse({ text: "", error: "Clipboard API not available" });
        }
        return true; // async odpoveď
    }
});

// Add clipboard change event listener
document.addEventListener('copy', (event) => {
    console.log('🎯 Copy event zachytený v content scripte');
    
    // Get selected text
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : '';
    
    if (selectedText) {
        console.log('📝 Vybraný text:', selectedText.substring(0, 50) + '...');
        
        // Send to background script
        chrome.runtime.sendMessage({
            action: 'clipboardChanged',
            text: selectedText,
            source: 'copy-event'
        }).catch(error => {
            console.log('📋 Copy message send failed silently');
        });
    }
});

// Add paste event listener for better monitoring
document.addEventListener('paste', (event) => {
    console.log('📋 Paste event zachytený v content scripte');
    
    // Get pasted text
    const pastedText = event.clipboardData ? event.clipboardData.getData('text') : '';
    
    if (pastedText) {
        console.log('📝 Vložený text:', pastedText.substring(0, 50) + '...');
        
        // Send to background script
        chrome.runtime.sendMessage({
            action: 'clipboardChanged',
            text: pastedText,
            source: 'paste-event'
        }).catch(error => {
            console.log('📋 Paste message send failed silently');
        });
    }
});

// Helper function to copy text to clipboard
async function copyToClipboard(text) {
    try {
        // Try using the modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            showNotification('Copied to clipboard!');
        } else {
            // Fallback method
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('Copied to clipboard!');
        }
    } catch (error) {
        console.log('📋 Copy to clipboard failed silently');
        showNotification('Failed to copy to clipboard', 'error');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existing = document.querySelector('.clipsmart-notification');
    if (existing) {
        existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'clipsmart-notification';
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#ff6b35' : '#ff3b30'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 999999;
        animation: clipsmart-slide-in 0.3s ease-out;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes clipsmart-slide-in {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes clipsmart-fade-out {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }
    `;
    
    if (!document.querySelector('#clipsmart-styles')) {
        style.id = 'clipsmart-styles';
        document.head.appendChild(style);
    }

    // Add to page
    document.body.appendChild(notification);

    // Remove after delay
    setTimeout(() => {
        notification.style.animation = 'clipsmart-fade-out 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

// Optional: Add keyboard shortcut handler
document.addEventListener('keydown', (event) => {
    // Example: Ctrl+Shift+V to open ClipSmart
    if (event.ctrlKey && event.shiftKey && event.key === 'V') {
        event.preventDefault();
        chrome.runtime.sendMessage({ action: 'openPopup' });
    }
});

// Monitor URL changes and send to background script
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        // Send URL change to background script
        chrome.runtime.sendMessage({
            action: 'urlChanged',
            url: currentUrl
        });
    }
});

// Start observing URL changes
observer.observe(document, { subtree: true, childList: true });