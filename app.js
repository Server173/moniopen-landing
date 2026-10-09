document.addEventListener('DOMContentLoaded', () => {
    // 1. NAVIGATION & LAYOUT
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const sections = document.querySelectorAll('.view-section');
    const titleDisplay = document.getElementById('currentViewName');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            const target = item.getAttribute('data-target');
            sections.forEach(s => {
                s.classList.remove('active');
                if(s.id === target) s.classList.add('active');
            });
            
            if(titleDisplay) {
                titleDisplay.textContent = item.textContent.trim();
            }
            
            // Resize canvas if switching to dashboard
            if (target === 'dashboard') {
                setTimeout(resizeCanvas, 50);
            }
        });
    });

    // 2. BETTER STACK: UPTIME BARS
    const uptimeContainer = document.getElementById('uptimeBars');
    if (uptimeContainer) {
        for (let i = 0; i < 30; i++) {
            const bar = document.createElement('div');
            bar.className = 'uptime-bar';
            
            // Simulate 99.99% uptime with one incident 5 days ago
            if (i === 24) {
                bar.classList.add('h-err');
                bar.title = 'Incident: HTTP 429 Rate Limit Exceeded';
            } else if (i === 23 || i === 25) {
                bar.classList.add('h-80');
                bar.title = 'Degraded Performance';
            } else {
                bar.classList.add('h-100');
                bar.title = 'Operational';
            }
            uptimeContainer.appendChild(bar);
        }
    }

    // 3. TELEMETRY: ECG CANVAS
    const canvas = document.getElementById('ecgCanvas');
    let ctx = null;
    let historySize = 120;
    let dataPoints = new Array(historySize).fill(0);
    
    if (canvas) {
        ctx = canvas.getContext('2d');
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        updateECG();
    }

    function resizeCanvas() {
        if (!canvas) return;
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth * window.devicePixelRatio;
        canvas.height = parent.clientHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        dataPoints.fill(canvas.height / window.devicePixelRatio / 2);
    }

    function drawECG() {
        if (!canvas || !ctx) return;
        const w = canvas.width / window.devicePixelRatio;
        const h = canvas.height / window.devicePixelRatio;
        ctx.clearRect(0, 0, w, h);
        
        ctx.beginPath();
        ctx.strokeStyle = 'var(--accent-ok)';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'var(--accent-ok)';
        ctx.shadowBlur = 8;
        
        const sliceWidth = w / (historySize - 1);
        let x = 0;
        
        for (let i = 0; i < historySize; i++) {
            const y = dataPoints[i];
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
    }

    function updateECG() {
        if (!canvas) return;
        const h = canvas.height / window.devicePixelRatio;
        for(let i=0; i < historySize - 1; i++) {
            dataPoints[i] = dataPoints[i+1];
        }
        
        const baseLatency = h / 2;
        const isPulse = Math.random() > 0.95;
        let newValue = baseLatency;
        
        if (isPulse) {
            newValue = baseLatency - (Math.random() * 40 + 20);
            setTimeout(() => { dataPoints[historySize-2] = baseLatency + (Math.random() * 20); }, 50);
        } else {
            newValue = baseLatency + (Math.random() * 4 - 2);
        }
        
        dataPoints[historySize - 1] = newValue;
        
        const avgDisplay = document.getElementById('avgLatency');
        if(avgDisplay) avgDisplay.textContent = Math.floor(Math.random() * 5 + 10) + ' ms';

        drawECG();
        requestAnimationFrame(updateECG);
    }

    // 4. FLEET CONTROL & METRICS
    const AUTHORIZED_BOTS = ['roblox-tracker', 'bot-discord', 'errorcito-viales'];
    
    function purgeBotstickers() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.toLowerCase().includes('botstickers')) {
                localStorage.removeItem(key);
            }
        }
        let state = [
            { id: 'roblox-tracker', status: 'online', latency: 45, type: 'Go/Node' },
            { id: 'botstickers-beta', status: 'error', latency: 999, type: 'Node' },
            { id: 'bot-discord', status: 'online', latency: 60, type: 'Python' },
            { id: 'errorcito-viales', status: 'online', latency: 200, type: 'Python' }
        ];
        return state.filter(bot => AUTHORIZED_BOTS.includes(bot.id));
    }

    function renderFleet(bots) {
        const grid = document.getElementById('fleetGrid');
        if(!grid) return;
        grid.innerHTML = '';
        bots.forEach(bot => {
            const card = document.createElement('div');
            card.className = 'uptime-card'; // Reuse style
            card.style.padding = '24px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '12px';
            card.innerHTML = `
                <div class="flex-between">
                    <span style="font-family: var(--font-mono); font-size: 14px; font-weight: 500;">${bot.id}</span>
                    <span class="label" style="color: ${bot.status === 'online' ? 'var(--accent-ok)' : 'var(--accent-error)'}; display: flex; align-items: center; gap: 6px;">
                        <span style="width: 6px; height: 6px; background: currentColor; border-radius: 50%; display: inline-block;"></span>
                        ${bot.status.toUpperCase()}
                    </span>
                </div>
                <div style="font-size: 28px; font-weight: 500; font-family: var(--font-mono);">${bot.latency} ms</div>
                <div class="label">Runtime: ${bot.type}</div>
            `;
            grid.appendChild(card);
        });
    }

    renderFleet(purgeBotstickers());

    async function fetchSystemMetrics() {
        const grid = document.getElementById('systemMetricsContainer');
        if(!grid) return;
        try {
            const res = await fetch('/api/v1/system');
            if(!res.ok) throw new Error('API Error');
            const data = await res.json();
            renderMetrics(data.metrics, grid);
        } catch (e) {
            console.warn("Using simulated telemetry fallback (Vercel deployment detected).");
            renderMetrics({
                memory: { free: 4294967296, total: 8589934592, usedPercentage: 50.00 },
                cpuLoad: [0.12, 0.08, 0.05],
                uptime: 86400 * 3.5
            }, grid);
        }
    }

    function renderMetrics(metrics, grid) {
        const memGB = (metrics.memory.free / 1024 / 1024 / 1024).toFixed(1);
        const totalMemGB = (metrics.memory.total / 1024 / 1024 / 1024).toFixed(1);
        grid.innerHTML = `
            <div>
                <div class="flex-between" style="margin-bottom: 4px;">
                    <span style="font-size: 13px; color: var(--text-secondary);">Memory Usage</span>
                    <span style="font-family: var(--font-mono); font-size: 13px;">${metrics.memory.usedPercentage}%</span>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${metrics.memory.usedPercentage}%; height: 100%; background: var(--accent-brand);"></div>
                </div>
                <div class="label" style="margin-top: 6px; text-transform: none;">${memGB}GB / ${totalMemGB}GB Free</div>
            </div>
            
            <div style="margin-top: 12px;">
                <div class="flex-between" style="margin-bottom: 4px;">
                    <span style="font-size: 13px; color: var(--text-secondary);">Load Average (1m, 5m, 15m)</span>
                </div>
                <div style="font-family: var(--font-mono); font-size: 16px; color: #fff;">
                    ${metrics.cpuLoad.map(l => l.toFixed(2)).join('  ')}
                </div>
            </div>
            
            <div style="margin-top: 12px;">
                <div class="flex-between" style="margin-bottom: 4px;">
                    <span style="font-size: 13px; color: var(--text-secondary);">Server Uptime</span>
                </div>
                <div style="font-family: var(--font-mono); font-size: 16px; color: #fff;">
                    ${(metrics.uptime / 3600).toFixed(1)} hours
                </div>
            </div>
        `;
    }

    fetchSystemMetrics();
    setInterval(fetchSystemMetrics, 10000);

    // 5. RAILWAY: LIVE TERMINAL
    const cliInput = document.getElementById('cliInput');
    const cliLogs = document.getElementById('cliLogs');

    function getTimestamp() {
        const now = new Date();
        return now.toTimeString().split(' ')[0];
    }

    function appendLog(msg, type = '') {
        const div = document.createElement('div');
        let prefix = `<span class="log-time">${getTimestamp()}</span> `;
        let colorClass = '';
        
        if(type === 'info') prefix += `<span class="log-info">[INFO]</span> `;
        if(type === 'success') prefix += `<span class="log-success">[OK]</span> `;
        if(type === 'error') prefix += `<span class="log-error">[ERR]</span> `;
        if(type === 'warn') prefix += `<span class="log-warn">[WARN]</span> `;
        
        div.innerHTML = prefix + msg;
        cliLogs.appendChild(div);
        cliLogs.scrollTop = cliLogs.scrollHeight;
    }

    if (cliInput) {
        cliInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = cliInput.value.trim();
                if(!val) return;
                
                const div = document.createElement('div');
                div.innerHTML = `<span class="log-time">${getTimestamp()}</span> <span style="color:var(--text-primary);">❯ ${val}</span>`;
                cliLogs.appendChild(div);
                
                cliInput.value = '';
                cliLogs.scrollTop = cliLogs.scrollHeight;
                
                const cmd = val.toLowerCase().split(' ')[0];
                setTimeout(() => {
                    switch(cmd) {
                        case 'help': appendLog('Commands: help, status, ping, clear', 'info'); break;
                        case 'status': appendLog('API Gateway running. All systems operational.', 'success'); break;
                        case 'ping': appendLog('Pong! 12ms', 'success'); break;
                        case 'clear': cliLogs.innerHTML = ''; break;
                        default: appendLog(`bash: ${cmd}: command not found`, 'error');
                    }
                }, 200);
            }
        });
    }

    // 6. SUPABASE: API EXPLORER
    const codeTabs = document.querySelectorAll('.code-tab');
    const codeContent = document.getElementById('codeContent');

    const staticCodeFallbacks = {
        'server.js': `const express = require('express');\nconst helmet = require('helmet');\nconst app = express();\n\n// Secure API Gateway\napp.use(helmet());\napp.use(express.json());\n\napp.get('/api/v1/system', (req, res) => {\n  res.json({ status: 'ok' });\n});\n\napp.listen(3001, () => {\n  console.log('API Gateway running on port 3001');\n});`,
        'agent.py': `import requests\n\nclass MoniOpenClient:\n    def __init__(self, bot_id):\n        self.bot_id = bot_id\n        self.api_url = "http://localhost:3001/api/v1/heartbeat"\n\n    def ping(self):\n        requests.post(self.api_url, json={"botId": self.bot_id, "status": "online"})\n\nclient = MoniOpenClient("roblox-tracker")\nclient.ping()`,
        'app.js': `// Bootstrapping Frontend Observability\ndocument.addEventListener('DOMContentLoaded', () => {\n  console.log("MoniOpen v3.5 UI initialized.");\n  fetchSystemMetrics();\n});`
    };

    function highlightSyntax(code) {
        // Very basic regex highlighter for demo purposes
        let highlighted = code
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\b(const|let|var|function|return|require|import|class|def|self)\b/g, '<span class="code-token-keyword">$1</span>')
            .replace(/('.*?'|".*?"|`.*?`)/g, '<span class="code-token-string">$1</span>')
            .replace(/\b(console|res|req|express|app|requests)\b/g, '<span class="code-token-function">$1</span>')
            .replace(/(\/\/.*|#.*)/g, '<span class="code-token-comment">$1</span>');
        return `<pre><code>${highlighted}</code></pre>`;
    }

    async function loadCodeFile(filename) {
        if(!codeContent) return;
        codeContent.innerHTML = "Loading...";
        try {
            const res = await fetch(`/${filename}`);
            if(!res.ok) throw new Error('Not found');
            const text = await res.text();
            codeContent.innerHTML = highlightSyntax(text);
        } catch (e) {
            codeContent.innerHTML = highlightSyntax(staticCodeFallbacks[filename] || '// Source unavailable');
        }
    }

    codeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            codeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadCodeFile(tab.getAttribute('data-file'));
        });
    });

    if(codeTabs.length > 0) {
        loadCodeFile('server.js');
    }

    window.copyCode = function() {
        if(!codeContent) return;
        navigator.clipboard.writeText(codeContent.textContent).then(() => {
            alert('Code copied to clipboard!');
        });
    }
});
