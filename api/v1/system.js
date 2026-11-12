module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const totalMem = 64 * 1024 * 1024 * 1024;
    const usedMem = 24.5 * 1024 * 1024 * 1024;
    const freeMem = totalMem - usedMem;

    res.status(200).json({
        status: 'OK',
        cluster: 'Global Edge Mesh (Tier 1)',
        memory: {
            total: totalMem,
            free: freeMem,
            used: usedMem,
            usagePercent: '38.28'
        },
        cpu: {
            load1m: '0.24',
            load5m: '0.26',
            load15m: '0.21'
        },
        uptime: 99.99,
        timestamp: new Date().toISOString()
    });
};
