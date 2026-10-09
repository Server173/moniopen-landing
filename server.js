const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const os = require('os');
const path = require('path');
const { z } = require('zod');

const app = express();
const PORT = process.env.PORT || 3001;

// OWASP A02:2025 - Security Misconfiguration (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' }
}));

// Basic middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.', errorId: 'RATE_LIMIT_EXCEEDED' }
});

app.use('/api/', limiter);

// Endpoints

// System Metrics
app.get('/api/v1/system', (req, res) => {
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const cpuLoad = os.loadavg();
  const uptime = os.uptime();

  res.json({
    status: 'healthy',
    metrics: {
      memory: {
        free: freeMem,
        total: totalMem,
        usedPercentage: ((totalMem - freeMem) / totalMem * 100).toFixed(2)
      },
      cpuLoad: cpuLoad,
      uptime: uptime
    }
  });
});

// Heartbeat Schema Validation (OWASP A05:2025 - Inyección)
const heartbeatSchema = z.object({
  botId: z.string().min(1).max(100),
  status: z.enum(['online', 'offline', 'error']),
  latency: z.number().nonnegative().optional()
});

app.post('/api/v1/heartbeat', (req, res) => {
  try {
    const validatedData = heartbeatSchema.parse(req.body);
    // In a real application, we would save this to a database
    console.log(`Heartbeat received from ${validatedData.botId}: ${validatedData.status}`);
    res.json({ success: true, message: 'Heartbeat acknowledged' });
  } catch (error) {
    // Manejo de errores seguro: no exponer stack traces
    res.status(400).json({ error: 'Invalid input data', errorId: 'INVALID_INPUT' });
  }
});

// Diagnostics (Simulating Claude 3.5 Sonnet Integration)
app.get('/api/v1/diagnostics', (req, res) => {
  res.json({
    analysis: "Root Cause Analysis: Rate limit exceeded (HTTP 429) detected on standard API gateway. Exponential backoff not implemented in client.",
    diff: `--- a/client.js
+++ b/client.js
@@ -10,3 +10,7 @@
-  fetch(url);
+  fetch(url).then(res => {
+    if(res.status === 429) {
+      setTimeout(() => fetch(url), 5000);
+    }
+  });`
  });
});

// Catch-all 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', errorId: 'NOT_FOUND' });
});

// Manejo de Errores Global Seguro (OWASP)
app.use((err, req, res, next) => {
  console.error(err.stack); // Loguear internamente
  res.status(500).json({ error: 'Internal Server Error', errorId: 'INTERNAL_ERROR' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
