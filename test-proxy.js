#!/usr/bin/env node

/**
 * 🧪 ClipSmart Translation Proxy - Test Script
 * Tento script testuje váš proxy server pred deploymentom
 */

const axios = require('axios');

// Konfigurácia
const CONFIG = {
    // URL vášho proxy servera (zmeňte na skutočnú)
    PROXY_URL: 'http://localhost:3000',
    
    // Testovacie dáta
    TEST_CASES: [
        {
            name: 'Slovenský preklad',
            text: 'Hello world',
            targetLang: 'sk',
            expected: 'Ahoj svet'
        },
        {
            name: 'Nemecký preklad',
            text: 'Good morning',
            targetLang: 'de',
            expected: 'Guten Morgen'
        },
        {
            name: 'Francúzsky preklad',
            text: 'Thank you',
            targetLang: 'fr',
            expected: 'Merci'
        }
    ],
    
    // Extension ID pre testovanie
    EXTENSION_ID: 'test-extension-id'
};

// Farba pre výstup
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Funkcia pre výpis
function print(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test health endpoint
async function testHealth() {
    print('\n🔍 Testujem health endpoint...', 'blue');
    
    try {
        const response = await axios.get(`${CONFIG.PROXY_URL}/health`);
        
        if (response.status === 200 && response.data.status === 'OK') {
            print('✅ Health check úspešný', 'green');
            print(`   Status: ${response.data.status}`, 'cyan');
            print(`   Service: ${response.data.service}`, 'cyan');
            print(`   Version: ${response.data.version}`, 'cyan');
            print(`   Environment: ${response.data.environment}`, 'cyan');
            
            if (response.data.apiKey === '✅ Configured') {
                print('   API Key: ✅ Nastavený', 'green');
            } else {
                print('   API Key: ❌ Chýba', 'red');
                print('   ⚠️  Nastavte GOOGLE_TRANSLATE_API_KEY environment variable', 'yellow');
            }
            
            return true;
        } else {
            print('❌ Health check zlyhal', 'red');
            print(`   Status: ${response.status}`, 'red');
            print(`   Data: ${JSON.stringify(response.data)}`, 'red');
            return false;
        }
    } catch (error) {
        print('❌ Health check error', 'red');
        print(`   Error: ${error.message}`, 'red');
        return false;
    }
}

// Test root endpoint
async function testRoot() {
    print('\n🔍 Testujem root endpoint...', 'blue');
    
    try {
        const response = await axios.get(`${CONFIG.PROXY_URL}/`);
        
        if (response.status === 200) {
            print('✅ Root endpoint úspešný', 'green');
            print(`   Service: ${response.data.service}`, 'cyan');
            print(`   Version: ${response.data.version}`, 'cyan');
            print(`   Endpoints: ${response.data.endpoints.translate}`, 'cyan');
            return true;
        } else {
            print('❌ Root endpoint zlyhal', 'red');
            return false;
        }
    } catch (error) {
        print('❌ Root endpoint error', 'red');
        print(`   Error: ${error.message}`, 'red');
        return false;
    }
}

// Test preklad endpoint
async function testTranslation() {
    print('\n🔍 Testujem preklad endpoint...', 'blue');
    
    let successCount = 0;
    let totalCount = CONFIG.TEST_CASES.length;
    
    for (const testCase of CONFIG.TEST_CASES) {
        print(`\n   Test: ${testCase.name}`, 'cyan');
        print(`   Text: "${testCase.text}" → ${testCase.targetLang}`, 'cyan');
        
        try {
            const response = await axios.post(`${CONFIG.PROXY_URL}/translate`, {
                text: testCase.text,
                targetLang: testCase.targetLang
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-Id': CONFIG.EXTENSION_ID
                },
                timeout: 15000
            });
            
            if (response.status === 200 && response.data.success) {
                print(`   ✅ Úspešný preklad`, 'green');
                print(`   Výsledok: "${response.data.translation}"`, 'green');
                print(`   Detekovaný jazyk: ${response.data.detectedLanguage}`, 'cyan');
                successCount++;
            } else {
                print(`   ❌ Preklad zlyhal`, 'red');
                print(`   Status: ${response.status}`, 'red');
                print(`   Data: ${JSON.stringify(response.data)}`, 'red');
            }
        } catch (error) {
            if (error.response) {
                print(`   ❌ HTTP Error: ${error.response.status}`, 'red');
                print(`   Message: ${error.response.data?.message || error.message}`, 'red');
            } else if (error.code === 'ECONNABORTED') {
                print(`   ❌ Timeout Error`, 'red');
            } else {
                print(`   ❌ Network Error: ${error.message}`, 'red');
            }
        }
        
        // Pauza medzi requestmi
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    print(`\n📊 Výsledky testovania:`, 'blue');
    print(`   Úspešné: ${successCount}/${totalCount}`, successCount === totalCount ? 'green' : 'yellow');
    
    return successCount === totalCount;
}

// Test chybové stavy
async function testErrorCases() {
    print('\n🔍 Testujem chybové stavy...', 'blue');
    
    const errorTests = [
        {
            name: 'Chýbajúce extension ID',
            data: { text: 'Hello', targetLang: 'sk' },
            headers: {},
            expectedStatus: 401
        },
        {
            name: 'Neplatné extension ID',
            data: { text: 'Hello', targetLang: 'sk' },
            headers: { 'X-Extension-Id': 'invalid-id' },
            expectedStatus: 403
        },
        {
            name: 'Chýbajúci text',
            data: { targetLang: 'sk' },
            headers: { 'X-Extension-Id': CONFIG.EXTENSION_ID },
            expectedStatus: 400
        },
        {
            name: 'Chýbajúci cieľový jazyk',
            data: { text: 'Hello' },
            headers: { 'X-Extension-Id': CONFIG.EXTENSION_ID },
            expectedStatus: 400
        },
        {
            name: 'Príliš dlhý text',
            data: { 
                text: 'A'.repeat(6000), 
                targetLang: 'sk' 
            },
            headers: { 'X-Extension-Id': CONFIG.EXTENSION_ID },
            expectedStatus: 400
        }
    ];
    
    let successCount = 0;
    let totalCount = errorTests.length;
    
    for (const testCase of errorTests) {
        print(`\n   Test: ${testCase.name}`, 'cyan');
        
        try {
            const response = await axios.post(`${CONFIG.PROXY_URL}/translate`, testCase.data, {
                headers: {
                    'Content-Type': 'application/json',
                    ...testCase.headers
                },
                timeout: 10000
            });
            
            if (response.status === testCase.expectedStatus) {
                print(`   ✅ Očakávaná chyba: ${response.status}`, 'green');
                print(`   Message: ${response.data.message}`, 'cyan');
                successCount++;
            } else {
                print(`   ❌ Neočakávaný status: ${response.status} (očakávaný: ${testCase.expectedStatus})`, 'red');
            }
        } catch (error) {
            if (error.response && error.response.status === testCase.expectedStatus) {
                print(`   ✅ Očakávaná chyba: ${error.response.status}`, 'green');
                print(`   Message: ${error.response.data?.message || 'No message'}`, 'cyan');
                successCount++;
            } else {
                print(`   ❌ Neočakávaná chyba: ${error.response?.status || 'Network error'}`, 'red');
            }
        }
    }
    
    print(`\n📊 Výsledky testovania chýb:`, 'blue');
    print(`   Úspešné: ${successCount}/${totalCount}`, successCount === totalCount ? 'green' : 'yellow');
    
    return successCount === totalCount;
}

// Hlavná funkcia
async function main() {
    print('🧪 ClipSmart Translation Proxy - Test Script', 'magenta');
    print('==================================================', 'magenta');
    
    print(`\n📍 Testujem proxy server na: ${CONFIG.PROXY_URL}`, 'blue');
    print(`🔑 Extension ID: ${CONFIG.EXTENSION_ID}`, 'blue');
    
    try {
        // Test health endpoint
        const healthOk = await testHealth();
        if (!healthOk) {
            print('\n❌ Health check zlyhal - server pravdepodobne nebeží', 'red');
            print('   Spustite server: npm start', 'yellow');
            process.exit(1);
        }
        
        // Test root endpoint
        await testRoot();
        
        // Test preklad endpoint
        const translationOk = await testTranslation();
        
        // Test chybové stavy
        const errorOk = await testErrorCases();
        
        // Celkový výsledok
        print('\n🎯 Celkový výsledok testovania:', 'magenta');
        if (translationOk && errorOk) {
            print('✅ Všetky testy úspešné! Proxy server je pripravený na deployment.', 'green');
        } else {
            print('⚠️  Niektoré testy zlyhali. Skontrolujte konfiguráciu.', 'yellow');
        }
        
        print('\n📋 Ďalšie kroky:', 'blue');
        print('1. Ak sú všetky testy OK, môžete deployovať na Vercel', 'cyan');
        print('2. Spustite: ./deploy.sh (Linux/Mac) alebo deploy.bat (Windows)', 'cyan');
        print('3. Nastavte GOOGLE_TRANSLATE_API_KEY environment variable', 'cyan');
        
    } catch (error) {
        print('\n💥 Kritická chyba počas testovania:', 'red');
        print(`   Error: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Spustenie testovania
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testHealth, testTranslation, testErrorCases };
