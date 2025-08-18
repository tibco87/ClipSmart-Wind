const axios = require('axios');

// Konfigurácia
const CONFIG = {
    BASE_URL: 'https://clipsmart-translation-proxy-4ved0le7k-tibco87s-projects.vercel.app',
    USERNAME: '',
    PASSWORD: 'clipsmart2025',
    EXTENSION_ID: 'nbpndheaoecmgnlmfpleeahoicpcbppj'
};

// Basic Auth credentials
const credentials = Buffer.from(`${CONFIG.USERNAME}:${CONFIG.PASSWORD}`).toString('base64');

// Axios instance s autentifikáciou
const api = axios.create({
    baseURL: CONFIG.BASE_URL,
    headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'X-Extension-Id': CONFIG.EXTENSION_ID
    },
    timeout: 10000
});

// Test funkcie
async function testHealth() {
    try {
        console.log('🏥 Testovanie health endpoint...');
        const response = await api.get('/health');
        console.log('✅ Health OK:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Health test zlyhal:', error.response?.status, error.response?.data);
        return false;
    }
}

async function testTranslation() {
    try {
        console.log('🔄 Testovanie prekladu...');
        const response = await api.post('/translate', {
            text: 'Hello world',
            targetLang: 'sk'
        });
        console.log('✅ Preklad OK:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Preklad test zlyhal:', error.response?.status, error.response?.data);
        return false;
    }
}

async function testUnauthorized() {
    try {
        console.log('🚫 Testovanie neautorizovaného prístupu...');
        const response = await axios.get(`${CONFIG.BASE_URL}/health`);
        console.log('❌ Neautorizovaný prístup by mal zlyhať, ale prešiel:', response.status);
        return false;
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Neautorizovaný prístup správne zlyhal (401)');
            return true;
        } else {
            console.error('❌ Neočakávaná chyba:', error.response?.status, error.response?.data);
            return false;
        }
    }
}

async function testRateLimit() {
    try {
        console.log('⏱️ Testovanie rate limiting...');
        const promises = [];
        
        // 5 requestov naraz
        for (let i = 0; i < 5; i++) {
            promises.push(api.post('/translate', {
                text: `Test text ${i}`,
                targetLang: 'sk'
            }));
        }
        
        const responses = await Promise.all(promises);
        console.log('✅ Rate limit test OK:', responses.length, 'requestov prešlo');
        return true;
    } catch (error) {
        if (error.response?.status === 429) {
            console.log('✅ Rate limit správne funguje (429)');
            return true;
        } else {
            console.error('❌ Neočakávaná chyba pri rate limit teste:', error.response?.status, error.response?.data);
            return false;
        }
    }
}

// Hlavná funkcia
async function runTests() {
    console.log('🧪 Spúšťam testy autentifikovaného proxy servera...');
    console.log('==================================================');
    console.log(`🔗 URL: ${CONFIG.BASE_URL}`);
    console.log(`🔑 Heslo: ${CONFIG.PASSWORD}`);
    console.log(`🆔 Extension ID: ${CONFIG.EXTENSION_ID}`);
    console.log('');
    
    // Aktualizujte BASE_URL pred spustením
    if (CONFIG.BASE_URL.includes('your-proxy')) {
        console.log('⚠️  Najprv aktualizujte BASE_URL v CONFIG objekte!');
        console.log('   Nahraďte "your-proxy.vercel.app" skutočnou URL');
        return;
    }
    
    const results = {
        health: await testHealth(),
        translation: await testTranslation(),
        unauthorized: await testUnauthorized(),
        rateLimit: await testRateLimit()
    };
    
    console.log('');
    console.log('📊 Výsledky testov:');
    console.log('==================');
    console.log(`🏥 Health: ${results.health ? '✅' : '❌'}`);
    console.log(`🔄 Preklad: ${results.translation ? '✅' : '❌'}`);
    console.log(`🚫 Neautorizovaný: ${results.unauthorized ? '✅' : '❌'}`);
    console.log(`⏱️ Rate Limit: ${results.rateLimit ? '✅' : '❌'}`);
    
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    console.log('');
    console.log(`🎯 Celkový výsledok: ${passed}/${total} testov prešlo`);
    
    if (passed === total) {
        console.log('🎉 Všetky testy prešli! Proxy server s autentifikáciou funguje správne.');
    } else {
        console.log('⚠️  Niektoré testy zlyhali. Skontrolujte konfiguráciu.');
    }
}

// Spustenie testov
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, testHealth, testTranslation, testUnauthorized, testRateLimit };
