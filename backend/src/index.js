import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';
import dotenv from 'dotenv';

import logger from './utils/logger.js';
import { errorHandler } from './utils/error-handler.js';

// Routes
import risksRouter from './api/routes/risks.js';
import eventsRouter from './api/routes/events.js';
import oemRouter from './api/routes/oem.js';
import dashboardRouter from './api/routes/dashboard.js';
import regionsRouter from './api/routes/regions.js';
import healthRouter from './api/routes/health.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip
  });
  next();
});

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/risks', risksRouter);
app.use('/api/events', eventsRouter);
app.use('/api/oem-exposure', oemRouter);
app.use('/api/dashboard-summary', dashboardRouter);
app.use('/api/regions', regionsRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    code: 'NOT_FOUND'
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    url: `http://localhost:${PORT}`
  });
});

export default app;
