module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { botId, runtime, consent_given, consent_timestamp } = req.body || {};
    if (!botId || typeof botId !== 'string' || botId.trim().length === 0 || botId.length > 64) {
        return res.status(400).json({ error: 'Valid Bot Name / ID is required.' });
    }
    if (consent_given !== true) {
        return res.status(400).json({ error: 'Explicit TCPA/GDPR consent is required to register.' });
    }

    res.status(200).json({
        ok: true,
        consent_recorded: true,
        botId: botId.trim(),
        runtime: runtime || 'Node.js 22 LTS',
        consent_timestamp: consent_timestamp || new Date().toISOString()
    });
};
