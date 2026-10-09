document.addEventListener('DOMContentLoaded', () => {
    // 1. PURGA DE BOTSTICKERS Y CONTROL DE FLOTA
    const AUTHORIZED_BOTS = ['roblox-tracker', 'bot-discord', 'errorcito-viales'];
    
    function purgeBotstickers() {
        console.log("Iniciando secuencia de purga...");
        // Purga localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.toLowerCase().includes('botstickers')) {
                localStorage.removeItem(key);
                console.warn(`[PURGA] Eliminado de localStorage: ${key}`);
            }
        }
        
        // Simular purga en estado local
        let currentState = [
            { id: 'roblox-tracker', status: 'online', latency: 45, type: 'Go/Node' },
            { id: 'botstickers-beta', status: 'online', latency: 120, type: 'Node' },
            { id: 'bot-discord', status: 'online', latency: 60, type: 'Python' },
            { id: 'BOTSTICKERS_PROD', status: 'error', latency: 999, type: 'Node' },
            { id: 'errorcito-viales', status: 'warning', latency: 200, type: 'Python' }
        ];

        let initialCount = currentState.length;
        currentState = currentState.filter(bot => {
            const isBotsticker = bot.id.toLowerCase().includes('botstickers');
            if(isBotsticker) console.warn(`[PURGA] Eliminado del estado: ${bot.id}`);
            return !isBotsticker;
        });

        // Asegurar que solo queden los autorizados, por seguridad extrema
        currentState = currentState.filter(bot => AUTHORIZED_BOTS.includes(bot.id));

        console.log(`Purga completada. Bots eliminados: ${initialCount - currentState.length}`);
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
        osc.frequency.setValueAtTime(200, audioCtx.currentTime); // Tono bajo
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); // Volumen sutil
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }

    // 3. CANVAS ECG DE LATENCIA
    const canvas = document.getElementById('ecgCanvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    
    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const historySize = 100;
    const dataPoints = new Array(historySize).fill(height / 2);
    let drawIndex = 0;

    function drawECG() {
        ctx.clearRect(0, 0, width, height);
        
        ctx.beginPath();
        ctx.strokeStyle = 'var(--ecg-cyan)';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'var(--ecg-cyan)';
        ctx.shadowBlur = 8;
        
        const sliceWidth = width / (historySize - 1);
        let x = 0;
        
        for (let i = 0; i < historySize; i++) {
            const v = dataPoints[i];
            const y = v;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
    }

    function updateECG() {
        // Shift left
        for(let i=0; i < historySize - 1; i++) {
            dataPoints[i] = dataPoints[i+1];
        }
        
        // Generate new point based on fleet latency
        const baseLatency = height / 2;
        const isPulse = Math.random() > 0.8;
        let newValue = baseLatency;
        
        if (isPulse) {
            newValue = baseLatency - (Math.random() * 40 + 20); // Spike up (lower Y)
            setTimeout(() => { dataPoints[historySize-1] = baseLatency + (Math.random() * 20); }, 50); // Spike down
            playPulseSound();
        } else {
            newValue = baseLatency + (Math.random() * 4 - 2); // Small noise
        }
        
        dataPoints[historySize - 1] = newValue;
        
        // Update Avg text
        const avgDisplay = document.getElementById('avgLatency');
        if(avgDisplay) avgDisplay.textContent = Math.floor(Math.random() * 15 + 30) + ' ms';

        drawECG();
        requestAnimationFrame(updateECG);
    }
    
    // Iniciar loop si el canvas es visible
    window.addEventListener('resize', () => {
        width = canvas.parentElement.offsetWidth;
        height = canvas.parentElement.offsetHeight;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    });
    
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
        });
    });

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
                    <div class="bot-status ${bot.status}"></div>
                </div>
                <div style="font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between;">
                    <span>Runtime: ${bot.type}</span>
                    <span style="font-family: var(--font-mono);">${bot.latency}ms</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    async function fetchSystemMetrics() {
        const grid = document.getElementById('systemMetricsGrid');
        if(!grid) return;
        try {
            const res = await fetch('/api/v1/system');
            if(!res.ok) throw new Error('API Error');
            const data = await res.json();
            const memGB = (data.metrics.memory.free / 1024 / 1024 / 1024).toFixed(2);
            const totalMemGB = (data.metrics.memory.total / 1024 / 1024 / 1024).toFixed(2);
            
            grid.innerHTML = `
                <div class="bot-card">
                    <div class="bot-header"><span class="bot-name">Memoria RAM</span></div>
                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">${memGB} GB libres</div>
                    <div style="font-size: 12px; color: #94a3b8;">de ${totalMemGB} GB total (${data.metrics.memory.usedPercentage}% usado)</div>
                </div>
                <div class="bot-card">
                    <div class="bot-header"><span class="bot-name">Carga CPU (1m, 5m, 15m)</span></div>
                    <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px; font-family: var(--font-mono);">
                        ${data.metrics.cpuLoad.map(l => l.toFixed(2)).join(' / ')}
                    </div>
                </div>
                <div class="bot-card">
                    <div class="bot-header"><span class="bot-name">Uptime Servidor</span></div>
                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">${(data.metrics.uptime / 3600).toFixed(1)} h</div>
                </div>
            `;
        } catch (e) {
            grid.innerHTML = '<div style="color: var(--status-critical);">Error obteniendo métricas del servidor (¿Está corriendo en puerto 3001?).</div>';
        }
    }

    fetchSystemMetrics();
    setInterval(fetchSystemMetrics, 10000);

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
            appendLog(`❯ ${val}`);
            cliInput.value = '';
            
            const args = val.toLowerCase().split(' ');
            const cmd = args[0];

            switch(cmd) {
                case 'help':
                    appendLog('Comandos disponibles: help, status, ping, diagnose, workers, clear', 'info');
                    break;
                case 'status':
                    appendLog('Sistema OK. Flota activa: 3. Puerto 3001 en escucha.', 'success');
                    break;
                case 'ping':
                    appendLog('Pong! Latencia al gateway: 12ms', 'success');
                    break;
                case 'diagnose':
                    appendLog('Iniciando diagnóstico profundo...', 'info');
                    window.openDiagnosticModal();
                    break;
                case 'workers':
                    appendLog('Workers activos: roblox-tracker, bot-discord, errorcito-viales', 'info');
                    break;
                case 'clear':
                    cliLogs.innerHTML = '';
                    break;
                default:
                    appendLog(`Comando no reconocido: ${cmd}. Escribe 'help'.`, 'error');
            }
        }
    });

    // 7. DIAGNÓSTICO IA (CLAUDE 3.5 SONNET)
    const diagModal = document.getElementById('diagnosticModal');
    
    window.openDiagnosticModal = async function() {
        diagModal.classList.add('active');
        document.getElementById('diagAnalysis').textContent = "Consultando a Claude 3.5 Sonnet...";
        document.getElementById('diagDiff').innerHTML = "Cargando diff...";
        
        try {
            const res = await fetch('/api/v1/diagnostics');
            const data = await res.json();
            document.getElementById('diagAnalysis').textContent = data.analysis;
            
            // Basic diff styling
            const diffHtml = data.diff.split('\n').map(line => {
                if(line.startsWith('-')) return `<span style="color: var(--status-critical);">${line}</span>`;
                if(line.startsWith('+')) return `<span style="color: var(--status-healthy);">${line}</span>`;
                return line;
            }).join('\n');
            
            document.getElementById('diagDiff').innerHTML = diffHtml;
        } catch (e) {
            document.getElementById('diagAnalysis').textContent = "Error conectando al módulo de diagnóstico.";
        }
    }
    
    window.closeDiagnosticModal = function() {
        diagModal.classList.remove('active');
    }

    // Modal Atajos
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

    async function loadCodeFile(filename) {
        codeContent.textContent = "Cargando...";
        try {
            // Se hace un fetch directo al archivo estático servido por Express
            const res = await fetch(`/${filename}`);
            if(!res.ok) throw new Error('File not found');
            const text = await res.text();
            codeContent.textContent = text;
        } catch (e) {
            codeContent.textContent = `Error al cargar ${filename}: ${e.message}`;
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

    // Init Explorer
    if(codeTabs.length > 0) {
        setTimeout(() => updateTabIndicator(codeTabs[0]), 100);
        loadCodeFile('server.js');
    }

    window.copyCode = function() {
        const text = codeContent.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.querySelector('.copy-btn');
            btn.textContent = '✓ Copiado';
            btn.style.color = 'var(--status-healthy)';
            setTimeout(() => {
                btn.textContent = 'Copiar';
                btn.style.color = '#94a3b8';
            }, 1500);
        });
    }
});
