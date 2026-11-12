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

    const { botId, status, latency } = req.body || {};
    if (!botId || typeof botId !== 'string' || botId.length > 64) {
        return res.status(400).json({ error: 'Invalid botId' });
    }

    const authHeader = req.headers.authorization || '';
    const apiKey = authHeader.replace(/^Bearer\s+/i, '');

    return res.status(200).json({
        acknowledged: true,
        authenticated: apiKey ? apiKey.startsWith('mop_live_') : false,
        botId: botId,
        status: status || 'Healthy',
        latency: typeof latency === 'number' ? latency : 0.0,
        timestamp: new Date().toISOString(),
        message: 'Heartbeat received'
    });
};
