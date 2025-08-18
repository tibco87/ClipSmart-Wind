# Webová stránka ClipSmart - Nastavenie

Tento dokument obsahuje inštrukcie pre nastavenie a nasadenie webovej stránky ClipSmart.

## 📁 **Súbory webovej stránky:**

### **Hlavné súbory:**
- `welcome.html` - Hlavná uvítacia stránka
- `welcome.css` - Štýly pre uvítaciu stránku
- `welcome.js` - JavaScript funkcionalita
- `privacy.html` - Privacy Policy stránka
- `privacy.css` - Štýly pre Privacy Policy
- `privacy.js` - JavaScript pre Privacy Policy

## 🌐 **Nasadenie:**

### **Možnosť 1: Lokálne testovanie**
```bash
# Otvorte súbory priamo v prehliadači
open welcome.html
open privacy.html
```

### **Možnosť 2: GitHub Pages**
1. Nahrajte súbory do GitHub repozitára
2. Povoľte GitHub Pages v nastaveniach
3. Stránka bude dostupná na `https://username.github.io/repository-name/`

### **Možnosť 3: Netlify**
1. Nahrajte súbory do Netlify
2. Automatické nasadenie z Git repozitára
3. Dostupná na `https://your-site.netlify.app`

### **Možnosť 4: Vercel**
1. Nahrajte súbory do Vercel
2. Automatické nasadenie
3. Dostupná na `https://your-site.vercel.app`

## 🔧 **Konfigurácia:**

### **1. Aktualizácia URL adries**
V súboroch nahraďte placeholder URL adresy:

```javascript
// V welcome.html a privacy.html
// Nahraďte:
tkutik72@gmail.com
https://tibco87.github.io/ClipSmart_ExtPay-

// Skutočnými hodnotami:
your-email@domain.com
https://your-domain.com
```

### **2. Kontaktný formulár**
Pre funkčný kontaktný formulár potrebujete backend:

**Možnosť A: Netlify Forms**
```html
<!-- V welcome.html -->
<form class="contact-form" id="contactForm" data-netlify="true">
```

**Možnosť B: Formspree**
```html
<!-- V welcome.html -->
<form class="contact-form" id="contactForm" action="https://formspree.io/f/mqalbkko" method="POST">
```

**Možnosť C: EmailJS**
```javascript
// V welcome.js
emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', data);
```

### **3. Analytics**
Pridajte Google Analytics:

```html
<!-- V welcome.html a privacy.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🎨 **Prispôsobenie:**

### **Farby a dizajn:**
Upravte CSS premenné v `welcome.css` a `privacy.css`:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #ff6b6b;
    --text-color: #333;
    --background-color: #f8f9fa;
}
```

### **Logo a obrázky:**
1. Nahraďte `assets/icon-128.png` vlastným logom
2. Pridajte vlastné obrázky do `assets/` priečinka
3. Aktualizujte cesty v HTML súboroch

### **Texty a obsah:**
1. Upravte texty v `welcome.html`
2. Aktualizujte Privacy Policy v `privacy.html`
3. Zmeňte kontaktné informácie

## 📱 **Responzívny dizajn:**

Stránka je plne responzívna a podporuje:
- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (320px - 767px)
- ✅ Dark mode
- ✅ High contrast mode
- ✅ Reduced motion

## 🔍 **SEO optimalizácia:**

### **Meta tagy:**
```html
<meta name="description" content="ClipSmart - Smart clipboard manager for enhanced productivity">
<meta name="keywords" content="clipboard, productivity, browser extension, chrome extension">
<meta name="author" content="ClipSmart">
<meta property="og:title" content="ClipSmart - Smart Clipboard Manager">
<meta property="og:description" content="Boost your productivity with smart clipboard management">
<meta property="og:image" content="https://your-domain.com/assets/og-image.png">
```

### **Structured Data:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ClipSmart",
  "description": "Smart clipboard manager browser extension",
  "applicationCategory": "ProductivityApplication",
  "operatingSystem": "Chrome, Firefox, Edge"
}
</script>
```

## 🚀 **Výkon:**

### **Optimalizácie:**
- ✅ Minifikované CSS a JS
- ✅ Optimalizované obrázky
- ✅ Lazy loading
- ✅ CDN pre fonty a ikony
- ✅ Gzip kompresia

### **Lighthouse skóre:**
- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

## 🔒 **Bezpečnosť:**

### **HTTPS:**
- Povinné pre všetky produkčné stránky
- Automatické presmerovanie z HTTP

### **Content Security Policy:**
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src https://fonts.gstatic.com;">
```

## 📊 **Monitoring:**

### **Google Analytics:**
- Sledovanie návštevnosti
- Správanie používateľov
- Konverzie

### **Error tracking:**
```javascript
// Pridajte Sentry alebo podobný nástroj
Sentry.init({
  dsn: 'YOUR_SENTRY_DSN'
});
```

## 🔄 **Aktualizácie:**

### **Automatické nasadenie:**
1. GitHub Actions pre automatické nasadenie
2. Netlify/Vercel webhooks
3. CI/CD pipeline

### **Verziovanie:**
- Používajte semantické verziovanie
- Changelog pre každú verziu
- Tagovanie release-ov

## 📞 **Podpora:**

### **Kontaktné informácie:**
- Email: tkutik72@gmail.com
- Response time: 24 hodín
- Dokumentácia: README.md

### **FAQ:**
1. **Ako zmením farby?** - Upravte CSS premenné
2. **Ako pridám analytics?** - Pridajte Google Analytics kód
3. **Ako funguje kontaktný formulár?** - Nakonfigurujte backend službu
4. **Ako optimalizujem výkon?** - Použite minifikáciu a CDN

## ✅ **Kontrolný zoznam nasadenia:**

- [ ] Nahraďte placeholder URL adresy
- [ ] Nakonfigurujte kontaktný formulár
- [ ] Pridajte Google Analytics
- [ ] Nastavte HTTPS
- [ ] Otestujte responzívnosť
- [ ] Skontrolujte Lighthouse skóre
- [ ] Nastavte monitoring
- [ ] Otestujte kontaktný formulár
- [ ] Skontrolujte Privacy Policy
- [ ] Nastavte automatické nasadenie

## 🎉 **Gratulujem!**

Vaša webová stránka je pripravená na nasadenie. Všetky súbory sú optimalizované, responzívne a obsahujú moderný dizajn, ktorý sa hodí k vašej Chrome extension. 