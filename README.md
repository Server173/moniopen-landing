# MoniOpen Production Suite V4.0

![Status](https://img.shields.io/badge/Status-Active-success)
![Version](https://img.shields.io/badge/Version-4.0-blue)
![Platform](https://img.shields.io/badge/Platform-Node.js-green)

Consola de monitoreo de telemetría y resolución autónoma de incidentes para flotas de bots y microservicios.

## 🚀 Arquitectura
```text
[Cliente SDK (Python/Node)] --> [API Node.js :3001] <-- [Dashboard UI]
        |                             |
  Heartbeats/Logs               SysMetrics / Websocket
```

## 🛠️ Instalación y Uso

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Ejecutar el servidor:
   ```bash
   npm start
   ```
   El servidor se ejecutará en el puerto 3001 (fallback a 3005).

3. Iniciar el simulador de agentes (Opcional):
   ```bash
   python3 agent.py
   ```

## 🖥️ Flota Autorizada
* `roblox-tracker` (Runtimes Go/Node)
* `bot-discord` (Runtime Python)
* `errorcito-viales` (Runtime Python Worker)