import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { CONFIG } from './config/env.js';
import { authRoutes } from './modules/authentication/routes.js';
import { mfaRoutes } from './modules/mfa/routes.js';
import { sessionRoutes } from './modules/sessions/routes.js';
import { syncRoutes } from './modules/synchronization/routes.js';
import { adminRoutes } from './modules/administration/routes.js';
import { prisma } from './utils/prisma.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: CONFIG.NODE_ENV === 'test' ? false : true,
    trustProxy: true,
  });

  // CORS configuration
  app.register(cors, {
    origin: [CONFIG.APP_BASE_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Cookie plugin
  app.register(cookie, {
    secret: CONFIG.SESSION_SECRET,
    parseOptions: {},
  });

  // Rate limiting for brute-force defense
  app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  // Global Health check endpoint
  app.get('/api/health', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', database: 'connected', timestamp: new Date().toISOString() };
    } catch (err) {
      return { status: 'degraded', database: 'disconnected', error: String(err) };
    }
  });

  // Register API modules
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(mfaRoutes, { prefix: '/api/mfa' });
  app.register(sessionRoutes, { prefix: '/api/sessions' });
  app.register(syncRoutes, { prefix: '/api/sync' });
  app.register(adminRoutes, { prefix: '/api/admin' });

  return app;
}
