const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// System Metrics Endpoint
app.get('/api/v1/system', (req, res) => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuLoad = os.loadavg();
    const uptime = os.uptime();

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
app.post('/api/v1/heartbeat', (req, res) => {
    const { botId, status, latency } = req.body;
    console.log(`[HEARTBEAT] Bot: ${botId} | Status: ${status} | Latency: ${latency}ms`);
    res.json({
        acknowledged: true,
        timestamp: new Date().toISOString(),
        message: 'Heartbeat received'
    });
});

app.listen(PORT, () => {
    console.log(`MoniOpen Production Suite V4.0 running on port ${PORT}`);
});
