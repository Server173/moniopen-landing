// --- Particles Canvas ---
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];
let mouse = { x: null, y: null };

function resize() {
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;
    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resize);
resize();

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = 1.5;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.fill();
    }
}

for (let i = 0; i < 60; i++) {
    particles.push(new Particle());
}

function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        // Connect particles
        for (let j = i; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 100) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(6, 182, 212, ${1 - dist/100})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }

        // Mouse interaction
        if (mouse.x != null) {
            const dx = particles[i].x - mouse.x;
            const dy = particles[i].y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                particles[i].x -= dx * 0.01;
                particles[i].y -= dy * 0.01;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = `rgba(94, 106, 210, ${0.5 - dist/300})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateParticles);
}
animateParticles();

// --- ECG Canvas ---
const ecgCanvas = document.getElementById('ecg-canvas');
const ecgCtx = ecgCanvas.getContext('2d');
let ecgWidth, ecgHeight;
let ecgData = [];
const ecgMaxDataPoints = 100;
let latencyDisplay = document.getElementById('latency-display');

function resizeEcg() {
    ecgWidth = ecgCanvas.parentElement.clientWidth;
    ecgHeight = ecgCanvas.parentElement.clientHeight;
    ecgCanvas.width = ecgWidth;
    ecgCanvas.height = ecgHeight;
}
window.addEventListener('resize', resizeEcg);
resizeEcg();

for(let i=0; i<ecgMaxDataPoints; i++) ecgData.push(42);

function drawEcg() {
    ecgCtx.clearRect(0, 0, ecgWidth, ecgHeight);
    
    // Grid
    ecgCtx.strokeStyle = 'rgba(255,255,255,0.05)';
    ecgCtx.lineWidth = 1;
    for(let i=0; i<ecgWidth; i+=20) {
        ecgCtx.beginPath(); ecgCtx.moveTo(i,0); ecgCtx.lineTo(i,ecgHeight); ecgCtx.stroke();
    }
    for(let i=0; i<ecgHeight; i+=20) {
        ecgCtx.beginPath(); ecgCtx.moveTo(0,i); ecgCtx.lineTo(ecgWidth,i); ecgCtx.stroke();
    }

    ecgCtx.beginPath();
    const sliceWidth = ecgWidth / (ecgMaxDataPoints - 1);
    let x = 0;
    for(let i=0; i<ecgMaxDataPoints; i++) {
        const y = ecgHeight - (ecgData[i] / 100) * ecgHeight;
        if(i === 0) ecgCtx.moveTo(x, y);
        else ecgCtx.lineTo(x, y);
        x += sliceWidth;
    }
    
    ecgCtx.strokeStyle = '#06b6d4';
    ecgCtx.lineWidth = 2;
    ecgCtx.stroke();

    // Fill gradient
    ecgCtx.lineTo(ecgWidth, ecgHeight);
    ecgCtx.lineTo(0, ecgHeight);
    ecgCtx.closePath();
    const gradient = ecgCtx.createLinearGradient(0, 0, 0, ecgHeight);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ecgCtx.fillStyle = gradient;
    ecgCtx.fill();
}

setInterval(() => {
    // Generate jitter
    const isJitter = Math.random() > 0.8;
    const baseVal = 38.4 + Math.random() * 7.8; // ~38.4 to 46.2
    const jitter = isJitter ? (Math.random() > 0.5 ? 20 : -10) : 0;
    let newVal = baseVal + jitter;
    if(newVal > 90) newVal = 90;
    
    ecgData.push(newVal);
    ecgData.shift();
    drawEcg();
    if(latencyDisplay) latencyDisplay.innerText = newVal.toFixed(1) + 'ms';
}, 100); // Fast update for visual appeal

// --- Uptime Strip ---
const strip = document.getElementById('uptime-strip');
if(strip) {
    for(let i=0; i<30; i++) {
        const bar = document.createElement('div');
        bar.className = 'uptime-bar';
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const isOutage = Math.random() > 0.95;
        if(isOutage) {
            bar.setAttribute('data-status', 'outage');
            bar.style.height = (Math.random() * 40 + 20) + '%';
            bar.setAttribute('data-tooltip', `${date.toLocaleDateString()}: 98.2% (Degraded)`);
        } else {
            bar.style.height = (Math.random() * 20 + 80) + '%';
            bar.setAttribute('data-tooltip', `${date.toLocaleDateString()}: 100% (Healthy)`);
        }
        strip.appendChild(bar);
    }
}

// --- Drawer & Modal Logic ---
const backdrop = document.getElementById('backdrop');
const drawer = document.getElementById('bot-drawer');
const claudeModal = document.getElementById('claude-modal');

function inspectBot(botName) {
    document.getElementById('drawer-title').innerText = `Inspect: ${botName}`;
    backdrop.classList.add('visible');
    drawer.classList.add('open');
}

function closeModals() {
    backdrop.classList.remove('visible');
    drawer.classList.remove('open');
    claudeModal.classList.remove('open');
}

// --- CLI Logic ---
const cliInput = document.getElementById('cli-input');
const terminalOutput = document.getElementById('terminal-output');
const commandHistory = [];
let historyIndex = -1;

function printLog(msg, type = 'info') {
    const div = document.createElement('div');
    div.className = `log-line log-${type}`;
    div.innerText = msg;
    if(terminalOutput) {
        terminalOutput.appendChild(div);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
}

// Simular logs en streaming
setInterval(() => {
    if(Math.random() > 0.7) {
        const bots = ['roblox-tracker', 'bot-discord', 'errorcito-viales'];
        const bot = bots[Math.floor(Math.random() * bots.length)];
        printLog(`[${new Date().toISOString().split('T')[1].slice(0,8)}] INFO: ${bot} heartbeat received OK`, 'info');
    }
}, 3000);

if(cliInput) {
    cliInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = cliInput.value.trim();
            if (cmd) {
                commandHistory.push(cmd);
                historyIndex = commandHistory.length;
                printLog(`mop@edge-cluster:~$ ${cmd}`, 'info');
                executeCommand(cmd);
            }
            cliInput.value = '';
        } else if (e.key === 'ArrowUp') {
            if (historyIndex > 0) {
                historyIndex--;
                cliInput.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                cliInput.value = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                cliInput.value = '';
            }
        }
    });
}

function executeCommand(cmd) {
    const parts = cmd.toLowerCase().split(' ');
    switch (parts[0]) {
        case 'help':
            printLog('Available commands:', 'info');
            printLog('  help       - Show this help message', 'info');
            printLog('  status     - Show cluster health', 'info');
            printLog('  ping       - Test network latency', 'info');
            printLog('  diagnose   - Trigger Claude diagnosis', 'info');
            printLog('  workers    - List active fleet', 'info');
            printLog('  clear      - Clear terminal', 'info');
            break;
        case 'status':
            printLog('Cluster Status: HEALTHY', 'success');
            printLog('Ports: 3001 (API), 22 (SSH)', 'info');
            break;
        case 'ping':
            printLog('Pinging edge-cluster-01 (10.0.0.1)...', 'info');
            setTimeout(() => printLog('Reply from 10.0.0.1: time=42ms', 'success'), 500);
            break;
        case 'diagnose':
            triggerClaudeDiagnosis();
            break;
        case 'workers':
            printLog('Active Workers:', 'info');
            printLog('- roblox-tracker (PID: 48291) [Running]', 'success');
            printLog('- bot-discord (PID: 48292) [Running]', 'success');
            printLog('- errorcito-viales (PID: 48293) [Running]', 'success');
            break;
        case 'clear':
            if(terminalOutput) terminalOutput.innerHTML = '';
            break;
        default:
            printLog(`Command not found: ${parts[0]}`, 'error');
    }
}

// --- Claude Diagnosis Flow ---
function triggerClaudeDiagnosis() {
    // 1. Simular incidente en roblox-tracker
    const dot = document.getElementById('dot-roblox-tracker');
    if(dot) dot.classList.add('critical');
    printLog('CRITICAL [roblox-tracker]: HTTP 429 Too Many Requests detected. Rate limit exceeded.', 'error');
    
    // 2. Abrir modal
    setTimeout(() => {
        backdrop.classList.add('visible');
        claudeModal.classList.add('open');
        
        // 3. Animar contador de tokens
        let count = 0;
        const counterEl = document.getElementById('token-counter');
        const interval = setInterval(() => {
            count += Math.floor(Math.random() * 50);
            if(count > 1432) {
                count = 1432;
                clearInterval(interval);
            }
            if(counterEl) counterEl.innerText = count.toLocaleString();
        }, 30);
    }, 1500);
}

function applyPatch() {
    closeModals();
    printLog('Applying AI patch to roblox-tracker...', 'warn');
    setTimeout(() => {
        const dot = document.getElementById('dot-roblox-tracker');
        if(dot) dot.classList.remove('critical');
        printLog('SUCCESS: Patch applied. roblox-tracker recovered to Healthy state.', 'success');
    }, 1500);
}

// --- SDK Tabs Logic ---
const tabs = document.querySelectorAll('.sdk-tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.sdk-content').forEach(c => c.classList.remove('active'));
        document.getElementById(tab.getAttribute('data-target')).classList.add('active');
    });
});

function copySdkCode() {
    const activeTab = document.querySelector('.sdk-content.active code');
    if(!activeTab) return;
    navigator.clipboard.writeText(activeTab.innerText).then(() => {
        const btn = document.querySelector('.btn-copy');
        const originalText = btn.innerText;
        btn.innerText = '¡Copiado!';
        btn.style.color = 'var(--accent-emerald)';
        btn.style.borderColor = 'var(--accent-emerald)';
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.color = 'var(--text-secondary)';
            btn.style.borderColor = 'var(--border-subtle)';
        }, 2000);
    });
}
