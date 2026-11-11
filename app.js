// State & Config
let isStreamPaused = false;
let globalUptime = 99.98;
let totalEvents = 14293100;
let crashActive = false;
let chartInstance = null;
const latencyData = Array(20).fill(42);

// Initial Bots
const defaultBots = [
    { id: 'crawler-node-primary', runtime: 'Node.js 22 LTS', latency: 18, ram: 84, status: 'Healthy', pid: 84920, uptime: '14d 3h' },
    { id: 'discord-event-relay', runtime: 'Python 3.12', latency: 34, ram: 112, status: 'Healthy', pid: 84921, uptime: '5d 12h' },
    { id: 'roblox-sync-worker', runtime: 'Go 1.23', latency: 42, ram: 240, status: 'Warning', pid: 84922, uptime: '1d 1h' },
    { id: 'payment-webhook-listener', runtime: 'Rust 1.80', latency: 9, ram: 32, status: 'Healthy', pid: 84923, uptime: '30d 0h' }
];

let bots = [];

// DOM Load
document.addEventListener('DOMContentLoaded', () => {
    initBots();
    renderFleetTable();
    initChart();
    startMetricsSimulation();
    startLogStream();
    setupSdkTabs();
    setupFleetSearch();
});

function escapeHTML(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

// --- MODULE A: Telemetry & Metrics ---
let lastSysData = null;
let isFetchingSysData = false;
// Telemetría de Clúster Global Edge (Simulada y auto-contenida para proteger la privacidad del servidor)
function getClusterTelemetry() {
    const time = Date.now();
    const baseRam = crashActive ? 74 : 38;
    const ramWave = Math.sin(time / 15000) * 3 + (Math.random() * 1.5);
    const percent = Math.min(96, Math.max(22, Math.round(baseRam + ramWave)));
    const totalGB = 64.0;
    const usedGB = ((percent / 100) * totalGB).toFixed(1);

    const baseLoad = crashActive ? 2.45 : 0.28;
    const loadWave = (Math.sin(time / 9000) * 0.06) + (Math.random() * 0.03);
    const load1 = Math.max(0.08, baseLoad + loadWave).toFixed(2);

    return {
        percent,
        usedGB,
        totalGB,
        load1,
        uptime: '99.99%'
    };
}

function startMetricsSimulation() {
    // Latency oscillation & Cluster Edge Telemetry
    setInterval(() => {
        if (document.hidden) return;
        let base = crashActive ? 150 : 38;
        let variance = crashActive ? 50 : 14;
        
        // Obtener telemetría de clúster aislada sin exponer hardware físico ni hacer fetchs externos
        const clusterData = getClusterTelemetry();
        base += (parseFloat(clusterData.load1) * 8);
        
        // Actualizar tarjeta de telemetría de clúster
        const elRam = document.getElementById('host-ram-usage');
        if (elRam) elRam.textContent = `${clusterData.usedGB} / ${clusterData.totalGB} GB allocated`;
        
        const elRamPercent = document.getElementById('host-ram-percent');
        if (elRamPercent) elRamPercent.textContent = `${clusterData.percent}%`;
        
        const elRamBar = document.getElementById('host-ram-bar');
        if (elRamBar) elRamBar.style.width = `${clusterData.percent}%`;

        const elCpu = document.getElementById('host-cpu-load');
        if (elCpu) elCpu.textContent = clusterData.load1;
        
        const elCpuBar = document.getElementById('host-cpu-bar');
        if (elCpuBar) elCpuBar.style.width = `${Math.min(100, parseFloat(clusterData.load1) * 45)}%`;

        const elUptime = document.getElementById('host-uptime');
        if (elUptime) elUptime.textContent = clusterData.uptime;
        
        let currentLatency = Math.floor(base + Math.random() * variance);
        
        const latencyEl = document.getElementById('avg-latency');
        if (latencyEl) {
            latencyEl.innerHTML = `${currentLatency}<span class="text-xl text-gray-500 font-sans font-normal">ms</span>`;
            latencyEl.classList.remove('value-flash');
            void latencyEl.offsetWidth;
            latencyEl.classList.add('value-flash');
        }

        const barEl = document.getElementById('latency-bar');
        if (barEl) {
            barEl.style.width = `${Math.min(100, (currentLatency / 100) * 100)}%`;
            if(crashActive) {
                barEl.className = 'h-full bg-red-500 w-full rounded-full transition-all duration-300';
            } else {
                barEl.className = 'h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300';
            }
        }

        // Update Chart
        if (chartInstance) {
            latencyData.push(currentLatency);
            latencyData.shift();
            chartInstance.update();
        }
    }, 2500);

    // Event Ingestion
    setInterval(() => {
        if (document.hidden) return;
        let events = Math.floor(1300 + Math.random() * 200);
        
        if (lastSysData && lastSysData.memory) {
            const usage = parseFloat(lastSysData.memory.usagePercent);
            events = Math.floor(events * (1 + (usage/100)));
        }

        const evRate = document.getElementById('event-rate');
        if (evRate) evRate.innerText = events.toLocaleString();
        totalEvents += events;
        const totEv = document.getElementById('total-events');
        if (totEv) totEv.innerText = totalEvents.toLocaleString();
    }, 1000);
}

function initChart() {
    const canvas = document.getElementById('latencyChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Luxury Gradient
    let gradient = ctx.createLinearGradient(0, 0, 0, 150);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
    gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.12)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(20).fill(''),
            datasets: [{
                label: 'Latency (ms)',
                data: latencyData,
                borderColor: '#818cf8',
                backgroundColor: gradient,
                borderWidth: 2.2,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#6366f1',
                pointHoverBorderWidth: 2,
                fill: true,
                tension: 0.42
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 400,
                easing: 'linear'
            },
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(7, 8, 12, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#a5b4fc',
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    borderWidth: 1,
                    padding: 8,
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => `RTT: ${ctx.parsed.y} ms`
                    }
                }
            },
            scales: {
                x: { display: false },
                y: {
                    display: true,
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 4 },
                    min: 0,
                    max: 180
                }
            }
        }
    });
}

