const express = require('express');
const cors = require('cors');
const os = require('os');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Security Headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Lightweight IP Rate Limiter (DDoS & Spam Protection with Loopback Exemption for Local Agents)
function isLoopbackIp(ip) {
    if (!ip) return false;
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.startsWith('127.');
}

function createRateLimiter({ windowMs = 60000, max = 60, skipLoopback = true, message = 'Too many requests, please try again later.' }) {
    const hits = new Map();
    setInterval(() => {
        const now = Date.now();
        for (const [ip, record] of hits.entries()) {
            if (now > record.resetAt) hits.delete(ip);
        }
    }, windowMs).unref();

    return (req, res, next) => {
        const rawIp = req.ip || req.socket?.remoteAddress || 'unknown';
        const remoteAddr = req.socket?.remoteAddress || '';
        // Exclude localhost / local agents (e.g. agent.py running on the same server)
        if (skipLoopback && (isLoopbackIp(rawIp) || isLoopbackIp(remoteAddr)) && !req.headers['cf-connecting-ip']) {
            return next();
        }
        const now = Date.now();
        let record = hits.get(rawIp);
        if (!record || now > record.resetAt) {
            record = { count: 0, resetAt: now + windowMs };
            hits.set(rawIp, record);
        }
        record.count++;
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - record.count)));
        if (record.count > max) {
            const retryAfter = Math.ceil((record.resetAt - now) / 1000);
            res.setHeader('Retry-After', String(retryAfter));
            return res.status(429).json({ error: message, retryAfter });
        }
        next();
    };
}

// Generous limits for multi-worker telemetry + localhost exemption so agent.py is never throttled
const systemLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 180, skipLoopback: true });
const heartbeatLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 300, skipLoopback: true });
const registerLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, skipLoopback: true, message: 'Rate limit exceeded for registration.' });

// Strict Frontend Asset Whitelist + Optimal Cache-Control (Prevents source code exposure of server.js/agent.py)
const ALLOWED_STATIC = {
    '/index.html': { file: 'index.html', type: 'text/html; charset=utf-8', cache: 'no-cache' },
    '/style.css': { file: 'style.css', type: 'text/css; charset=utf-8', cache: 'public, max-age=3600, stale-while-revalidate=86400' },
    '/app.js': { file: 'app.js', type: 'application/javascript; charset=utf-8', cache: 'public, max-age=3600, stale-while-revalidate=86400' },
    '/favicon.ico': { file: 'favicon.ico', type: 'image/x-icon', cache: 'public, max-age=604800, stale-while-revalidate=2592000' },
    '/favicon.svg': { file: 'favicon.svg', type: 'image/svg+xml', cache: 'public, max-age=604800, stale-while-revalidate=2592000' },
    '/favicon.png': { file: 'favicon.png', type: 'image/png', cache: 'public, max-age=604800, stale-while-revalidate=2592000' },
    '/manifest.json': { file: 'manifest.json', type: 'application/manifest+json', cache: 'public, max-age=86400' },
    '/robots.txt': { file: 'robots.txt', type: 'text/plain; charset=utf-8', cache: 'public, max-age=86400' }
};

app.get(Object.keys(ALLOWED_STATIC).concat(['/']), (req, res) => {
    const key = req.path === '/' ? '/index.html' : req.path;
    const asset = ALLOWED_STATIC[key];
    if (!asset) return res.status(404).end();
    const fullPath = path.join(__dirname, asset.file);
    if (!fs.existsSync(fullPath)) return res.status(404).end();
    res.setHeader('Cache-Control', asset.cache);
    res.type(asset.type);
    res.sendFile(fullPath);
});

// System Metrics Endpoint
app.get('/api/v1/system', systemLimiter, (req, res) => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuLoad = os.loadavg();
    const uptime = os.uptime();

    res.setHeader('Cache-Control', 'no-store');
    res.json({
        status: 'OK',
        memory: {
            total: totalMem,
            free: freeMem,
            used: usedMem,
            usagePercent: ((usedMem / totalMem) * 100).toFixed(2)
        },
        cpu: {
            load1m: cpuLoad[0].toFixed(2),
            load5m: cpuLoad[1].toFixed(2),
            load15m: cpuLoad[2].toFixed(2)
        },
        uptime: uptime,
        timestamp: new Date().toISOString()
    });
});

// Heartbeat Endpoint
app.post('/api/v1/heartbeat', heartbeatLimiter, (req, res) => {
    const { botId, status, latency } = req.body || {};
    if (!botId || typeof botId !== 'string' || botId.length > 64) {
        return res.status(400).json({ error: 'Invalid botId' });
    }
    console.log(`[HEARTBEAT] Bot: ${botId} | Status: ${status} | Latency: ${latency}ms`);
    res.json({
        acknowledged: true,
        timestamp: new Date().toISOString(),
        message: 'Heartbeat received'
    });
});

// Registration Endpoint with TCPA / GDPR Express Consent Persistence
const CONSENT_LOG_FILE = path.join(__dirname, 'consent_logs.json');
app.post('/api/v1/register', registerLimiter, (req, res) => {
    const { botId, runtime, consent_given, consent_timestamp } = req.body || {};
    if (!botId || typeof botId !== 'string' || botId.trim().length === 0 || botId.length > 64) {
        return res.status(400).json({ error: 'Valid Bot Name / ID is required.' });
    }
    if (consent_given !== true) {
        return res.status(400).json({ error: 'Explicit TCPA/GDPR consent is required to register.' });
    }
    const record = {
        botId: botId.trim(),
        runtime: String(runtime || 'Node.js 22 LTS').slice(0, 40),
        consent_given: true,
        consent_timestamp: consent_timestamp || new Date().toISOString(),
        ip_hash: Buffer.from(req.ip || 'unknown').toString('base64').slice(0, 16)
    };
    try {
        let logs = [];
        if (fs.existsSync(CONSENT_LOG_FILE)) {
            logs = JSON.parse(fs.readFileSync(CONSENT_LOG_FILE, 'utf8') || '[]');
        }
        logs.push(record);
        if (logs.length > 1000) logs = logs.slice(-1000);
        fs.writeFileSync(CONSENT_LOG_FILE, JSON.stringify(logs, null, 2), { mode: 0o600 });
    } catch (e) {
        console.error('[CONSENT_LOG_ERROR]', e.message);
    }
    res.json({ ok: true, consent_recorded: true, consent_timestamp: record.consent_timestamp });
});

// Resilience against unhandled errors & crash prevention
process.on('unhandledRejection', (reason, promise) => {
    console.error('[MoniOpen UnhandledRejection]:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[MoniOpen UncaughtException]:', err);
});

app.listen(PORT, () => {
    console.log(`MoniOpen Production Suite V4.0 running on port ${PORT}`);
});
