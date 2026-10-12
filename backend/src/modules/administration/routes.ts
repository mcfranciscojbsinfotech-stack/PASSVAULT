import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin, requireSuperAdmin } from '../../middleware/admin.js';
import { prisma } from '../../utils/prisma.js';
import { logAuditEvent } from '../../utils/audit.js';
import { hashPassword } from '../../utils/password-hasher.js';
import {
  AUDIT_EVENT_TYPES,
  ROLES,
  AdminUserUpdateSchema,
  CreateSubAdminSchema,
  AdminCreateUserSchema,
} from '@passvault/shared';

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
            OR: [
              { email: { contains: search } },
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { contactNumber: { contains: search } },
            ],
          }
        : undefined,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        contactNumber: true,
        dateOfBirth: true,
        role: true,
        isVerified: true,
        isSuspended: true,
        createdBy: true,
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
      firstName: u.firstName,
      lastName: u.lastName,
      contactNumber: u.contactNumber,
      dateOfBirth: u.dateOfBirth,
      role: u.role,
      isVerified: u.isVerified,
      isSuspended: u.isSuspended,
      createdBy: u.createdBy,
      createdAt: u.createdAt.toISOString(),
      activeSessionsCount: u._count.sessions,
      encryptedVaultItemsCount: u._count.vaultItems,
    }));

    return reply.send({ users: formatted });
  });

  // Admin registers a user or sub-admin account directly from the Admin Dashboard
  server.post('/users', async (request, reply) => {
    const adminUser = request.user!;

    const parseResult = AdminCreateUserSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.errors[0].message });
    }

    const { firstName, lastName, email, contactNumber, dateOfBirth, password, role } = parseResult.data;

    // Only primary ADMIN can create a SUB_ADMIN
    if (role === ROLES.SUB_ADMIN && adminUser.role !== ROLES.ADMIN) {
      return reply.status(403).send({
        error: 'Access denied: only primary administrators can create sub-admin accounts.',
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(409).send({ error: 'An account with this email address already exists' });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        contactNumber,
        dateOfBirth,
        passwordHash,
        role,
        isVerified: true, // Pre-verified by administrator
        createdBy: adminUser.id,
      },
    });

    await logAuditEvent({
      eventType: role === ROLES.SUB_ADMIN ? AUDIT_EVENT_TYPES.SUB_ADMIN_CREATED : AUDIT_EVENT_TYPES.AUTH_REGISTER,
      status: 'SUCCESS',
      userId: adminUser.id,
      actorEmail: adminUser.email,
      details: {
        createdUserId: newUser.id,
        createdEmail: newUser.email,
        role: newUser.role,
        firstName,
        lastName,
      },
      request,
    });

    return reply.status(201).send({
      message: 'Account created successfully.',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        contactNumber: newUser.contactNumber,
        dateOfBirth: newUser.dateOfBirth,
        role: newUser.role,
        isVerified: newUser.isVerified,
      },
    });
  });

  // Admin registers a SUB_ADMIN account directly from the Admin Dashboard
  server.post('/sub-admins', async (request, reply) => {
    const adminUser = request.user!;

    // Only primary ADMIN can register a SUB_ADMIN
    if (adminUser.role !== ROLES.ADMIN) {
      return reply.status(403).send({
        error: 'Access denied: only primary administrators can create sub-admin accounts.',
      });
    }

    const parseResult = CreateSubAdminSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.errors[0].message });
    }

    const { firstName, lastName, email, contactNumber, dateOfBirth, password } = parseResult.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(409).send({ error: 'An account with this email address already exists' });
    }

    const passwordHash = await hashPassword(password);

    const subAdmin = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        contactNumber,
        dateOfBirth,
        passwordHash,
        role: ROLES.SUB_ADMIN,
        isVerified: true, // Pre-verified by administrator
        createdBy: adminUser.id,
      },
    });

    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.SUB_ADMIN_CREATED,
      status: 'SUCCESS',
      userId: adminUser.id,
      actorEmail: adminUser.email,
      details: {
        createdSubAdminId: subAdmin.id,
        subAdminEmail: subAdmin.email,
        firstName,
        lastName,
      },
      request,
    });

    return reply.status(201).send({
      message: 'Sub-admin account created successfully.',
      subAdmin: {
        id: subAdmin.id,
        email: subAdmin.email,
        firstName: subAdmin.firstName,
        lastName: subAdmin.lastName,
        contactNumber: subAdmin.contactNumber,
        dateOfBirth: subAdmin.dateOfBirth,
        role: subAdmin.role,
        isVerified: subAdmin.isVerified,
      },
    });
  });

  // Update user role or suspension status or permitted profile details
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

    // Sub-admins cannot alter primary administrators
    if (adminUser.role === ROLES.SUB_ADMIN && targetUser.role === ROLES.ADMIN) {
      return reply.status(403).send({
        error: 'Access denied: sub-administrators cannot modify primary administrators.',
      });
    }

    // Sub-admins cannot promote anyone to primary ADMIN
    if (adminUser.role === ROLES.SUB_ADMIN && parse.data.role === ROLES.ADMIN) {
      return reply.status(403).send({
        error: 'Access denied: sub-administrators cannot assign primary administrator roles.',
      });
    }

    // Prevent admin from revoking their own admin role or suspending themselves
    if (targetUser.id === adminUser.id && parse.data.role && parse.data.role !== adminUser.role) {
      return reply.status(400).send({ error: 'Cannot revoke your own administrator privileges' });
    }
    if (targetUser.id === adminUser.id && parse.data.isSuspended === true) {
      return reply.status(400).send({ error: 'Cannot suspend your own account' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(parse.data.firstName !== undefined ? { firstName: parse.data.firstName } : {}),
        ...(parse.data.lastName !== undefined ? { lastName: parse.data.lastName } : {}),
        ...(parse.data.contactNumber !== undefined ? { contactNumber: parse.data.contactNumber } : {}),
        ...(parse.data.dateOfBirth !== undefined ? { dateOfBirth: parse.data.dateOfBirth } : {}),
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
        firstName: updated.firstName,
        lastName: updated.lastName,
        contactNumber: updated.contactNumber,
        dateOfBirth: updated.dateOfBirth,
        role: updated.role,
        isSuspended: updated.isSuspended,
      },
    });
  });

  // Revoke all sessions for a specific user
  server.post('/users/:id/revoke-sessions', async (request, reply) => {
    const { id } = request.params as { id: string };
    const adminUser = request.user!;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return reply.status(404).send({ error: 'User not found' });
    }

    if (adminUser.role === ROLES.SUB_ADMIN && targetUser.role === ROLES.ADMIN) {
      return reply.status(403).send({
        error: 'Access denied: sub-administrators cannot revoke sessions of primary administrators.',
      });
    }

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
      adminUsers,
      subAdminUsers,
      standardUsers,
      suspendedUsers,
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
      prisma.user.count({ where: { role: ROLES.ADMIN } }),
      prisma.user.count({ where: { role: ROLES.SUB_ADMIN } }),
      prisma.user.count({ where: { role: ROLES.USER } }),
      prisma.user.count({ where: { isSuspended: true } }),
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
      adminUsersCount: adminUsers,
      subAdminUsersCount: subAdminUsers,
      standardUsersCount: standardUsers,
      suspendedUsersCount: suspendedUsers,
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
      isolatedCloudSyncAllowed: false,
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
