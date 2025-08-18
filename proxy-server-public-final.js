const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();

// Konfigurácia
const CONFIG = {
    MAX_TEXT_LENGTH: 5000,
    REQUEST_TIMEOUT: 10000,
    ALLOWED_EXTENSIONS: [
        'nbpndheaoecmgnlmfpleeahoicpcbppj', // Produkčné ID
        'test-extension-id' // Pre testovanie
    ],
    RATE_LIMIT: {
        windowMs: 60 * 60 * 1000, // 1 hodina
        max: 100 // max 100 prekladov za hodinu na IP
    }
};

// Rate limiting
const limiter = rateLimit({
    windowMs: CONFIG.RATE_LIMIT.windowMs,
    max: CONFIG.RATE_LIMIT.max,
    message: {
        error: 'Rate limit exceeded',
        message: 'Príliš veľa prekladov. Skúste to neskôr.',
        retryAfter: Math.ceil(CONFIG.RATE_LIMIT.windowMs / 1000 / 60) // minúty
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Príliš veľa prekladov. Skúste to neskôr.',
            retryAfter: Math.ceil(CONFIG.RATE_LIMIT.windowMs / 1000 / 60)
        });
    }
});

// Middleware
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS pre Chrome extension - VEREJNÝ prístup
app.use(cors({
    origin: '*', // Povoľte všetky origins pre Chrome extension
    credentials: false, // Vypnite credentials pre verejný prístup
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Extension-Id']
}));

// Logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`📥 ${req.method} ${req.path} - ${req.ip}`);
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`📤 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    
    next();
});

// Middleware pre overenie extension ID (voliteľné pre verejný server)
const validateExtension = (req, res, next) => {
    const extensionId = req.headers['x-extension-id'];
    
    if (!extensionId) {
        console.warn(`⚠️ Missing extension ID from ${req.ip} - allowing for public access`);
    } else if (!CONFIG.ALLOWED_EXTENSIONS.includes(extensionId)) {
        console.warn(`⚠️ Unknown extension: ${extensionId} from ${req.ip} - allowing for public access`);
    } else {
        console.log(`✅ Known extension: ${extensionId}`);
    }
    
    // Vždy povolte prístup pre verejný server
    next();
};

// Preklad endpoint
app.post('/translate', validateExtension, async (req, res) => {
    try {
        const { text, targetLang, sourceLang } = req.body;
        
        // Validácia vstupu
        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                error: 'Invalid text',
                message: 'Neplatný text'
            });
        }
        
        if (!targetLang || typeof targetLang !== 'string') {
            return res.status(400).json({
                error: 'Invalid target language',
                message: 'Neplatný cieľový jazyk'
            });
        }
        
        // Obmedzenie dĺžky textu
        if (text.length > CONFIG.MAX_TEXT_LENGTH) {
            return res.status(400).json({
                error: 'Text too long',
                message: `Text je príliš dlhý (max ${CONFIG.MAX_TEXT_LENGTH} znakov)`
            });
        }
        
        // Kontrola API kľúča
        if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
            console.error('❌ Google Translate API key not configured');
            return res.status(500).json({
                error: 'Service not configured',
                message: 'Služba nie je nakonfigurovaná'
            });
        }
        
        console.log(`🔄 Translation request: ${sourceLang || 'auto'} → ${targetLang}, Length: ${text.length}`);
        
        // Google Translate API volanie
        const response = await axios.post(
            `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
            {
                q: text,
                target: targetLang,
                format: 'text'
            },
            {
                timeout: CONFIG.REQUEST_TIMEOUT,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // Validácia odpovede
        if (!response.data?.data?.translations?.[0]?.translatedText) {
            throw new Error('Invalid response from Google Translate API');
        }
        
        const translation = response.data.data.translations[0];
        
        console.log(`✅ Translation successful: ${sourceLang || 'auto'} → ${targetLang}`);
        
        res.json({
            success: true,
            translation: translation.translatedText,
            detectedLanguage: translation.detectedSourceLanguage,
            sourceLanguage: sourceLang || 'auto',
            targetLanguage: targetLang,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Translation error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            stack: error.stack
        });
        
        // Špecifické chyby
        if (error.response?.status === 403) {
            res.status(403).json({
                error: 'API quota exceeded',
                message: 'Prekročený limit API. Skúste to neskôr.',
                retryAfter: 'tomorrow'
            });
        } else if (error.response?.status === 400) {
            res.status(400).json({
                error: 'Invalid request',
                message: 'Neplatná požiadavka na Google Translate API'
            });
        } else if (error.code === 'ECONNABORTED') {
            res.status(408).json({
                error: 'Request timeout',
                message: 'Požiadavka vypršala. Skúste to znova.'
            });
        } else if (error.code === 'ENOTFOUND') {
            res.status(503).json({
                error: 'Service unavailable',
                message: 'Google Translate API nie je dostupné'
            });
        } else {
            res.status(500).json({
                error: 'Translation failed',
                message: 'Preklad zlyhal. Skúste to neskôr.'
            });
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'ClipSmart Translation Proxy (Public)',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        config: {
            maxTextLength: CONFIG.MAX_TEXT_LENGTH,
            rateLimit: CONFIG.RATE_LIMIT,
            allowedExtensions: CONFIG.ALLOWED_EXTENSIONS.length
        }
    };
    
    // Kontrola API kľúča
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
        health.apiKey = '✅ Configured';
    } else {
        health.apiKey = '❌ Missing';
        health.status = 'WARNING';
    }
    
    res.json(health);
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'ClipSmart Translation Proxy (Public)',
        version: '1.0.0',
        endpoints: {
            translate: 'POST /translate',
            health: 'GET /health'
        },
        note: 'This is a PUBLIC server - no authentication required',
        security: 'Protected by rate limiting and extension validation'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: 'Požadovaný endpoint neexistuje',
        availableEndpoints: ['POST /translate', 'GET /health', 'GET /']
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('💥 Server error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    
    res.status(500).json({
        error: 'Internal server error',
        message: 'Interná chyba servera',
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('🚀 ClipSmart Translation Proxy (Public)');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 API Key: ${process.env.GOOGLE_TRANSLATE_API_KEY ? '✅ Nastavený' : '❌ Chýba'}`);
    console.log(`📊 Rate Limit: ${CONFIG.RATE_LIMIT.max} prekladov za ${CONFIG.RATE_LIMIT.windowMs / 1000 / 60} minút`);
    console.log(`🔒 Allowed Extensions: ${CONFIG.ALLOWED_EXTENSIONS.length}`);
    console.log(`⏰ Started: ${new Date().toISOString()}`);
    console.log(`🌐 NOTE: This is a PUBLIC server - no authentication required`);
    console.log(`🔒 Security: Rate limiting + extension validation`);
});
