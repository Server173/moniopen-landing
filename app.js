document.addEventListener('DOMContentLoaded', () => {
    // 1. PURGA DE BOTSTICKERS Y CONTROL DE FLOTA
    const AUTHORIZED_BOTS = ['roblox-tracker', 'bot-discord', 'errorcito-viales'];
    
    function purgeBotstickers() {
        console.log("Iniciando secuencia de purga...");
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.toLowerCase().includes('botstickers')) {
                localStorage.removeItem(key);
                console.warn(`[PURGA] Eliminado de localStorage: ${key}`);
            }
        }
        
        let currentState = [
            { id: 'roblox-tracker', status: 'online', latency: 45, type: 'Go/Node' },
            { id: 'botstickers-beta', status: 'online', latency: 120, type: 'Node' },
            { id: 'bot-discord', status: 'online', latency: 60, type: 'Python' },
            { id: 'BOTSTICKERS_PROD', status: 'error', latency: 999, type: 'Node' },
            { id: 'errorcito-viales', status: 'warning', latency: 200, type: 'Python' }
        ];

        currentState = currentState.filter(bot => !bot.id.toLowerCase().includes('botstickers'));
        currentState = currentState.filter(bot => AUTHORIZED_BOTS.includes(bot.id));
        return currentState;
    }

    const fleetState = purgeBotstickers();
    renderFleet(fleetState);

    // 2. AUDIO FEEDBACK (Web Audio API)
    let audioCtx = null;
    let audioEnabled = false;

    const toggleAudioBtn = document.getElementById('toggleAudioBtn');
    toggleAudioBtn.addEventListener('click', () => {
        audioEnabled = !audioEnabled;
        toggleAudioBtn.textContent = audioEnabled ? '🔊' : '🔇';
        if (audioEnabled && !audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    });

    function playPulseSound() {
        if (!audioEnabled || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    }

    // 3. CANVAS ECG DE LATENCIA
    const canvas = document.getElementById('ecgCanvas');
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth * window.devicePixelRatio;
        canvas.height = parent.clientHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const historySize = 100;
    const dataPoints = new Array(historySize).fill(canvas.height / window.devicePixelRatio / 2);

    function drawECG() {
        const w = canvas.width / window.devicePixelRatio;
        const h = canvas.height / window.devicePixelRatio;
        ctx.clearRect(0, 0, w, h);
        
        ctx.beginPath();
        ctx.strokeStyle = 'var(--ecg-cyan)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
        ctx.shadowBlur = 12;
        
        const sliceWidth = w / (historySize - 1);
        let x = 0;
        
        for (let i = 0; i < historySize; i++) {
            const y = dataPoints[i];
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function updateECG() {
        const h = canvas.height / window.devicePixelRatio;
        for(let i=0; i < historySize - 1; i++) {
            dataPoints[i] = dataPoints[i+1];
        }
        
        const baseLatency = h / 2;
        const isPulse = Math.random() > 0.92;
        let newValue = baseLatency;
        
        if (isPulse) {
            newValue = baseLatency - (Math.random() * 50 + 30);
            setTimeout(() => { dataPoints[historySize-2] = baseLatency + (Math.random() * 30); }, 50);
            playPulseSound();
        } else {
            newValue = baseLatency + (Math.random() * 6 - 3);
        }
        
        dataPoints[historySize - 1] = newValue;
        
        const avgDisplay = document.getElementById('avgLatency');
        if(avgDisplay) avgDisplay.textContent = Math.floor(Math.random() * 8 + 12) + ' ms';

        drawECG();
        requestAnimationFrame(updateECG);
    }
    
    updateECG();

    // 4. NAVEGACIÓN Y TABS
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const sections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            const target = item.getAttribute('data-target');
            sections.forEach(s => {
                s.classList.remove('active');
                if(s.id === target) s.classList.add('active');
            });
            
            // Close mobile menu if open
            const sidebar = document.getElementById('sidebar');
            if(window.innerWidth <= 768 && sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
            }
            
            // Refresh canvas sizes if switching to dashboard
            if (target === 'dashboard') {
                setTimeout(resizeCanvas, 50);
            }
        });
    });

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('mobile-open');
        });
        if (window.innerWidth <= 768) {
            mobileMenuBtn.style.display = 'block';
        }
        window.addEventListener('resize', () => {
            mobileMenuBtn.style.display = window.innerWidth <= 768 ? 'block' : 'none';
        });
    }

    // 5. RENDERIZADO DE FLOTA Y MÉTRICAS
    function renderFleet(bots) {
        const grid = document.getElementById('fleetGrid');
        if(!grid) return;
        grid.innerHTML = '';
        bots.forEach(bot => {
            const card = document.createElement('div');
            card.className = 'bot-card';
            card.innerHTML = `
                <div class="bot-header">
                    <span class="bot-name">${bot.id}</span>
                    <div class="bot-status ${bot.status}" title="${bot.status}"></div>
                </div>
                <div class="bot-metric">${bot.latency} ms</div>
                <div class="bot-subtext">Runtime: ${bot.type} | Ping: Estable</div>
            `;
            grid.appendChild(card);
        });
    }

    async function fetchSystemMetrics() {
        const grid = document.getElementById('systemMetricsGrid');
        const gatewayStatus = document.getElementById('gatewayStatus');
        if(!grid) return;
        try {
            // Se intenta conectar a la API del servidor (por si estamos local)
            const res = await fetch('/api/v1/system', { method: 'GET' });
            if(!res.ok) throw new Error('API Error');
            const data = await res.json();
            renderMetrics(data.metrics, grid);
            if(gatewayStatus) gatewayStatus.textContent = 'API Gateway OK';
        } catch (e) {
            // Fallback gracefully for static deployments (like Vercel HTTPS -> HTTP VPS issue)
            console.warn("Using simulated telemetry fallback (Vercel deployment detected).");
            if(gatewayStatus) gatewayStatus.textContent = 'Gateway OK (Simulado)';
            const dummyMetrics = {
                memory: { free: 4294967296, total: 8589934592, usedPercentage: 50.00 },
                cpuLoad: [0.12, 0.08, 0.05],
                uptime: 86400 * 3.5
            };
            renderMetrics(dummyMetrics, grid);
        }
    }

    function renderMetrics(metrics, grid) {
        const memGB = (metrics.memory.free / 1024 / 1024 / 1024).toFixed(2);
        const totalMemGB = (metrics.memory.total / 1024 / 1024 / 1024).toFixed(2);
        grid.innerHTML = `
            <div class="bot-card">
                <div class="bot-header"><span class="bot-name">Memoria RAM</span></div>
                <div class="bot-metric">${memGB} GB libres</div>
                <div class="bot-subtext">de ${totalMemGB} GB total (${metrics.memory.usedPercentage}% usado)</div>
            </div>
            <div class="bot-card">
                <div class="bot-header"><span class="bot-name">Carga CPU (1m, 5m, 15m)</span></div>
                <div class="bot-metric" style="font-family: var(--font-mono); font-size: 24px;">
                    ${metrics.cpuLoad.map(l => l.toFixed(2)).join(' / ')}
                </div>
                <div class="bot-subtext">Promedios de carga de sistema operativo</div>
            </div>
            <div class="bot-card">
                <div class="bot-header"><span class="bot-name">Uptime Servidor</span></div>
                <div class="bot-metric">${(metrics.uptime / 3600).toFixed(1)} h</div>
                <div class="bot-subtext">Tiempo de actividad ininterrumpida</div>
            </div>
        `;
    }

    fetchSystemMetrics();
    setInterval(fetchSystemMetrics, 15000);

    // 6. TERMINAL CLI
    const cliInput = document.getElementById('cliInput');
    const cliLogs = document.getElementById('cliLogs');

    function appendLog(msg, type = '') {
        const div = document.createElement('div');
        div.className = `cli-log-line ${type}`;
        div.textContent = msg;
        cliLogs.appendChild(div);
        cliLogs.scrollTop = cliLogs.scrollHeight;
    }

    cliInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = cliInput.value.trim();
            if(!val) return;
            appendLog(`root@moniopen:~# ${val}`);
            cliInput.value = '';
            
            const args = val.toLowerCase().split(' ');
            const cmd = args[0];

            switch(cmd) {
                case 'help':
                    appendLog('Comandos: help, status, ping, diagnose, workers, clear', 'info');
                    break;
                case 'status':
                    appendLog('[OK] Núcleo estable. Flota activa: 3. Puerto 3001 en escucha segura.', 'success');
                    break;
                case 'ping':
                    appendLog('Pong! Latencia al gateway: 12ms', 'success');
                    break;
                case 'diagnose':
                    appendLog('Iniciando diagnóstico profundo con Claude 3.5...', 'info');
                    setTimeout(() => window.openDiagnosticModal(), 500);
                    break;
                case 'workers':
                    appendLog('Workers activos: roblox-tracker, bot-discord, errorcito-viales', 'info');
                    break;
                case 'clear':
                    cliLogs.innerHTML = '';
                    break;
                default:
                    appendLog(`bash: ${cmd}: command not found. Escribe 'help'.`, 'error');
            }
        }
    });

    // 7. DIAGNÓSTICO IA (CLAUDE 3.5 SONNET)
    const diagModal = document.getElementById('diagnosticModal');
    
    window.openDiagnosticModal = async function() {
        diagModal.classList.add('active');
        document.getElementById('diagAnalysis').textContent = "Conectando al motor de inferencia Claude 3.5 Sonnet...";
        document.getElementById('diagDiff').innerHTML = "Analizando logs y contexto...";
        
        setTimeout(async () => {
            try {
                const res = await fetch('/api/v1/diagnostics');
                if(!res.ok) throw new Error('Network response was not ok');
                const data = await res.json();
                
                document.getElementById('diagAnalysis').innerHTML = `<strong style="color:var(--status-critical);">Alerta Detectada:</strong> ${data.analysis}`;
                
                const diffHtml = data.diff.split('\n').map(line => {
                    if(line.startsWith('-')) return `<span style="color: var(--status-critical);">${line}</span>`;
                    if(line.startsWith('+')) return `<span style="color: var(--status-healthy);">${line}</span>`;
                    return line;
                }).join('\n');
                
                document.getElementById('diagDiff').innerHTML = diffHtml;
            } catch (e) {
                // Fallback for Vercel/Static deployments
                document.getElementById('diagAnalysis').innerHTML = `<strong style="color:var(--status-critical);">Análisis Simulado (Modo Vercel):</strong> Límite de tasa excedido (HTTP 429) detectado en gateway API. Falta backoff exponencial en el cliente.`;
                document.getElementById('diagDiff').innerHTML = `<span style="color:var(--status-critical);">- fetch(url);</span>\n<span style="color:var(--status-healthy);">+ fetch(url).then(res => {\n+   if(res.status === 429) setTimeout(() => fetch(url), 5000);\n+ });</span>`;
            }
        }, 800);
    }
    
    window.closeDiagnosticModal = function() {
        diagModal.classList.remove('active');
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDiagnosticModal();
    });

    // 8. LIVE CODE EXPLORER
    const codeTabs = document.querySelectorAll('.code-tab');
    const codeTabIndicator = document.getElementById('codeTabIndicator');
    const codeContent = document.getElementById('codeContent');

    function updateTabIndicator(activeTab) {
        if(!activeTab || !codeTabIndicator) return;
        codeTabIndicator.style.width = `${activeTab.offsetWidth}px`;
        codeTabIndicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
    }

    const staticCodeFallbacks = {
        'server.js': `// Backend Express API (Puerto 3001)\nconst express = require('express');\nconst app = express();\n// ...código real en el repositorio...`,
        'app.js': `// Lógica Frontend (app.js)\nconsole.log("MoniOpen v3.5 Inicializado");\n// ...código real en el repositorio...`,
        'style.css': `/* Estilos CSS (style.css) */\n:root { --bg-canvas: #05070f; }\n/* ...código real en el repositorio... */`,
        'agent.py': `# Python SDK (agent.py)\nimport requests\nclass MoniOpenClient:\n# ...código real en el repositorio...`
    };

    async function loadCodeFile(filename) {
        codeContent.textContent = "Cargando archivo...";
        try {
            const res = await fetch(`/${filename}`);
            if(!res.ok) throw new Error('File not found');
            const text = await res.text();
            codeContent.textContent = text;
        } catch (e) {
            codeContent.textContent = staticCodeFallbacks[filename] || `No se pudo cargar ${filename} en este entorno estático.`;
        }
    }

    codeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            codeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateTabIndicator(tab);
            loadCodeFile(tab.getAttribute('data-file'));
        });
    });

    if(codeTabs.length > 0) {
        setTimeout(() => updateTabIndicator(codeTabs[0]), 100);
        loadCodeFile('server.js');
    }

    window.copyCode = function() {
        const text = codeContent.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.querySelector('.copy-btn');
            btn.textContent = '¡Copiado al portapapeles!';
            btn.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
            btn.style.color = 'var(--status-healthy)';
            btn.style.borderColor = 'var(--status-healthy)';
            setTimeout(() => {
                btn.textContent = 'Copiar Código';
                btn.style.backgroundColor = 'var(--bg-surface-3)';
                btn.style.color = '#cbd5e1';
                btn.style.borderColor = 'var(--border-capillary)';
            }, 2000);
        });
    }
});
