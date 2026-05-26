import dotenv from 'dotenv';
dotenv.config();

import { validateEnv } from './utils/validateEnv';
validateEnv();

import express, { Application } from 'express';
    import cors from 'cors';
    import helmet from 'helmet';
    import rateLimit from 'express-rate-limit';
    import logger from './utils/logger';
    import receiptsRouter from './functions/receipts';
    import analyticsRouter from './functions/analytics';
    import authRouter from './functions/auth';
    import { setupSwagger } from './swagger';



    // Crear carpeta de logs si no existe
    import fs from 'fs';
    if (!fs.existsSync('logs')) fs.mkdirSync('logs');

    const app: Application = express();
    const PORT = process.env.PORT || 3000;

    // =============================================
    // MIDDLEWARE GLOBAL
    // =============================================

    // Seguridad HTTP headers
    app.use(helmet());

    // CORS — en producción, leer FRONTEND_URL del entorno
    const allowedOrigins = [
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:3000',
      'http://localhost:19000',
      'http://localhost:5173',   // Vite dev
      'http://localhost:4173',   // Vite preview
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ];
    app.use(cors({
      origin: (origin, callback) => {
        // Permitir peticiones sin origin (como mobile apps o Postman)
        // o si el origen está explícitamente permitido, o si proviene de un despliegue de Vercel (*.vercel.app)
        if (
          !origin || 
          allowedOrigins.includes(origin) || 
          origin.endsWith('.vercel.app') ||
          (origin.includes('.vercel.app') && !origin.includes(' '))
        ) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin no permitido — ${origin}`));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'apikey'],
      credentials: true,
    }));

// Manejar preflight OPTIONS explícitamente para todas las rutas (compatible con Express 5)
app.options('*splat', cors());

    // Rate limiting global
    const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    message: { success: false, error: 'Demasiadas solicitudes, intenta más tarde' },
    standardHeaders: true,
    legacyHeaders: false,
    });
    app.use(globalLimiter);

    // Rate limiting estricto para procesamiento de recibos
    const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 20,
    message: { success: false, error: 'Límite de uploads alcanzado por hora' },
    });

    // Parse JSON
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // =============================================
    // RUTAS
    // =============================================

    // Health check (sin autenticación)
    app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
    });

    app.use((req, _res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});
    // API v1
    const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;
    app.use(`${API_PREFIX}/receipts`, uploadLimiter, receiptsRouter);
    console.log('📋 API_PREFIX:', API_PREFIX);
    app.use(`${API_PREFIX}/analytics`, analyticsRouter);
    app.use(`${API_PREFIX}/auth`, authRouter);

    // REPO-42: Documentación Swagger en /api/docs
    setupSwagger(app);
    
    // Ruta 404
    app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Ruta no encontrada' });
    });

    // Error handler global
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
    });

    // =============================================
    // INICIAR SERVIDOR
    // =============================================
    app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`🚀 ReceiptAI Backend corriendo en http://localhost:${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔗 API: http://localhost:${PORT}${API_PREFIX}`);
  logger.info(`🌐 Red local: http://10.43.79.103:${PORT}`);
  logger.info(`🌎 Entorno: ${process.env.NODE_ENV}`);
});

    export default app;