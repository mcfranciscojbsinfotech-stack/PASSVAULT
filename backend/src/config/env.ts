import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  HOST: process.env.HOST || '127.0.0.1',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:4000',
  APP_BASE_URL: process.env.APP_BASE_URL || 'http://localhost:3000',
  SESSION_SECRET: process.env.SESSION_SECRET || 'passvault-dev-session-super-secret-key-at-least-32-chars-long',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FIRST_ADMIN_EMAIL: process.env.FIRST_ADMIN_EMAIL || 'admin@passvault.local',
  FIRST_ADMIN_PASSWORD: process.env.FIRST_ADMIN_PASSWORD || 'PassVaultAdmin123!',
  EMAIL_PROVIDER_API_KEY: process.env.EMAIL_PROVIDER_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@passvault.local',
};
