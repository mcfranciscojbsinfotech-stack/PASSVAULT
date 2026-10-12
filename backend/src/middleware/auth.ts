import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { hashToken } from '../utils/session.js';
import { SESSION_CONSTANTS } from '@passvault/shared';
import { User, AuthenticationSession } from '@prisma/client';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
    session?: AuthenticationSession;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token =
    request.cookies[SESSION_CONSTANTS.SESSION_COOKIE_NAME] ||
    (request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.slice(7)
      : null);

  if (!token) {
    return reply.status(401).send({ error: 'Authentication required: missing session' });
  }

  const tokenHash = hashToken(token);

  const session = await prisma.authenticationSession.findUnique({
    where: { sessionTokenHash: tokenHash },
    include: { user: true },
  });

  if (!session || session.isRevoked || session.expiresAt < new Date()) {
    return reply.status(401).send({ error: 'Authentication failed: session invalid or expired' });
  }

  if (session.user.isSuspended) {
    return reply.status(403).send({ error: 'Account suspended. Please contact an administrator.' });
  }

  // Update last active timestamp
  await prisma.authenticationSession.update({
    where: { id: session.id },
    data: { lastActiveAt: new Date() },
  });

  request.user = session.user;
  request.session = session;
}
