import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '../../utils/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { logAuditEvent } from '../../utils/audit.js';
import { AUDIT_EVENT_TYPES } from '@passvault/shared';
import { verifyPassword } from '../../utils/password-hasher.js';
import crypto from 'crypto';

export const mfaRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.addHook('preHandler', requireAuth);

  // Initialize MFA setup (generates secret and QR code)
  server.post('/setup', async (request, reply) => {
    const user = request.user!;
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'PassVault', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    // Save temporary or unverified secret
    await prisma.mfaConfig.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        secret,
        isEnabled: false,
      },
      update: {
        secret,
        isEnabled: false,
      },
    });

    return reply.send({
      secret,
      qrCodeDataUrl,
    });
  });

  // Verify and enable MFA
  server.post('/enable', async (request, reply) => {
    const user = request.user!;
    const { token } = request.body as { token: string };

    if (!token) {
      return reply.status(400).send({ error: 'Verification token is required' });
    }

    const config = await prisma.mfaConfig.findUnique({ where: { userId: user.id } });
    if (!config) {
      return reply.status(400).send({ error: 'Please initiate MFA setup first' });
    }

    const isValid = authenticator.verify({
      token: token.trim(),
      secret: config.secret,
    });

    if (!isValid) {
      return reply.status(400).send({ error: 'Invalid verification token' });
    }

    // Generate 8 random single-use backup recovery codes
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase().match(/.{1,4}/g)!.join('-')
    );

    await prisma.mfaConfig.update({
      where: { userId: user.id },
      data: {
        isEnabled: true,
        backupCodes: JSON.stringify(backupCodes),
      },
    });

    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.AUTH_MFA_ENABLED,
      status: 'SUCCESS',
      userId: user.id,
      actorEmail: user.email,
      request,
    });

    return reply.send({
      message: 'Two-factor authentication successfully enabled',
      backupCodes,
    });
  });

  // Disable MFA
  server.post('/disable', async (request, reply) => {
    const user = request.user!;
    const { password } = request.body as { password?: string };

    if (!password) {
      return reply.status(400).send({ error: 'Password required to disable two-factor authentication' });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({ error: 'Incorrect password' });
    }

    await prisma.mfaConfig.updateMany({
      where: { userId: user.id },
      data: { isEnabled: false, backupCodes: '[]' },
    });

    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.AUTH_MFA_DISABLED,
      status: 'SUCCESS',
      userId: user.id,
      actorEmail: user.email,
      request,
    });

    return reply.send({ message: 'Two-factor authentication disabled' });
  });
};
