import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { SyncPushBatchSchema, AUDIT_EVENT_TYPES } from '@passvault/shared';
import { prisma } from '../../utils/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { logAuditEvent } from '../../utils/audit.js';

export const syncRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.addHook('preHandler', requireAuth);

  // Push encrypted items to cloud synchronization store
  server.post('/push', async (request, reply) => {
    const user = request.user!;
    const parse = SyncPushBatchSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0].message });
    }

    const { items } = parse.data;
    let createdCount = 0;
    let updatedCount = 0;
    const conflicts: string[] = [];

    for (const item of items) {
      const existing = await prisma.encryptedVaultItem.findUnique({
        where: {
          userId_itemId: {
            userId: user.id,
            itemId: item.itemId,
          },
        },
      });

      if (existing) {
        // Revision check: if server has a higher revision, note conflict
        if (existing.revision > item.revision) {
          conflicts.push(item.itemId);
          continue;
        }

        await prisma.encryptedVaultItem.update({
          where: { id: existing.id },
          data: {
            encryptedPayload: item.encryptedPayload,
            revision: item.revision,
            isDeleted: item.isDeleted,
            clientUpdatedAt: new Date(item.clientUpdatedAt),
          },
        });
        updatedCount++;
      } else {
        await prisma.encryptedVaultItem.create({
          data: {
            userId: user.id,
            itemId: item.itemId,
            encryptedPayload: item.encryptedPayload,
            revision: item.revision,
            isDeleted: item.isDeleted,
            clientUpdatedAt: new Date(item.clientUpdatedAt),
          },
        });
        createdCount++;
      }
    }

    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.VAULT_SYNC_PUSH,
      status: 'SUCCESS',
      userId: user.id,
      actorEmail: user.email,
      details: {
        totalItems: items.length,
        createdCount,
        updatedCount,
        conflictsCount: conflicts.length,
      },
      request,
    });

    return reply.send({
      success: true,
      createdCount,
      updatedCount,
      conflicts,
      serverTime: new Date().toISOString(),
    });
  });

  // Pull encrypted items from cloud store
  server.get('/pull', async (request, reply) => {
    const user = request.user!;
    const query = request.query as { since?: string };

    const whereClause: { userId: string; updatedAt?: { gt: Date } } = {
      userId: user.id,
    };

    if (query.since) {
      const sinceDate = new Date(query.since);
      if (!isNaN(sinceDate.getTime())) {
        whereClause.updatedAt = { gt: sinceDate };
      }
    }

    const items = await prisma.encryptedVaultItem.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'asc' },
    });

    const formatted = items.map((i) => ({
      id: i.id,
      itemId: i.itemId,
      encryptedPayload: i.encryptedPayload,
      revision: i.revision,
      isDeleted: i.isDeleted,
      clientUpdatedAt: i.clientUpdatedAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    }));

    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.VAULT_SYNC_PULL,
      status: 'SUCCESS',
      userId: user.id,
      actorEmail: user.email,
      details: { itemsReturned: formatted.length },
      request,
    });

    return reply.send({
      items: formatted,
      serverTime: new Date().toISOString(),
    });
  });

  // Cloud sync status summary
  server.get('/status', async (request, reply) => {
    const user = request.user!;

    const totalActive = await prisma.encryptedVaultItem.count({
      where: { userId: user.id, isDeleted: false },
    });

    const totalDeleted = await prisma.encryptedVaultItem.count({
      where: { userId: user.id, isDeleted: true },
    });

    const lastItem = await prisma.encryptedVaultItem.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    return reply.send({
      totalActiveItems: totalActive,
      totalDeletedItems: totalDeleted,
      lastSyncedAt: lastItem?.updatedAt ? lastItem.updatedAt.toISOString() : null,
      serverTime: new Date().toISOString(),
    });
  });
};
