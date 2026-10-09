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
});

// --- MODULE A: Telemetry & Metrics ---
function startMetricsSimulation() {
    // Latency oscilation
    setInterval(() => {
        let base = crashActive ? 150 : 38;
        let variance = crashActive ? 50 : 14;
        let currentLatency = Math.floor(base + Math.random() * variance);
        
        document.getElementById('avg-latency').innerHTML = `${currentLatency}<span class="text-lg font-sans text-gray-500">ms</span>`;
        document.getElementById('latency-bar').style.width = `${Math.min(100, (currentLatency / 100) * 100)}%`;
        
        if(crashActive) document.getElementById('latency-bar').classList.replace('bg-indigo-500', 'bg-red-500');
        else document.getElementById('latency-bar').classList.replace('bg-red-500', 'bg-indigo-500');

        // Update Chart
        latencyData.push(currentLatency);
        latencyData.shift();
        chartInstance.update();
    }, 2500);

    // Event Ingestion
    setInterval(() => {
        let events = Math.floor(1300 + Math.random() * 200);
        document.getElementById('event-rate').innerText = events.toLocaleString();
        totalEvents += events;
        document.getElementById('total-events').innerText = totalEvents.toLocaleString();
    }, 1000);
}

function initChart() {
    const ctx = document.getElementById('latencyChart').getContext('2d');
    
    // Gradient
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)'); // Indigo 500
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(20).fill(''),
            datasets: [{
                label: 'Latency (ms)',
                data: latencyData,
                borderColor: '#6366f1',
                backgroundColor: gradient,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 500,
                easing: 'linear'
            },
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: {
                    display: true,
                    grid: { color: 'rgba(30, 41, 59, 0.5)' },
                    ticks: { color: '#64748b', maxTicksLimit: 5 },
                    min: 0,
                    max: 200
                }
            }
        }
    });
}

// --- MODULE B: Fleet Management ---
function initBots() {
    const stored = localStorage.getItem('moniopen_bots');
    if (stored) {
        bots = JSON.parse(stored);
    } else {
        bots = [...defaultBots];
        localStorage.setItem('moniopen_bots', JSON.stringify(bots));
    }
}

function renderFleetTable() {
    const tbody = document.getElementById('fleet-table-body');
    tbody.innerHTML = '';
    
    let activeCount = 0;
    
    bots.forEach(bot => {
        if(bot.status !== 'Offline' && bot.status !== 'CRITICAL') activeCount++;
        
        let statusClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        let statusDot = 'bg-emerald-500';
        if(bot.status === 'Warning') { statusClass = 'bg-orange-500/20 text-orange-400 border-orange-500/30'; statusDot = 'bg-orange-500'; }
        if(bot.status === 'CRITICAL') { statusClass = 'bg-red-500/20 text-red-400 border-red-500/30 font-bold animate-pulse'; statusDot = 'bg-red-500 animate-ping'; }

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/30 cursor-pointer transition-colors group';
        tr.onclick = () => openBotDrawer(bot.id);
        
        tr.innerHTML = `
            <td class="px-5 py-4 border-b border-border">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center group-hover:border-indigo-500/50 transition-colors">
                        <i data-lucide="cpu" class="w-4 h-4 text-gray-400 group-hover:text-indigo-400"></i>
                    </div>
                    <span class="font-medium text-gray-200">${bot.id}</span>
                </div>
            </td>
            <td class="px-5 py-4 border-b border-border">
                <span class="font-mono text-xs text-gray-400">${bot.runtime}</span>
            </td>
            <td class="px-5 py-4 border-b border-border">
                <div class="flex flex-col gap-1">
                    <span class="text-xs font-mono text-gray-300">Lat: ${bot.latency}ms</span>
                    <span class="text-xs font-mono text-gray-500">RAM: ${bot.ram}MB</span>
                </div>
            </td>
            <td class="px-5 py-4 border-b border-border">
                <span class="px-3 py-1 rounded-full text-xs border flex items-center gap-2 w-max ${statusClass}">
                    <span class="w-2 h-2 rounded-full ${statusDot}"></span>
                    ${bot.status}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('cluster-count').innerText = `${activeCount}/${bots.length} Active`;
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
        document.getElementById('bot-drawer').classList.remove('translate-x-full');
    }, 10);
}

function closeAllOverlays() {
    document.getElementById('bot-drawer').classList.add('translate-x-full');
    document.getElementById('register-modal').classList.add('opacity-0');
    document.getElementById('claude-modal').classList.add('opacity-0');
    document.getElementById('backdrop').classList.add('opacity-0');
    
    setTimeout(() => {
        document.getElementById('register-modal').classList.add('hidden');
        document.getElementById('claude-modal').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
        
        // Reset modal states
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('register-success').classList.add('hidden', 'flex');
        
    }, 300);
}

// --- MODULE C: Register Bot ---
function openNewBotModal() {
    document.getElementById('backdrop').classList.remove('hidden');
    document.getElementById('register-modal').classList.remove('hidden');
    document.getElementById('register-modal').classList.add('flex');
    
    document.getElementById('new-bot-name').value = '';
    
    setTimeout(() => {
        document.getElementById('backdrop').classList.remove('opacity-0');
        document.getElementById('register-modal').classList.remove('opacity-0');
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

function generateBot() {
    const nameInput = document.getElementById('new-bot-name').value.trim();
    if(!nameInput) return showToast('Error', 'Please enter a bot name', 'error');
    
    const lang = document.getElementById('new-bot-lang').value;
    
    // Generate key
    const chars = 'abcdef0123456789';
    let key = 'mop_live_';
    for(let i=0; i<28; i++) key += chars[Math.floor(Math.random() * chars.length)];
    
    // Add to bots
    const newBot = {
        id: nameInput,
        runtime: lang,
        latency: 0,
        ram: 0,
        status: 'Waiting...',
        pid: Math.floor(10000 + Math.random() * 80000),
        uptime: '0m'
    };
    
    bots.push(newBot);
    localStorage.setItem('moniopen_bots', JSON.stringify(bots));
    renderFleetTable();
    
    // Update UI to success step
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('register-success').classList.remove('hidden');
    document.getElementById('register-success').classList.add('flex');
    document.getElementById('generated-api-key').innerText = key;
    
    showToast('Success', 'Bot registered successfully');
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
        if(isStreamPaused) return;
        
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
        <span class="${prefixColor} font-bold">[${level}]</span> 
        <span class="text-gray-400">&lt;${botId}&gt;</span>: ${msg}
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
    document.getElementById('claude-modal').classList.remove('hidden');
    document.getElementById('claude-modal').classList.add('flex');
    
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
                t.classList.remove('active', 'text-indigo-400', 'bg-indigo-500/10');
                t.classList.add('text-gray-400');
            });
            contents.forEach(c => c.classList.add('hidden'));
            
            tab.classList.remove('text-gray-400');
            tab.classList.add('active', 'text-indigo-400', 'bg-indigo-500/10');
            
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
