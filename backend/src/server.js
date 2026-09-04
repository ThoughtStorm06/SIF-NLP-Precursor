import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/api.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow development origins
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role']
}));
app.use(express.json());
app.use(requestLogger);

// Mount API routes
app.use('/api', apiRouter);

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
