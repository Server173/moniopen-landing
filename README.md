# MoniOpen v2.0 — Plataforma Universal de Observabilidad para Bots & Telemetría Distribuida

[![Version](https://img.shields.io/badge/version-v2.0--core--active-emerald?style=flat-square)](https://github.com/Server173/moniopen-landing)
[![Integration](https://img.shields.io/badge/Anthropic%20Claude%203.5%20Sonnet-Integration-6366f1?style=flat-square)](https://anthropic.com)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/live-moniopen.xyz-purple?style=flat-square)](https://moniopen.xyz)

**MoniOpen v2.0** es una plataforma de observabilidad de alto rendimiento, diseñada con estándares de ingeniería de élite (Linear, Vercel, Supabase), orientada a flotas de bots autónomos, scripts headless y microservicios con autorrecuperación inteligente impulsada por **Claude 3.5 Sonnet**.

---

## 🌟 Arquitectura y Experiencia Visual de Élite

- **Malla de Constelación Interactiva (Hero Canvas)**: Renderiza en tiempo real una red de partículas interconectadas mediante física orgánica y cálculo de distancias euclidianas, reactiva a la posición del cursor del usuario.
- **Paleta Cromática True Dark**: Fondo `#080c14`, superficies de alta densidad `#0d1526`, bordes ultra-sutiles `#1e293b` y acentos en Índigo Eléctrico (`#6366f1`), Violeta Neón (`#a855f7`) y Esmeralda (`#10b981`).
- **Tipografía de Doble Capa**: *Plus Jakarta Sans* para jerarquía editorial y *JetBrains Mono* para métricas numéricas, tokens criptográficos, PIDs y trazas de consola.

---

## 🚀 Módulos y Capacidades del Sistema

### 1. Panel de Control de Telemetría Dinámica
- **Global Cluster Uptime**: Monitor 99.98% con histograma interactivo de los últimos 30 días.
- **Latencia de Telemetría**: Ticker oscilante cada 2.5s (41.2ms ± 1.8ms) con cálculo de jitter y percentil p95.
- **Tasa de Eventos en Tiempo Real**: Contador continuo simulando ~1,450 eventos/segundo con acumulador total en vivo.
- **Workers Conectados**: Conteo sincronizado dinámicamente con la flota.
- **Monitor de Pulso de Red en Vivo (ECG de Latencia)**: Canvas dedicado para trazar ondas continuas de latencia y pings de nodos perimetrales con degradado animado.

### 2. Matriz de Servicios y Workers Conectados (Bot Fleet)
- Flota precargada con microservicios representativos:
  - `worker-pipeline-master` (Go 1.23 | Latencia: 14ms | RAM: 64MB | Healthy)
  - `discord-event-stream` (Node.js 22 | Latencia: 28ms | RAM: 98MB | Healthy)
  - `async-scraper-cluster` (Python 3.12 | Latencia: 46ms | RAM: 180MB | Warning)
  - `queue-telemetry-relay` (Rust 1.80 | Latencia: 8ms | RAM: 24MB | Healthy)
- **Drawer Lateral Deslizante**: Muestra telemetría en vivo, Process ID, medidor de memoria RAM, variables de entorno sanitizadas en modo seguro y controles para pausar/reanudar y forzar heartbeats inmediatos.

### 3. Consola de Comandos Interactiva (CLI Terminal v2)
- Terminal integrada con prompt funcional (`moniopen@cluster-v2:~$`):
  - `help`: Lista todos los comandos disponibles.
  - `status`: Muestra métricas generales del clúster y estado de Claude AI.
  - `ping`: Mide latencia con los nodos perimetrales globales.
  - `diagnose`: Dispara el análisis autónomo de Claude AI.
  - `workers`: Desglosa los workers conectados y su latencia.
  - `clear`: Limpia el búfer de la consola.
- Ingesta continua de logs en segundo plano con filtros rápidos por nivel (`[TODOS]`, `[INFO]`, `[WARN]`, `[ERROR]`) y buscador en tiempo real.

### 4. Motor de Diagnóstico Claude 3.5 Sonnet
- **Simulador de Fallo Crítico**: Inyecta una excepción `HTTP 429 RateLimitExceeded / Memory Leak` en `async-scraper-cluster`.
- Modal de diagnóstico con escaneo en tiempo real y contador de consumo de tokens.
- **Reporte Técnico con Git Diff**:
  - Diagnóstico de causa raíz (análisis del bucle de concurrencia y saturación de API).
  - Parche de mitigación generado con sintaxis coloreada (- en rojo, + en verde) implementando Exponential Backoff con Full Jitter.
  - Botón **"Aplicar Parche y Recuperar"** que restablece inmediatamente el worker a estado *Healthy*.

### 5. Provisionamiento de Workers & API Keys
- Generación de credenciales seguras con tokens con prefijo `mop_live_[28_hex_chars]`.
- Generación reactiva de snippets del SDK según el lenguaje (Go, Node.js, Python, Rust).
- Persistencia total en `localStorage` e integración inmediata en la matriz de servicios.

### 6. Playground de SDK
- Snippets listos para producción para Python, Node.js y cURL con botones de copiado rápido al portapapeles.

---

## 🛠️ Tecnologías

- **HTML5 Canvas**: Malla de partículas reactiva y ECG de telemetría sin librerías externas.
- **Tailwind CSS v3 (CDN)**: Modo oscuro nativo configurado.
- **Vanilla JavaScript (ES6+)**: Estado desacoplado y rendimiento nativo a 60 FPS.
- **Google Fonts**: *Plus Jakarta Sans* & *JetBrains Mono*.

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).