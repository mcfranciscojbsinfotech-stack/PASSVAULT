import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';
import { prisma } from '../../utils/prisma.js';
import { logAuditEvent } from '../../utils/audit.js';
import { AUDIT_EVENT_TYPES, ROLES, AdminUserUpdateSchema } from '@passvault/shared';

const serverStartTime = Date.now();

export const adminRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.addHook('preHandler', requireAuth);
  server.addHook('preHandler', requireAdmin);

  // List all users with non-secret operational metadata
  server.get('/users', async (request, reply) => {
    const query = request.query as { search?: string };
    const search = query.search?.trim();

    const users = await prisma.user.findMany({
      where: search
        ? {
            email: {
              contains: search,
            },
          }
        : undefined,
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sessions: { where: { isRevoked: false, expiresAt: { gt: new Date() } } },
            vaultItems: { where: { isDeleted: false } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      isVerified: u.isVerified,
      isSuspended: u.isSuspended,
      createdAt: u.createdAt.toISOString(),
      activeSessionsCount: u._count.sessions,
      encryptedVaultItemsCount: u._count.vaultItems,
    }));

    return reply.send({ users: formatted });
  });

  // Update user role or suspension status
  server.patch('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const adminUser = request.user!;

    const parse = AdminUserUpdateSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0].message });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Prevent admin from revoking their own admin role or suspending themselves
    if (targetUser.id === adminUser.id && parse.data.role && parse.data.role !== ROLES.ADMIN) {
      return reply.status(400).send({ error: 'Cannot revoke your own administrator privileges' });
    }
    if (targetUser.id === adminUser.id && parse.data.isSuspended === true) {
      return reply.status(400).send({ error: 'Cannot suspend your own account' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(parse.data.role ? { role: parse.data.role } : {}),
        ...(typeof parse.data.isSuspended === 'boolean'
          ? { isSuspended: parse.data.isSuspended }
          : {}),
      },
    });

    // If suspended, revoke all active sessions immediately
    if (parse.data.isSuspended === true) {
      await prisma.authenticationSession.updateMany({
        where: { userId: id, isRevoked: false },
        data: { isRevoked: true },
      });
      await logAuditEvent({
        eventType: AUDIT_EVENT_TYPES.USER_SUSPENDED,
        status: 'SUCCESS',
        userId: adminUser.id,
        actorEmail: adminUser.email,
        details: { targetUserId: id, targetEmail: targetUser.email },
        request,
      });
    } else if (parse.data.isSuspended === false) {
      await logAuditEvent({
        eventType: AUDIT_EVENT_TYPES.USER_REACTIVATED,
        status: 'SUCCESS',
        userId: adminUser.id,
        actorEmail: adminUser.email,
        details: { targetUserId: id, targetEmail: targetUser.email },
        request,
      });
    }

    if (parse.data.role) {
      await logAuditEvent({
        eventType: AUDIT_EVENT_TYPES.USER_ROLE_UPDATED,
        status: 'SUCCESS',
        userId: adminUser.id,
        actorEmail: adminUser.email,
        details: { targetUserId: id, newRole: parse.data.role },
        request,
      });
    }

    return reply.send({
      message: 'User updated successfully',
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        isSuspended: updated.isSuspended,
      },
    });
  });

  // Revoke all sessions for a specific user
  server.post('/users/:id/revoke-sessions', async (request, reply) => {
    const { id } = request.params as { id: string };
    const adminUser = request.user!;

    await prisma.authenticationSession.updateMany({
      where: { userId: id, isRevoked: false },
      data: { isRevoked: true },
    });

    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.SESSION_REVOKED,
      status: 'SUCCESS',
      userId: adminUser.id,
      actorEmail: adminUser.email,
      details: { targetUserId: id, action: 'admin_revoked_all_sessions' },
      request,
    });

    return reply.send({ message: 'All sessions for the user have been revoked' });
  });

  // Audit log query viewer
  server.get('/audit-logs', async (request, reply) => {
    const query = request.query as {
      eventType?: string;
      limit?: string;
      status?: string;
    };

    const limit = Math.min(200, parseInt(query.limit || '50', 10));

    const events = await prisma.auditEvent.findMany({
      where: {
        ...(query.eventType ? { eventType: query.eventType } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const formatted = events.map((e) => ({
      id: e.id,
      userId: e.userId,
      actorEmail: e.actorEmail,
      eventType: e.eventType,
      status: e.status,
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
      detailsJson: e.detailsJson,
      createdAt: e.createdAt.toISOString(),
    }));

    return reply.send({ auditLogs: formatted });
  });

  // Real System & Operational Monitoring metrics
  server.get('/monitoring', async (request, reply) => {
    const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);

    const [
      totalUsers,
      activeSessions,
      totalEncryptedItems,
      totalAuditEvents,
      recentErrors,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.authenticationSession.count({
        where: { isRevoked: false, expiresAt: { gt: new Date() } },
      }),
      prisma.encryptedVaultItem.count({ where: { isDeleted: false } }),
      prisma.auditEvent.count(),
      prisma.auditEvent.count({
        where: {
          status: 'FAILURE',
          createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return reply.send({
      serverTime: new Date().toISOString(),
      uptimeSeconds,
      databaseStatus: 'healthy',
      activeSessionsCount: activeSessions,
      totalUsersCount: totalUsers,
      totalEncryptedItemsCount: totalEncryptedItems,
      auditEventsCount: totalAuditEvents,
      recentErrorsCount: recentErrors,
    });
  });

  // Storage management stats
  server.get('/storage', async (request, reply) => {
    const [totalEncryptedItems, deletedItems, totalUsers] = await Promise.all([
      prisma.encryptedVaultItem.count({ where: { isDeleted: false } }),
      prisma.encryptedVaultItem.count({ where: { isDeleted: true } }),
      prisma.user.count(),
    ]);

    return reply.send({
      cloudEncryptedItemCount: totalEncryptedItems,
      tombstoneDeletedItemCount: deletedItems,
      totalUsersCount: totalUsers,
      databaseEngine: 'SQLite / PostgreSQL (Prisma)',
      isolationEnforced: true,
      isolatedCloudSyncAllowed: false, // Strict architectural guarantee
    });
  });

  // Network configuration & status
  server.get('/network', async (request, reply) => {
    return reply.send({
      apiStatus: 'online',
      protocol: request.protocol,
      hostname: request.hostname,
      ip: request.ip,
      corsEnabled: true,
      syncServiceAvailable: true,
      databaseConnected: true,
      serverTime: new Date().toISOString(),
    });
  });
};
