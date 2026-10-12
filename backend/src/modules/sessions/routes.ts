import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma } from '../../utils/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { logAuditEvent } from '../../utils/audit.js';
import { AUDIT_EVENT_TYPES } from '@passvault/shared';

export const sessionRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.addHook('preHandler', requireAuth);

  // List active sessions
  server.get('/', async (request, reply) => {
    const user = request.user!;
    const currentSession = request.session!;

    const sessions = await prisma.authenticationSession.findMany({
      where: {
        userId: user.id,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    const formatted = sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      lastActiveAt: s.lastActiveAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      isCurrent: s.id === currentSession.id,
    }));

    return reply.send({ sessions: formatted });
  });

  // Revoke specific session
  server.post('/revoke', async (request, reply) => {
    const user = request.user!;
    const { sessionId } = request.body as { sessionId: string };

    if (!sessionId) {
      return reply.status(400).send({ error: 'Session ID is required' });
    }

    const session = await prisma.authenticationSession.findFirst({
      where: { id: sessionId, userId: user.id },
    });

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    await prisma.authenticationSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.SESSION_REVOKED,
      status: 'SUCCESS',
      userId: user.id,
      actorEmail: user.email,
      details: { revokedSessionId: session.id },
      request,
    });

    return reply.send({ message: 'Session revoked successfully' });
  });

  // Revoke all other sessions
  server.post('/revoke-all-others', async (request, reply) => {
    const user = request.user!;
    const currentSession = request.session!;

    await prisma.authenticationSession.updateMany({
      where: {
        userId: user.id,
        id: { not: currentSession.id },
        isRevoked: false,
      },
      data: { isRevoked: true },
    });

    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.SESSION_REVOKED,
      status: 'SUCCESS',
      userId: user.id,
      actorEmail: user.email,
      details: { action: 'revoke_all_others' },
      request,
    });

    return reply.send({ message: 'All other sessions have been revoked' });
  });
};
