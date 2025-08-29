# 🧪 Testovanie Real-Time Aktualizácie ClipSmart

## 📋 Prehľad Testovania

Tento súbor obsahuje kompletné testovacie kroky pre overenie real-time aktualizácie ClipSmart rozšírenia.

## 🎯 Cieľ Testovania

Overiť, že popup sa automaticky aktualizuje pri zmene dát v storage bez potreby refreshu.

## 🛠️ Príprava Testovania

### 1. Otvorte Developer Tools
- **Windows/Linux:** Stlačte `F12` alebo `Ctrl+Shift+I`
- **Mac:** Stlačte `Cmd+Option+I`
- Prejdite na **Console** tab

### 2. Otvorte ClipSmart Popup
- Kliknite na ClipSmart ikonu v prehliadači
- Popup by sa mal otvoriť
- Zapíšte si počiatočný počet položiek

## 🧪 Testovacie Scenáre

### Test 1: Základné Kopírovanie Textu
**Cieľ:** Overiť, že nové položky sa zobrazia okamžite

**Kroky:**
1. Vyberte text na tejto stránke
2. Stlačte `Ctrl+C`
3. Pozrite sa do popup-u

**Očakávaný výsledok:**
- ✅ Položka sa zobrazí okamžite
- ✅ Počet položiek sa zvýši
- ✅ V console sa zobrazí:
  ```
  📋 Clipboard items changed in storage, updating popup...
  ✅ Popup updated with new data
  ```

### Test 2: Kopírovanie z Inej Stránky
**Cieľ:** Overiť synchronizáciu medzi tabmi

**Kroky:**
1. Otvorte nový tab s ľubovoľnou stránkou
2. Vyberte text a stlačte `Ctrl+C`
3. Prejdite späť na ClipSmart popup

**Očakávaný výsledok:**
- ✅ Položka sa zobrazí automaticky
- ✅ Žiadne refresh nie je potrebný

### Test 3: Kopírovanie URL
**Cieľ:** Overiť detekciu typu obsahu

**Kroky:**
1. Skopírujte URL z adresného riadku (`Ctrl+L`, `Ctrl+C`)
2. Skontrolujte popup

**Očakávaný výsledok:**
- ✅ URL sa zobrazí s ikonou 🔗
- ✅ Typ položky je správne detekovaný

### Test 4: Kopírovanie Emailu
**Cieľ:** Overiť detekciu email adresy

**Kroky:**
1. Skopírujte email adresu (napr. `test@example.com`)
2. Skontrolujte popup

**Očakávaný výsledok:**
- ✅ Email sa zobrazí s ikonou ✉️
- ✅ Typ položky je správne detekovaný

### Test 5: Zmena Nastavení
**Cieľ:** Overiť aktualizáciu UI pri zmene nastavení

**Kroky:**
1. V popup-u prejdite na **Settings** tab
2. Zmeňte tému (Light/Dark/Auto)
3. Skontrolujte console

**Očakávaný výsledok:**
- ✅ Téma sa zmení okamžite
- ✅ V console sa zobrazí:
  ```
  ⚙️ Settings changed, updating UI...
  ```

### Test 6: Zmena Zoradenia
**Cieľ:** Overiť aktualizáciu zoradenia

**Kroky:**
1. V popup-u zmeňte zoradenie (Newest/Oldest/A-Z/Z-A)
2. Skontrolujte console

**Očakávaný výsledok:**
- ✅ Položky sa zoradia okamžite
- ✅ V console sa zobrazí:
  ```
  🔄 Sort order changed, updating UI...
  ```

### Test 7: Pripnutie Položky
**Cieľ:** Overiť aktualizáciu pri pripnutí položky

**Kroky:**
1. Kliknite na ⭐ ikonu pri položke
2. Skontrolujte console

**Očakávaný výsledok:**
- ✅ Položka sa pripne okamžite
- ✅ V console sa zobrazí:
  ```
  📋 Clipboard items changed in storage, updating popup...
  ```

### Test 8: Preklad Textu
**Cieľ:** Overiť aktualizáciu prekladov

**Kroky:**
1. Kliknite na 🌐 ikonu pri položke
2. Vyberte jazyk a preložte
3. Skontrolujte console

**Očakávaný výsledok:**
- ✅ Preklad sa zobrazí okamžite
- ✅ V console sa zobrazí:
  ```
  🌐 Translation count changed, updating UI...
  ```

### Test 9: Premium Status (ak máte Pro)
**Cieľ:** Overiť aktualizáciu Premium stavu

**Kroky:**
1. Ak máte Pro účet, skontrolujte console
2. Pozrite sa na Premium sekciu

**Očakávaný výsledok:**
- ✅ Premium funkcie sú dostupné
- ✅ V console sa zobrazí:
  ```
  💰 Pro status changed, updating UI...
  💎 Subscription info changed, updating UI...
  ```

### Test 10: Chyba Prekladu
**Cieľ:** Overiť správu chýb

**Kroky:**
1. Skúste preložiť prázdny text
2. Skontrolujte console pre chybové hlásenia

**Očakávaný výsledok:**
- ✅ Chyba sa zobrazí používateľovi
- ✅ V console sa zobrazí chybový log

## 🔍 Čo Hľadať v Console

### ✅ Úspešné Logy
```
📋 Clipboard items changed in storage, updating popup...
✅ Popup updated with new data
⚙️ Settings changed, updating UI...
🔄 Sort order changed, updating UI...
💰 Pro status changed, updating UI...
🌐 Translation count changed, updating UI...
🏷️ Tags changed, updating UI...
💎 Subscription info changed, updating UI...
🔑 ExtensionPay user data changed, updating UI...
```

### ❌ Chybové Logy
```
❌ Error loading data: [chyba]
❌ Translation error: [chyba]
❌ ExtensionPay failed: [chyba]
❌ Error saving data: [chyba]
```

## 📊 Hodnotenie Testovania

### Kritéria Úspechu
- ✅ Všetky položky sa zobrazia okamžite po Ctrl+C
- ✅ UI sa aktualizuje bez refreshu
- ✅ Console logy sú správne
- ✅ Žiadne chyby v console
- ✅ Všetky funkcie fungujú plynulo

### Ak Testy Zlyhajú
1. **Skontrolujte console** pre chybové hlásenia
2. **Overte storage listenery** v popup.js
3. **Skontrolujte background script** pre správne ukladanie
4. **Overte content script** pre správne zachytávanie Ctrl+C

## 🎯 Záver

Ak všetky testy prejdú úspešne, real-time aktualizácia je funkčná a rozšírenie by malo fungovať profesionálne bez potreby refreshov.

---

**Dátum testovania:** $(date)
**Verzia rozšírenia:** v1.0.6
**Tester:** $(whoami)

