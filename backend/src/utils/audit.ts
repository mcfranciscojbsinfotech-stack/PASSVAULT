import { FastifyRequest } from 'fastify';
import { prisma } from './prisma.js';
import { AuditEventType } from '@passvault/shared';

export interface AuditLogOptions {
  eventType: AuditEventType;
  status: 'SUCCESS' | 'FAILURE';
  userId?: string | null;
  actorEmail?: string | null;
  details?: Record<string, unknown>;
  request?: FastifyRequest;
}

export async function logAuditEvent(options: AuditLogOptions): Promise<void> {
  const { eventType, status, userId, actorEmail, details, request } = options;

  let ipAddress: string | null = null;
  let userAgent: string | null = null;

  if (request) {
    const rawIp = (request.headers['x-forwarded-for'] as string) || request.ip;
    ipAddress = rawIp ? rawIp.split(',')[0].trim() : null;
    userAgent = (request.headers['user-agent'] as string) || null;
  }

  // Sanitize details: never persist any secret/plaintext credentials
  const sanitizedDetails = details ? { ...details } : undefined;
  if (sanitizedDetails) {
    delete sanitizedDetails['password'];
    delete sanitizedDetails['passwordHash'];
    delete sanitizedDetails['recoveryCode'];
    delete sanitizedDetails['secret'];
    delete sanitizedDetails['token'];
    delete sanitizedDetails['rawToken'];
    delete sanitizedDetails['plainText'];
  }

  try {
    await prisma.auditEvent.create({
      data: {
        eventType,
        status,
        userId: userId ?? null,
        actorEmail: actorEmail ?? null,
        ipAddress,
        userAgent: userAgent ? userAgent.slice(0, 255) : null,
        detailsJson: sanitizedDetails ? JSON.stringify(sanitizedDetails) : null,
      },
    });
  } catch (err) {
    console.error('Failed to record audit event:', err);
  }
}
