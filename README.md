# MoniOpen v3.5 Enterprise 🚀

![Version](https://img.shields.io/badge/version-3.5.0-blue)
![Security](https://img.shields.io/badge/security-strict-green)
![Uptime](https://img.shields.io/badge/uptime-99.99%25-brightgreen)

## Arquitectura (Puerto 3001)

```ascii
[ Cliente Web (app.js + style.css) ]
        |
        | (HTTP GET/POST /api/v1/*)
        v
[ API Gateway (server.js - Node.js) ] <--- Rate Limiting & Helmet
        |
        +-- /system (Métricas de OS nativas)
        +-- /heartbeat (Validación estricta Zod)
        +-- /diagnostics (Simulación Claude 3.5)
        |
[ Workers Autorizados (Python/Go) ]
  - roblox-tracker
  - bot-discord
  - errorcito-viales
```

## Características
- **Seguro por Defecto**: Integración completa de cabeceras de seguridad, límites de tasa y validación de esquemas (Zod).
- **Directiva de Purga Activa**: Sistema inmunológico que purga automáticamente workers no autorizados (ej. `BOTSTICKERS`).
- **Diseño de Clase Mundial**: Tema Obsidian Dark, renderizado avanzado en Canvas (ECG), y micro-interacciones.

## Instrucciones de Despliegue
1. `npm install`
2. Copiar `.env.example` a `.env`
3. `npm start` (o usar PM2).