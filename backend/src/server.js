import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { config } from './config/env.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/api.js';

const app = express();

const sessionCookie = 'sif_session';
const sessions = new Map();

app.use((req, res, next) => {
  const cookies = Object.fromEntries(
    (req.headers.cookie || '').split(';').filter(Boolean).map(cookie => {
      const separator = cookie.indexOf('=');
      return [cookie.slice(0, separator).trim(), decodeURIComponent(cookie.slice(separator + 1).trim())];
    })
  );
  let sessionId = cookies[sessionCookie];
  if (!sessionId || !sessions.has(sessionId)) {
    sessionId = crypto.randomUUID();
    sessions.set(sessionId, { createdAt: new Date().toISOString() });
    res.setHeader('Set-Cookie', `${sessionCookie}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
  }
  req.sessionId = sessionId;
  req.session = sessions.get(sessionId);
  next();
});

// Middlewares
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role']
}));
app.use(express.json());
app.use(requestLogger);

// Mount API routes
app.use('/api', apiRouter);

app.get('/api/session', (req, res) => {
  res.json({ authenticated: true, sessionId: req.sessionId });
});

// Fallback Route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`[SIF-Sentinel Backend API] running on http://localhost:${config.port}`);
  console.log(`[Environment]: ${config.nodeEnv}`);
});
