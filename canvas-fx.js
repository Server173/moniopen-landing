/**
 * MoniOpen - Next-Gen $10k Interactive Telemetry Canvas & Micro-Interactions
 * Inspired by Linear, Vercel, and Emil Kowalski interactive physics.
 */

(function () {
    'use strict';

    // ============================================================
    // 1. NEURAL TELEMETRY MESH CANVAS
    // ============================================================
    class TelemetryMesh {
        constructor() {
            this.canvas = document.getElementById('telemetry-mesh-canvas');
            if (!this.canvas) {
                this.canvas = document.createElement('canvas');
                this.canvas.id = 'telemetry-mesh-canvas';
                this.canvas.className = 'fixed inset-0 pointer-events-none z-0';
                this.canvas.setAttribute('aria-hidden', 'true');
                document.body.prepend(this.canvas);
            }
            this.ctx = this.canvas.getContext('2d');
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.nodes = [];
            this.pulses = [];
            this.mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999, active: false };
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.isActive = !document.hidden;

            this.colors = [
                { r: 99, g: 102, b: 241 },   // Indigo (MoniOpen brand)
                { r: 6, g: 182, b: 212 },    // Cyan (Telemetry)
                { r: 16, g: 185, b: 129 },   // Emerald (Healthy metrics)
                { r: 139, g: 92, b: 246 }    // Violet (Cluster)
            ];

            this.init();
        }

        init() {
            this.resize();
            this.createNodes();
            this.bindEvents();
            this.animate();
        }

        resize() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width * this.dpr;
            this.canvas.height = this.height * this.dpr;
            this.ctx.scale(this.dpr, this.dpr);
        }

        createNodes() {
            const count = Math.min(Math.floor((this.width * this.height) / 14000), 85);
            this.nodes = [];

            for (let i = 0; i < count; i++) {
                const color = this.colors[Math.floor(Math.random() * this.colors.length)];
                const isBeacon = Math.random() < 0.15;
                this.nodes.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    vx: (Math.random() - 0.5) * 0.45,
                    vy: (Math.random() - 0.5) * 0.45,
                    radius: isBeacon ? (Math.random() * 1.5 + 2.5) : (Math.random() * 1.2 + 1.2),
                    baseAlpha: Math.random() * 0.45 + 0.25,
                    color: color,
                    isBeacon: isBeacon,
                    pulsePhase: Math.random() * Math.PI * 2,
                    pulseSpeed: Math.random() * 0.03 + 0.015
                });
            }
        }

        bindEvents() {
            window.addEventListener('resize', () => {
                this.resize();
                this.createNodes();
            }, { passive: true });

            window.addEventListener('mousemove', (e) => {
                this.mouse.targetX = e.clientX;
                this.mouse.targetY = e.clientY;
                this.mouse.active = true;
            }, { passive: true });

            window.addEventListener('mouseleave', () => {
                this.mouse.active = false;
                this.mouse.targetX = -9999;
                this.mouse.targetY = -9999;
            });

            window.addEventListener('click', (e) => {
                this.createSonarPulse(e.clientX, e.clientY);
            });

            document.addEventListener('visibilitychange', () => {
                this.isActive = !document.hidden;
            });
        }

        createSonarPulse(x, y) {
            this.pulses.push({
                x, y,
                radius: 5,
                maxRadius: Math.min(this.width, this.height) * 0.45,
                alpha: 0.7,
                speed: 6.5
            });
        }

        animate() {
            if (this.isActive) {
                this.ctx.clearRect(0, 0, this.width, this.height);

                // Smooth mouse interpolation (spring feel)
                this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.12;
                this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.12;

                // Draw Sonar Waves
                this.drawPulses();

                // Connect nodes with dynamic mesh lines
                this.drawMesh();

                // Update & draw each node
                this.drawNodes();
            }

            requestAnimationFrame(() => this.animate());
        }

        drawPulses() {
            for (let i = this.pulses.length - 1; i >= 0; i--) {
                const p = this.pulses[i];
                p.radius += p.speed;
                p.alpha *= 0.96;

                if (p.alpha <= 0.01 || p.radius >= p.maxRadius) {
                    this.pulses.splice(i, 1);
                    continue;
                }

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(99, 102, 241, ${p.alpha * 0.4})`;
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
            }
        }

        drawMesh() {
            const maxDistSq = 135 * 135;
            const mouseDistSq = 160 * 160;
            const nLen = this.nodes.length;

            for (let i = 0; i < nLen; i++) {
                const a = this.nodes[i];

                // Connection to Mouse Cursor
                if (this.mouse.active) {
                    const mdx = a.x - this.mouse.x;
                    const mdy = a.y - this.mouse.y;
                    const mDistSq = mdx * mdx + mdy * mdy;

                    if (mDistSq < mouseDistSq) {
                        const mRatio = 1 - (mDistSq / mouseDistSq);
                        this.ctx.beginPath();
                        this.ctx.moveTo(a.x, a.y);
                        this.ctx.lineTo(this.mouse.x, this.mouse.y);
                        this.ctx.strokeStyle = `rgba(${a.color.r}, ${a.color.g}, ${a.color.b}, ${mRatio * 0.45})`;
                        this.ctx.lineWidth = mRatio * 1.6;
                        this.ctx.stroke();

                        // Gentle magnetic attraction
                        a.vx += (this.mouse.x - a.x) * 0.0003;
                        a.vy += (this.mouse.y - a.y) * 0.0003;
                    }
                }

                // Node-to-node links
                for (let j = i + 1; j < nLen; j++) {
                    const b = this.nodes[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < maxDistSq) {
                        const ratio = 1 - (distSq / maxDistSq);
                        const alpha = ratio * 0.18;

                        this.ctx.beginPath();
                        this.ctx.moveTo(a.x, a.y);
                        this.ctx.lineTo(b.x, b.y);
                        this.ctx.strokeStyle = `rgba(${a.color.r}, ${a.color.g}, ${a.color.b}, ${alpha})`;
                        this.ctx.lineWidth = ratio * 0.9;
                        this.ctx.stroke();
                    }
                }
            }
        }

        drawNodes() {
            for (let i = 0; i < this.nodes.length; i++) {
                const node = this.nodes[i];

                // Move node
                node.x += node.vx;
                node.y += node.vy;

                // Friction
                node.vx *= 0.99;
                node.vy *= 0.99;

                // Gentle drift
                node.pulsePhase += node.pulseSpeed;

                // Boundary bounce with soft wrap
                if (node.x < -20) node.x = this.width + 20;
                else if (node.x > this.width + 20) node.x = -20;
                if (node.y < -20) node.y = this.height + 20;
                else if (node.y > this.height + 20) node.y = -20;

                const dynamicAlpha = node.baseAlpha + Math.sin(node.pulsePhase) * 0.15;

                // Outer Glow for Beacons
                if (node.isBeacon) {
                    const glowRadius = node.radius * (2.8 + Math.sin(node.pulsePhase) * 0.8);
                    const grad = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
                    grad.addColorStop(0, `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, ${dynamicAlpha * 0.6})`);
                    grad.addColorStop(1, `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, 0)`);

                    this.ctx.beginPath();
                    this.ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
                    this.ctx.fillStyle = grad;
                    this.ctx.fill();
                }

                // Core Node
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, ${dynamicAlpha})`;
                this.ctx.fill();
            }
        }
    }

    // ============================================================
    // 2. 3D TILT & SPECULAR SPOTLIGHT CARDS (LINEAR / VERCEL STYLE)
    // ============================================================
    class TiltSpotlight {
        constructor() {
            this.cards = [];
            this.init();
        }

        init() {
            // Target all cards and interactive containers
            const elements = document.querySelectorAll('.glass-card, .metric-card, #overview .grid > div');
            elements.forEach(el => this.bindCard(el));

            // Observe dynamic dom additions
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((m) => {
                    m.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (node.classList && (node.classList.contains('glass-card') || node.classList.contains('metric-card'))) {
                                this.bindCard(node);
                            }
                            const innerCards = node.querySelectorAll ? node.querySelectorAll('.glass-card, .metric-card') : [];
                            innerCards.forEach(c => this.bindCard(c));
                        }
                    });
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        bindCard(card) {
            if (card.__tiltBound) return;
            card.__tiltBound = true;

            card.style.transformStyle = 'preserve-3d';
            card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)';

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Update CSS variables for radial spotlight gradient
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);

                // 3D subtle tilt calculation (max 4.5 degrees for elite subtlety)
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -4.5;
                const rotateY = ((x - centerX) / centerX) * 4.5;

                card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`;
            }, { passive: true });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            });
        }
    }

    // ============================================================
    // 3. SMOOTH NUMBER ROLLER (HIGH-END DATA TICKER)
    // ============================================================
    window.animateNumberTicker = function (element, start, end, duration = 800, prefix = '', suffix = '') {
        if (!element) return;
        const startTime = performance.now();

        function update(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            // Smooth easeOutExpo
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = Math.floor(start + (end - start) * ease);
            element.textContent = `${prefix}${current.toLocaleString()}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    };

    // ============================================================
    // BOOTSTRAP FX ON DOM READY
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new TelemetryMesh();
            new TiltSpotlight();
        });
    } else {
        new TelemetryMesh();
        new TiltSpotlight();
    }
})();