// --- MODULE B: Fleet Management ---
function initBots() {
    const stored = localStorage.getItem('moniopen_bots');
    if (stored) {
        try {
            bots = JSON.parse(stored);
        } catch (e) {
            bots = [...defaultBots];
        }
    } else {
        bots = [...defaultBots];
        localStorage.setItem('moniopen_bots', JSON.stringify(bots));
    }
}

function setupFleetSearch() {
    const input = document.getElementById('fleet-search');
    if (input) {
        input.addEventListener('input', (e) => {
            renderFleetTable(e.target.value);
        });
    }
}

function pingWorker(botId) {
    const rtt = Math.floor(12 + Math.random() * 22);
    showToast(`Worker Ping: ${botId}`, `Latency: ${rtt}ms • Zero packet drop`, 'success');
}

function renderFleetTable(filterText = '') {
    const tbody = document.getElementById('fleet-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let activeCount = 0;
    const q = (filterText || '').trim().toLowerCase();

    const filteredBots = bots.filter(b => {
        if (!q) return true;
        return (b.id && b.id.toLowerCase().includes(q)) ||
               (b.runtime && b.runtime.toLowerCase().includes(q)) ||
               (b.status && b.status.toLowerCase().includes(q));
    });

    if (filteredBots.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-16 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center space-y-2">
                        <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-1">
                            <i data-lucide="search" class="w-5 h-5 text-gray-500" aria-hidden="true"></i>
                        </div>
                        <p class="text-xs font-mono">No workers match the search criteria.</p>
                    </div>
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    filteredBots.forEach((bot, idx) => {
        if (bot.status !== 'Offline' && bot.status !== 'CRITICAL') activeCount++;
        
        let statusClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        let statusDot = 'bg-emerald-400';
        if (bot.status === 'Warning') { 
            statusClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20'; 
            statusDot = 'bg-amber-400'; 
        }
        if (bot.status === 'CRITICAL') { 
            statusClass = 'bg-red-500/10 text-red-400 border-red-500/30 font-bold'; 
            statusDot = 'bg-red-400 animate-ping'; 
        }

        const tr = document.createElement('tr');
        tr.className = 'fleet-row cursor-pointer group';
        tr.setAttribute('tabindex', '0');
        tr.setAttribute('role', 'button');
        tr.setAttribute('aria-label', `Inspect bot ${bot.id}, status ${bot.status}`);
        tr.onclick = () => openBotDrawer(bot.id);
        tr.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openBotDrawer(bot.id);
            }
        };
        
        tr.innerHTML = `
            <td class="px-5 py-3.5 border-b border-border">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/40 group-hover:bg-indigo-500/10 transition-all">
                        <i data-lucide="cpu" class="w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" aria-hidden="true"></i>
                    </div>
                    <div>
                        <span class="font-medium text-white text-xs block">${escapeHTML(bot.id)}</span>
                        <span class="text-[10px] text-gray-500 font-mono">PID #${escapeHTML(bot.pid || '84920')}</span>
                    </div>
                </div>
            </td>
            <td class="px-5 py-3.5 border-b border-border">
                <span class="font-mono text-xs text-gray-300 bg-black/40 px-2 py-1 rounded-md border border-white/5">${escapeHTML(bot.runtime)}</span>
            </td>
            <td class="px-5 py-3.5 border-b border-border font-mono text-xs">
                <div class="flex items-center gap-3">
                    <span class="text-gray-300">${escapeHTML(bot.latency)}ms</span>
                    <span class="text-gray-500">•</span>
                    <span class="text-gray-400">${escapeHTML(bot.ram)}MB</span>
                </div>
            </td>
            <td class="px-5 py-3.5 border-b border-border">
                <span class="px-2.5 py-1 rounded-full text-[11px] font-mono border inline-flex items-center gap-1.5 ${statusClass}">
                    <span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span>
                    <span>${escapeHTML(bot.status)}</span>
                </span>
            </td>
            <td class="px-5 py-3.5 border-b border-border text-right" onclick="event.stopPropagation()">
                <div class="flex items-center justify-end gap-1.5">
                    <button type="button" onclick="pingWorker('${escapeHTML(bot.id)}')" class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-[11px] font-mono transition-all">
                        Ping
                    </button>
                    <button type="button" onclick="openBotDrawer('${escapeHTML(bot.id)}')" class="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[11px] font-semibold transition-all">
                        Details
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    const countEl = document.getElementById('cluster-count');
    if (countEl) countEl.innerHTML = `${activeCount}<span class="text-xl text-gray-500 font-sans font-normal">/${bots.length}</span>`;
    lucide.createIcons();
}

function openBotDrawer(botId) {
    const bot = bots.find(b => b.id === botId);
    if(!bot) return;

    document.getElementById('drawer-bot-name').innerText = bot.id;
    document.getElementById('drawer-bot-runtime').innerText = bot.runtime;
    document.getElementById('drawer-pid').innerText = bot.pid;
    document.getElementById('drawer-ram').innerText = bot.ram;
    
    const statusEl = document.getElementById('drawer-bot-status');
    statusEl.innerText = bot.status;
    if(bot.status === 'Healthy') statusEl.className = 'px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    else if(bot.status === 'CRITICAL') statusEl.className = 'px-3 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse';
    else statusEl.className = 'px-3 py-1 text-xs font-bold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30';

    document.getElementById('backdrop').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('backdrop').classList.remove('opacity-0');
        document.getElementById('bot-drawer').classList.remove('hidden', 'drawer-exit'); document.getElementById('bot-drawer').classList.add('drawer-enter');
    }, 10);
}

function closeAllOverlays() {
    document.getElementById('bot-drawer').classList.remove('drawer-enter'); document.getElementById('bot-drawer').classList.add('drawer-exit');
    document.getElementById('register-modal').classList.remove('modal-enter'); document.getElementById('register-modal').classList.add('modal-exit');
    document.getElementById('claude-modal').classList.remove('modal-enter'); document.getElementById('claude-modal').classList.add('modal-exit');
    document.getElementById('backdrop').classList.add('opacity-0');
    
    setTimeout(() => {
        document.getElementById('register-modal').classList.add('hidden'); document.getElementById('register-modal').classList.remove('modal-exit', 'modal-enter');
        document.getElementById('claude-modal').classList.add('hidden'); document.getElementById('claude-modal').classList.remove('modal-exit', 'modal-enter');
        document.getElementById('backdrop').classList.add('hidden');
        
        // Reset modal states
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('register-success').classList.add('hidden', 'flex');
        
    }, 300);
}

// --- MODULE C: Register Bot ---
function openNewBotModal() {
    document.getElementById('backdrop').classList.remove('hidden');
    document.getElementById('register-modal').classList.remove('hidden', 'modal-exit');
    document.getElementById('register-modal').classList.add('flex', 'modal-enter');
    
    document.getElementById('new-bot-name').value = '';
    const consentBox = document.getElementById('consent-checkbox');
    if (consentBox) consentBox.checked = false;
    
    setTimeout(() => {
        document.getElementById('backdrop').classList.remove('opacity-0');
        document.getElementById('register-modal').classList.remove('opacity-0');
        document.getElementById('new-bot-name').focus();
    }, 10);
}

// Handle interval buttons
document.querySelectorAll('.interval-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.interval-btn').forEach(b => {
            b.classList.remove('active', 'border-indigo-500', 'text-indigo-400', 'bg-indigo-500/10');
            b.classList.add('border-border', 'text-gray-400');
        });
        const t = e.target;
        t.classList.remove('border-border', 'text-gray-400');
        t.classList.add('active', 'border-indigo-500', 'text-indigo-400', 'bg-indigo-500/10');
    });
});

async function generateBot() {
    const nameInput = document.getElementById('new-bot-name').value.trim();
    if(!nameInput) return showToast('Error', 'Please enter a bot name', 'error');
    
    const consentBox = document.getElementById('consent-checkbox');
    if (!consentBox || !consentBox.checked) {
        return showToast('Consent Required', 'Please accept the Privacy Policy and Terms (TCPA/GDPR) to continue', 'error');
    }

    const lang = document.getElementById('new-bot-lang').value;
    const consentTimestamp = new Date().toISOString();
    
    // Generate key
    const chars = 'abcdef0123456789';
    let key = 'mop_live_';
    for(let i=0; i<28; i++) key += chars[Math.floor(Math.random() * chars.length)];
    
    // Add to bots with explicit consent metadata
    const newBot = {
        id: nameInput,
        runtime: lang,
        latency: 0,
        ram: 0,
        status: 'Waiting...',
        pid: Math.floor(10000 + Math.random() * 80000),
        uptime: '0m',
        consent_given: true,
        consent_timestamp: consentTimestamp
    };
    
    bots.push(newBot);
    localStorage.setItem('moniopen_bots', JSON.stringify(bots));
    renderFleetTable();

    // Persist consent on backend with timeout
    try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 5000);
        await fetch('/api/v1/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                botId: nameInput,
                runtime: lang,
                consent_given: true,
                consent_timestamp: consentTimestamp
            }),
            signal: controller.signal
        });
        clearTimeout(tid);
    } catch (e) { }
    
    // Update UI to success step
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('register-success').classList.remove('hidden');
    document.getElementById('register-success').classList.add('flex');
    document.getElementById('generated-api-key').innerText = key;
    
    showToast('Success', 'Bot registered & consent recorded');
}

function copyGeneratedKey() {
    const key = document.getElementById('generated-api-key').innerText;
    navigator.clipboard.writeText(key).then(() => {
        showToast('Copied!', 'API Key copied to clipboard');
    });
}

// --- MODULE D: Log Console ---
function toggleLogStream() {
    isStreamPaused = !isStreamPaused;
    const btn = document.getElementById('btn-stream');
    if(isStreamPaused) {
        btn.innerText = 'Resume';
        btn.classList.replace('bg-gray-800', 'bg-indigo-600');
        btn.classList.add('text-white');
    } else {
        btn.innerText = 'Pause';
        btn.classList.replace('bg-indigo-600', 'bg-gray-800');
        btn.classList.remove('text-white');
    }
}

function clearLogs() {
    document.getElementById('terminal-content').innerHTML = '';
}

let activeLogLevel = 'ALL';
let logSearchQuery = '';

document.querySelectorAll('.log-filter').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.log-filter').forEach(b => {
            b.classList.remove('active', 'bg-indigo-500/20', 'text-indigo-400');
        });
        const t = e.target;
        t.classList.add('active', 'bg-indigo-500/20', 'text-indigo-400');
        activeLogLevel = t.getAttribute('data-level');
        applyLogFilters();
    });
});

document.getElementById('log-search').addEventListener('input', (e) => {
    logSearchQuery = e.target.value.toLowerCase();
    applyLogFilters();
});

function applyLogFilters() {
    const logs = document.querySelectorAll('.log-entry');
    logs.forEach(log => {
        const level = log.getAttribute('data-level');
        const text = log.innerText.toLowerCase();
        
        let levelMatch = activeLogLevel === 'ALL' || level === activeLogLevel;
        let searchMatch = text.includes(logSearchQuery);
        
        if(levelMatch && searchMatch) log.style.display = 'block';
        else log.style.display = 'none';
    });
}

function startLogStream() {
    setInterval(() => {
        if(isStreamPaused || document.hidden) return;
        
        const botsActive = bots.filter(b => b.status !== 'Offline');
        if(botsActive.length === 0) return;
        
        const bot = botsActive[Math.floor(Math.random() * botsActive.length)];
        
        let level = 'INFO';
        let msg = `Heartbeat received OK - latency ${bot.latency}ms`;
        let color = 'text-gray-300';
        let prefixColor = 'text-indigo-400';
        
        // Force errors if crash is active
        if(crashActive && bot.id === 'roblox-sync-worker') {
            level = 'ERROR';
            msg = `[HTTP 429] Too Many Requests on upstream API. Quota exceeded.`;
            color = 'text-red-400';
            prefixColor = 'text-red-500';
        } else {
            const rand = Math.random();
            if(rand > 0.95) {
                level = 'ERROR'; msg = `Failed to parse response body. Connection reset.`; color = 'text-red-400'; prefixColor = 'text-red-500';
            } else if(rand > 0.85) {
                level = 'WARN'; msg = `High memory usage detected (${bot.ram}MB).`; color = 'text-orange-400'; prefixColor = 'text-orange-500';
            }
        }
        
        addLog(bot.id, level, msg, color, prefixColor);
    }, 2000);
}

function addLog(botId, level, msg, textColor, prefixColor) {
    const terminal = document.getElementById('terminal-content');
    const div = document.createElement('div');
    div.className = `log-entry log-entry-enter ${textColor}`;
    div.setAttribute('data-level', level);
    
    const time = new Date().toISOString().split('T')[1].slice(0, 8);
    
    div.innerHTML = `
        <span class="text-gray-500">[${time}]</span> 
        <span class="${prefixColor} font-bold">[${escapeHTML(level)}]</span> 
        <span class="text-gray-400">&lt;${escapeHTML(botId)}&gt;</span>: ${escapeHTML(msg)}
    `;
    
    terminal.appendChild(div);
    
    // Auto scroll
    terminal.scrollTop = terminal.scrollHeight;
    
    // Apply current filters to new log
    let levelMatch = activeLogLevel === 'ALL' || level === activeLogLevel;
    let searchMatch = div.innerText.toLowerCase().includes(logSearchQuery);
    if(!(levelMatch && searchMatch)) div.style.display = 'none';
    
    // Keep max 100 logs
    if(terminal.children.length > 100) terminal.removeChild(terminal.firstChild);
}

// --- MODULE E: Claude Diagnostics ---
function triggerCrashSimulation() {
    crashActive = true;
    
    // Update bot status
    const botIndex = bots.findIndex(b => b.id === 'roblox-sync-worker');
    if(botIndex !== -1) {
        bots[botIndex].status = 'CRITICAL';
        bots[botIndex].latency = 999;
        renderFleetTable();
    }
    
    // Show Alert
    document.getElementById('ai-alert').classList.remove('hidden');
    
    // Inject massive error in terminal
    for(let i=0; i<3; i++) {
        setTimeout(() => {
            addLog('roblox-sync-worker', 'ERROR', 'Exception in thread "main" HTTPError: 429 Too Many Requests', 'text-red-400 bg-red-900/20', 'text-red-500');
            addLog('roblox-sync-worker', 'ERROR', 'Traceback (most recent call last): File "roblox-sync-worker.py", line 84 in fetch_assets', 'text-red-400', 'text-red-500');
        }, i * 500);
    }
    
    showToast('CRITICAL', 'roblox-sync-worker is failing', 'error');
}

function openClaudeDiagnostics() {
    document.getElementById('backdrop').classList.remove('hidden');
    document.getElementById('claude-modal').classList.remove('hidden', 'modal-exit');
    document.getElementById('claude-modal').classList.add('flex', 'modal-enter');
    
    setTimeout(() => {
        document.getElementById('backdrop').classList.remove('opacity-0');
        document.getElementById('claude-modal').classList.remove('opacity-0');
    }, 10);
    
    // Reset UI
    document.getElementById('claude-loading').classList.remove('hidden');
    document.getElementById('claude-result').classList.add('hidden');
    document.getElementById('claude-result').classList.remove('flex');
    const badge = document.getElementById('claude-status-badge');
    badge.innerHTML = '<span class="animate-pulse">Analyzing...</span>';
    badge.className = 'px-2 py-1 text-xs font-mono rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
    
    // Animate thinking
    setTimeout(() => { document.getElementById('claude-thinking-text').innerText = "Correlating HTTP 429 errors with source code..."; }, 1500);
    setTimeout(() => { document.getElementById('claude-thinking-text').innerText = "Generating Exponential Backoff patch..."; }, 3000);
    
    setTimeout(() => {
        document.getElementById('claude-loading').classList.add('hidden');
        document.getElementById('claude-result').classList.remove('hidden');
        document.getElementById('claude-result').classList.add('flex');
        
        badge.innerHTML = '<i data-lucide="check-circle" class="w-3 h-3 inline"></i> Analysis Complete';
        badge.className = 'px-2 py-1 text-xs font-mono rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1';
        lucide.createIcons();
    }, 4500);
}

function applyAIPatch() {
    const btn = document.getElementById('btn-apply-patch');
    btn.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Applying...';
    
    setTimeout(() => {
        crashActive = false;
        
        // Recover bot
        const botIndex = bots.findIndex(b => b.id === 'roblox-sync-worker');
        if(botIndex !== -1) {
            bots[botIndex].status = 'Healthy';
            bots[botIndex].latency = 42;
            renderFleetTable();
        }
        
        document.getElementById('ai-alert').classList.add('hidden');
        closeAllOverlays();
        
        addLog('SYSTEM', 'INFO', 'AI Patch applied successfully. roblox-sync-worker recovered.', 'text-emerald-400', 'text-emerald-500');
        showToast('System Restored', 'Bot roblox-sync-worker is Healthy again.');
        
        btn.innerHTML = '<i data-lucide="wrench" class="w-4 h-4"></i> Apply Patch & Auto-Recover';
    }, 2000);
}

// --- MODULE F: SDK Docs ---
function setupSdkTabs() {
    const tabs = document.querySelectorAll('.sdk-tab');
    const contents = document.querySelectorAll('.sdk-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('active', 'text-white', 'bg-white/10', 'font-semibold'); t.classList.add('font-medium');
                t.classList.add('text-gray-400');
            });
            contents.forEach(c => c.classList.add('hidden'));
            
            tab.classList.remove('text-gray-400');
            tab.classList.remove('font-medium'); tab.classList.add('active', 'text-white', 'bg-white/10', 'font-semibold');
            
            const target = tab.getAttribute('data-lang');
            document.getElementById(`sdk-${target}`).classList.remove('hidden');
        });
    });
}

function copySdkCode() {
    const activeTab = document.querySelector('.sdk-content:not(.hidden) code');
    if(!activeTab) return;
    
    navigator.clipboard.writeText(activeTab.innerText).then(() => {
        const btn = document.getElementById('btn-copy-sdk');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i> Copied!';
        btn.classList.replace('text-gray-300', 'text-emerald-400');
        lucide.createIcons();
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.replace('text-emerald-400', 'text-gray-300');
            lucide.createIcons();
        }, 2000);
    });
}

// --- Utilities ---
function showToast(title, message, type = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-message').innerText = message;
    
    const iconContainer = document.getElementById('toast-icon');
    if(type === 'error') {
        iconContainer.className = 'w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center';
        iconContainer.innerHTML = '<i data-lucide="x" class="w-4 h-4"></i>';
    } else {
        iconContainer.className = 'w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center';
        iconContainer.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>';
    }
    lucide.createIcons();
    
    toast.classList.remove('translate-y-[150%]', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('translate-y-[150%]', 'opacity-0');
    }, 4000);
}

// Linear-style Glow Effect Tracking
document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.glass-card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// SPA Navigation Logic
document.addEventListener('DOMContentLoaded', () => {
    const navs = {
        'nav-overview': 'view-overview',
        'nav-fleet': 'view-fleet',
        'nav-logs': 'view-logs',
        'nav-docs': 'view-docs'
    };
    
    // Add title dynamic update
    const titles = {
        'nav-overview': 'Cluster Telemetry',
        'nav-fleet': 'Fleet Management',
        'nav-logs': 'System Console',
        'nav-docs': 'Developer SDK'
    };

    for (let navId in navs) {
        const navEl = document.getElementById(navId);
        if(!navEl) continue;
        const activateNav = (e) => {
            if (e) e.preventDefault();
            // Update Active Nav
            document.querySelectorAll('.nav-item').forEach(el => {
                el.classList.remove('active', 'text-white', 'bg-[rgba(255,255,255,0.05)]');
                el.classList.add('text-gray-400');
            });
            navEl.classList.remove('text-gray-400');
            navEl.classList.add('active', 'text-white', 'bg-[rgba(255,255,255,0.05)]');
            
            // Switch View
            document.querySelectorAll('.view-section').forEach(view => {
                view.classList.remove('active-view');
                view.classList.add('hidden-view');
            });
            
            const targetView = document.getElementById(navs[navId]);
            targetView.classList.remove('hidden-view');
            targetView.classList.add('active-view');
            
            // Update Header Title
            const headerTitle = document.querySelector('header h1');
            if(headerTitle) {
                headerTitle.innerText = titles[navId];
            }
        };
        navEl.addEventListener('click', activateNav);
        navEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                activateNav(e);
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllOverlays();
        }
    });
});


// --- Magnetic Buttons Premium Effect ---
document.addEventListener('DOMContentLoaded', () => {
    const deployBtn = document.getElementById('btn-deploy');
    if(deployBtn) {
        deployBtn.addEventListener('mousemove', (e) => {
            const rect = deployBtn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            deployBtn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });
        deployBtn.addEventListener('mouseleave', () => {
            deployBtn.style.transform = 'translate(0, 0)';
        });
        deployBtn.addEventListener('mousedown', () => {
            deployBtn.style.transform = 'scale(0.95)';
        });
        deployBtn.addEventListener('mouseup', () => {
            deployBtn.style.transform = 'translate(0, 0)';
        });
    }
});
