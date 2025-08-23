// Privacy Policy page functionality
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

    // Add scroll animations
    addScrollAnimations();

    // Initialize table of contents
    initializeTableOfContents();

    // Add print functionality
    addPrintFunctionality();

    // Add search functionality
    addSearchFunctionality();
});

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

    // Observe privacy sections for animation
    const privacySections = document.querySelectorAll('.privacy-section');
    privacySections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
}

// Initialize table of contents
function initializeTableOfContents() {
    const sections = document.querySelectorAll('.privacy-section h2');
    if (sections.length > 0) {
        const toc = document.createElement('div');
        toc.className = 'table-of-contents';
        // Create TOC safely
        const tocTitle = document.createElement('h3');
        tocTitle.textContent = 'Table of Contents';
        
        const tocList = document.createElement('ul');
        
        Array.from(sections).forEach((section, index) => {
            const id = `section-${index + 1}`;
            section.id = id;
            
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${id}`;
            link.textContent = section.textContent;
            
            listItem.appendChild(link);
            tocList.appendChild(listItem);
        });
        
        toc.appendChild(tocTitle);
        toc.appendChild(tocList);

        // Insert TOC after privacy header
        const privacyHeader = document.querySelector('.privacy-header');
        if (privacyHeader) {
            privacyHeader.parentNode.insertBefore(toc, privacyHeader.nextSibling);
        }

        // Add TOC styles
        const style = document.createElement('style');
        style.textContent = `
            .table-of-contents {
                background: white;
                border-radius: 15px;
                padding: 30px;
                margin-bottom: 40px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
                border-left: 4px solid #667eea;
            }
            .table-of-contents h3 {
                margin-bottom: 20px;
                color: #333;
                font-size: 1.3rem;
            }
            .table-of-contents ul {
                list-style: none;
                padding: 0;
            }
            .table-of-contents li {
                margin-bottom: 10px;
            }
            .table-of-contents a {
                color: #667eea;
                text-decoration: none;
                padding: 8px 12px;
                border-radius: 8px;
                transition: all 0.3s ease;
                display: block;
            }
            .table-of-contents a:hover {
                background: rgba(102, 126, 234, 0.1);
                transform: translateX(5px);
            }
            @media (max-width: 768px) {
                .table-of-contents {
                    padding: 20px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Add print functionality
function addPrintFunctionality() {
    // Add print button
    const printBtn = document.createElement('button');
    printBtn.innerHTML = '<i class="fas fa-print"></i> Print Policy';
    printBtn.className = 'print-btn';
    printBtn.onclick = () => window.print();

    // Add print button styles
    const style = document.createElement('style');
    style.textContent = `
        .print-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 20px;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        .print-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
        }
        @media print {
            .print-btn {
                display: none;
            }
        }
        @media (max-width: 768px) {
            .print-btn {
                bottom: 20px;
                right: 20px;
                padding: 12px 16px;
                font-size: 0.9rem;
            }
        }
    `;
    document.head.appendChild(style);

    // Add button to page
    document.body.appendChild(printBtn);
}

// Add search functionality
function addSearchFunctionality() {
    // Search functionality is now handled by existing HTML elements

    // Add search functionality
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    const sections = document.querySelectorAll('.privacy-section');

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (query === '') {
            // Show all sections and remove highlights
            sections.forEach(section => {
                section.classList.remove('section-hidden');
                removeHighlights(section);
            });
            clearBtn.style.display = 'none';
            return;
        }

        clearBtn.style.display = 'block';
        let hasResults = false;

        sections.forEach(section => {
            const text = section.textContent.toLowerCase();
            if (text.includes(query)) {
                section.classList.remove('section-hidden');
                highlightText(section, query);
                hasResults = true;
            } else {
                section.classList.add('section-hidden');
            }
        });

        // Show no results message
        let noResults = document.querySelector('.no-results');
        if (!hasResults) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.className = 'no-results';
                // Create no results message safely
                const searchIcon = document.createElement('i');
                searchIcon.className = 'fas fa-search';
                
                const messageP = document.createElement('p');
                messageP.textContent = `No results found for "${query}"`;
                
                noResults.appendChild(searchIcon);
                noResults.appendChild(messageP);
                document.querySelector('.privacy-content').appendChild(noResults);
            }
        } else if (noResults) {
            noResults.remove();
        }
    });

    clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        searchInput.focus();
        sections.forEach(section => {
            section.classList.remove('section-hidden');
            removeHighlights(section);
        });
        this.style.display = 'none';
        const noResults = document.querySelector('.no-results');
        if (noResults) noResults.remove();
    });
}

// Highlight text in element
function highlightText(element, query) {
    removeHighlights(element);
    
    function highlightNode(node) {
        if (node.nodeType === 3) { // Text node
            const text = node.textContent;
            const regex = new RegExp(`(${query})`, 'gi');
            if (regex.test(text)) {
                const highlightedText = text.replace(regex, '<span class="highlight">$1</span>');
                const span = document.createElement('span');
                // Create highlight safely without innerHTML
                const parts = text.split(regex);
                const fragment = document.createDocumentFragment();
                
                for (let i = 0; i < parts.length; i++) {
                    if (parts[i]) {
                        fragment.appendChild(document.createTextNode(parts[i]));
                    }
                    if (i < parts.length - 1) {
                        const highlightSpan = document.createElement('span');
                        highlightSpan.className = 'highlight';
                        highlightSpan.textContent = query;
                        fragment.appendChild(highlightSpan);
                    }
                }
                
                span.appendChild(fragment);
                node.parentNode.replaceChild(span, node);
            }
        } else if (node.nodeType === 1) { // Element node
            Array.from(node.childNodes).forEach(highlightNode);
        }
    }
    
    highlightNode(element);
}

// Remove highlights from element
function removeHighlights(element) {
    const highlights = element.querySelectorAll('.highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
        }
    }
});

// Add some interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Add click effects to contact items
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        item.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Add copy email functionality
    const emailElement = document.querySelector('.contact-item p');
    if (emailElement && emailElement.textContent.includes('@')) {
        emailElement.style.cursor = 'pointer';
        emailElement.title = 'Click to copy email';
        emailElement.addEventListener('click', function() {
            const email = this.textContent;
            navigator.clipboard.writeText(email).then(() => {
                showCopyNotification('Email copied to clipboard!');
            });
        });
    }
});

// Show copy notification
function showCopyNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #28ca42;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
} 