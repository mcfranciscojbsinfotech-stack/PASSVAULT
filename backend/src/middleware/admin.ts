import { FastifyReply, FastifyRequest } from 'fastify';
import { ROLES } from '@passvault/shared';

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user || request.user.role !== ROLES.ADMIN) {
    return reply.status(403).send({ error: 'Access denied: administrator privileges required' });
  }
}
