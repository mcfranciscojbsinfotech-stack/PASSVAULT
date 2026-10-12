import crypto from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './prisma.js';
import { SESSION_CONSTANTS } from '@passvault/shared';
import { CONFIG } from '../config/env.js';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export async function createSession(userId: string, request: FastifyRequest, reply: FastifyReply) {
  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);

  const ip = (request.headers['x-forwarded-for'] as string) || request.ip || '127.0.0.1';
  const userAgent = request.headers['user-agent'] || 'Unknown';

  const expiresAt = new Date(Date.now() + SESSION_CONSTANTS.SESSION_MAX_AGE_SECONDS * 1000);

  const session = await prisma.authenticationSession.create({
    data: {
      userId,
      sessionTokenHash: tokenHash,
      ipAddress: ip.split(',')[0].trim(),
      userAgent: userAgent.slice(0, 255),
      expiresAt,
    },
  });

  // Set HTTP-only session cookie
  reply.setCookie(SESSION_CONSTANTS.SESSION_COOKIE_NAME, rawToken, {
    path: '/',
    httpOnly: true,
    secure: CONFIG.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: CONFIG.COOKIE_DOMAIN,
    maxAge: SESSION_CONSTANTS.SESSION_MAX_AGE_SECONDS,
  });

  return { session, rawToken };
}

export async function destroySession(request: FastifyRequest, reply: FastifyReply) {
  const token =
    request.cookies[SESSION_CONSTANTS.SESSION_COOKIE_NAME] ||
    (request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.slice(7)
      : null);

  if (token) {
    const tokenHash = hashToken(token);
    await prisma.authenticationSession.updateMany({
      where: { sessionTokenHash: tokenHash },
      data: { isRevoked: true },
    });
  }

  reply.clearCookie(SESSION_CONSTANTS.SESSION_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    secure: CONFIG.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}
