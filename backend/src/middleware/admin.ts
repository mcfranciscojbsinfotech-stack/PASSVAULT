import { FastifyReply, FastifyRequest } from 'fastify';
import { ROLES } from '@passvault/shared';

/**
 * Guard allowing either primary ADMIN or SUB_ADMIN.
 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (
    !request.user ||
    (request.user.role !== ROLES.ADMIN && request.user.role !== ROLES.SUB_ADMIN)
  ) {
    return reply.status(403).send({ error: 'Access denied: administrator privileges required' });
  }
}

/**
 * Guard strictly requiring primary ADMIN (e.g. for provisioning sub-admins).
 */
export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user || request.user.role !== ROLES.ADMIN) {
    return reply.status(403).send({
      error: 'Access denied: primary administrator privileges required to perform this action',
    });
  }
}
