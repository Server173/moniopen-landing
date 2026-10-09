# MoniOpen — Open-Source Bot & Service Telemetry Platform

[![Version](https://img.shields.io/badge/version-v1.2--opensource-emerald?style=flat-square)](https://github.com/Server173/moniopen-landing)
[![Powered by](https://img.shields.io/badge/Powered%20by-Claude%203.5%20Sonnet-6366f1?style=flat-square)](https://anthropic.com)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

**MoniOpen** es una plataforma interactiva de observabilidad, ingesta de telemetría en tiempo real y diagnóstico automatizado de causas raíz impulsado por **Claude 3.5 Sonnet** para workers y bots autónomos (Python, Node.js, Go, Rust).

---

## 🚀 Características Principales

1. **Panel de Métricas en Tiempo Real (Telemetry Ticker)**:
   - Monitor de **Uptime 30d** (99.98% con indicador de estabilidad).
   - Medición oscilante de **Latencia Promedio** en tiempo real (38ms - 54ms con jitter dinámico).
   - Contador de **Ingesta de Telemetría** en vivo (~1,420 events/sec con acumulador continuo).
   - Contador dinámico de **Workers / Bots Activos** sincronizado con la flota.
   - **Gráfico de Latencia en Vivo (HTML5 Canvas)** renderizando los últimos 20 pulsos de telemetría con curvas suaves y área sombreada en gradiente.

2. **Flota de Workers Interactiva (Bot Fleet)**:
   - Workers precargados con métricas técnicas realistas:
     - `crawler-node-primary` (Node.js 22 LTS | Latencia: 18ms | RAM: 84MB | Healthy)
     - `discord-event-relay` (Python 3.12 | Latencia: 34ms | RAM: 112MB | Healthy)
     - `roblox-sync-worker` (Go 1.23 | Latencia: 42ms | RAM: 240MB | Warning)
     - `payment-webhook-listener` (Rust 1.80 | Latencia: 9ms | RAM: 32MB | Healthy)
   - **Drawer Lateral de Telemetría Detallada**:
     - Inspección de Process ID (PID), latencia instantánea y tiempo de actividad.
     - Medidor interactivo de consumo de memoria RAM sobre umbral asignado.
     - Variables de entorno sanitizadas en modo seguro.
     - Botones de control operativo: **Pausar/Reanudar Worker** y **Forzar Heartbeat**.

3. **Registro Autónomo de Nuevos Bots**:
   - Generación de token criptográfico seguro `mop_live_[28_hex_chars]`.
   - Renderizado de snippets de código del SDK adaptados al runtime (Python, Node.js, Go, Rust).
   - Botón de copia al portapapeles con retroalimentación inmediata.
   - Persistencia de datos en `localStorage` con inyección dinámica en la tabla sin recargar.

4. **Consola de Logs en Vivo (Live Stream)**:
   - Terminal oscura en tipografía monoespaciada (*JetBrains Mono*).
   - Ingesta continua en segundo plano cada 2 segundos con trazas de operaciones distribuidas.
   - Controles de stream: **Pausar / Reanudar**, **Limpiar Consola**.
   - Filtros por etiquetas: `[TODOS]`, `[INFO]`, `[WARN]`, `[ERROR]`.
   - Búsqueda en tiempo real sobre las trazas.

5. **Simulador de Fallo y Diagnóstico con Claude 3.5 Sonnet**:
   - Flujo de simulación de fallo `HTTP 429 Too Many Requests`.
   - Inyección de traceback de excepción en la consola de logs.
   - Modal interactivo con animación de análisis y síntesis de mitigación.
   - **Reporte Técnico de Claude 3.5 Sonnet**:
     - Causa Raíz: Expiración de cuota de API por falta de retroceso exponencial en `roblox-sync-worker.py:84`.
     - Sugerencia de corrección con Git Diff formateado en rojo/verde implementando Exponential Backoff con Jitter.
     - Botón de recuperación: **Aplicar Parche y Auto-Recuperar**, que restaura el bot a estado `Healthy` y notifica al usuario.

6. **Playground de Documentación y SDK**:
   - Pestañas intercambiables para **Python** (`pip install moniopen`), **Node.js** (`npm install moniopen`) y **cURL**.
   - Snippets copiables con un solo clic.

---

## 🛠️ Tecnologías y Diseño

- **Tailwind CSS v3 (CDN)** con modo oscuro nativo activado.
- **Tipografías**: *Plus Jakarta Sans* para interfaz UI y *JetBrains Mono* para código, métricas y logs.
- **Paleta de Colores**:
  - Fondo: `#090d16`
  - Superficies: `#0f172a`
  - Bordes: `#1e293b`
  - Acentos: Índigo (`#6366f1`) y Púrpura (`#a855f7`)
  - Estados: Emerald (`#10b981`), Ámbar (`#f59e0b`), Rojo (`#ef4444`).
- **Iconografía**: SVGs inline optimizados estilo Lucide.
- **Arquitectura**: Single Page Application (SPA) pura sin dependencias de compilación rotas, lista para despliegue inmediato en Vercel, Netlify o GitHub Pages.

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).