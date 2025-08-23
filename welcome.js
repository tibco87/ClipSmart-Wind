// Welcome page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Contact form handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleContactForm();
        });
    }

    // Add scroll animations
    addScrollAnimations();

    // Initialize tooltips and other UI elements
    initializeUI();
});

// Handle contact form submission
function handleContactForm() {
    const form = document.getElementById('contactForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    // Send to Formspree
    fetch('https://formspree.io/f/mqalbkko', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            showNotification('Thank you! Your message has been sent successfully. We\'ll get back to you within 24 hours.', 'success');
            form.reset();
        } else {
            throw new Error('Failed to send message');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Sorry, there was an error sending your message. Please try again or contact us directly at tkutik72@gmail.com', 'error');
    })
    .finally(() => {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.background = type === 'success' ? '#28ca42' : type === 'error' ? '#ff4757' : '#667eea';
    // Create notification content safely
    const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'notification-content';
    
    const icon = document.createElement('i');
    icon.className = `fas ${iconClass}`;
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.onclick = function() {
        this.parentElement.parentElement.remove();
    };
    
    contentDiv.appendChild(icon);
    contentDiv.appendChild(messageSpan);
    contentDiv.appendChild(closeButton);
    
    notification.appendChild(contentDiv);

    // CSS styles are now in welcome.css

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add scroll animations
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.feature-card, .pricing-card, .contact-form');
    if (animatedElements && animatedElements.length > 0) {
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
}

// Initialize UI elements
function initializeUI() {
    // Add hover effects to buttons
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    if (buttons && buttons.length > 0) {
        buttons.forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }
    // Add parallax effect to hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        });
    }
}

// Global functions for onclick handlers
function openExtension() {
    // Try to open the extension popup
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'openPopup' });
    } else {
        showNotification('Please click on the ClipSmart extension icon in your browser toolbar.', 'info');
    }
}

function upgradeToPro() {
    // Try to open the extension and trigger upgrade
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'upgradeToPro' });
    } else {
        showNotification('Please open the ClipSmart extension and click "Upgrade Pro" to get started.', 'info');
    }
}

function scrollToFeatures() {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        featuresSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Add some interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Add click effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards && featureCards.length > 0) {
        featureCards.forEach(card => {
            card.addEventListener('click', function() {
                // Add a subtle click effect
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        });
    }

    // Add typing effect to hero title
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        heroTitle.textContent = '';
        let i = 0;
        
        function typeWriter() {
            if (i < originalText.length) {
                heroTitle.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        }
        
        // Start typing effect after a short delay
        setTimeout(typeWriter, 500);
    }

    // Add floating animation to mockup
    const mockup = document.querySelector('.mockup');
    if (mockup) {
        mockup.style.animation = 'float 6s ease-in-out infinite';
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0%, 100% { transform: perspective(1000px) rotateY(-5deg) rotateX(5deg) translateY(0px); }
                50% { transform: perspective(1000px) rotateY(-5deg) rotateX(5deg) translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }
});

// Add some additional utility functions
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard!', 'success');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Copied to clipboard!', 'success');
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to scroll to features
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        scrollToFeatures();
    }
    
    // Escape to close notifications
    if (e.key === 'Escape') {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => notification.remove());
    }
});

// Add some Easter eggs
let clickCount = 0;
document.addEventListener('click', function(e) {
    if (e.target.closest('.nav-logo')) {
        clickCount++;
        if (clickCount === 5) {
            showNotification('🎉 You found the secret! Thanks for being awesome!', 'success');
            clickCount = 0;
        }
    }
}); 