import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { RegisterSchema, LoginSchema, VerifyEmailSchema, AUDIT_EVENT_TYPES, ROLES } from '@passvault/shared';
import { prisma } from '../../utils/prisma.js';
import { hashPassword, verifyPassword } from '../../utils/password-hasher.js';
import { createSession, destroySession, generateSecureToken, hashToken } from '../../utils/session.js';
import { logAuditEvent } from '../../utils/audit.js';
import { sendVerificationEmail } from '../../utils/email.js';
import { requireAuth } from '../../middleware/auth.js';
import { authenticator } from 'otplib';

export const authRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Register
  server.post('/register', async (request, reply) => {
    const parseResult = RegisterSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.errors[0].message });
    }

    const { email, password } = parseResult.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(409).send({ error: 'An account with this email address already exists' });
    }

    const passwordHash = await hashPassword(password);

    // If this is the very first registered user in the entire database, make them ADMIN
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? ROLES.ADMIN : ROLES.USER;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        isVerified: userCount === 0, // Auto-verify first admin for local ease
      },
    });

    // Generate email verification token
    const verifyToken = generateSecureToken(16);
    await prisma.oneTimeToken.create({
      data: {
        userId: user.id,
        type: 'EMAIL_VERIFY',
        tokenHash: hashToken(verifyToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    await sendVerificationEmail(email, verifyToken);

    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.AUTH_REGISTER,
      status: 'SUCCESS',
      userId: user.id,
      actorEmail: user.email,
      details: { role },
      request,
    });

    // If first admin, create session immediately
    if (userCount === 0) {
      await createSession(user.id, request, reply);
    }

    return reply.status(201).send({
      message: 'Account registered successfully. Please verify your email.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  });

  // Login
  server.post('/login', async (request, reply) => {
    const parseResult = LoginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.errors[0].message });
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { mfaConfig: true },
    });

    if (!user) {
      await logAuditEvent({
        eventType: AUDIT_EVENT_TYPES.AUTH_LOGIN_FAILED,
        status: 'FAILURE',
        actorEmail: email,
        details: { reason: 'User not found' },
        request,
      });
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    if (user.isSuspended) {
      await logAuditEvent({
        eventType: AUDIT_EVENT_TYPES.AUTH_LOGIN_FAILED,
        status: 'FAILURE',
        userId: user.id,
        actorEmail: user.email,
        details: { reason: 'Account suspended' },
        request,
      });
      return reply.status(403).send({ error: 'Account suspended. Please contact an administrator.' });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      await logAuditEvent({
        eventType: AUDIT_EVENT_TYPES.AUTH_LOGIN_FAILED,
        status: 'FAILURE',
        userId: user.id,
        actorEmail: user.email,
        details: { reason: 'Incorrect password' },
        request,
      });
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    // Check if MFA is enabled
    if (user.mfaConfig?.isEnabled) {
      // Issue temporary MFA token valid for 5 minutes
      const mfaTempToken = generateSecureToken(24);
      await prisma.oneTimeToken.create({
        data: {
          userId: user.id,
          type: 'MFA_LOGIN_CHALLENGE',
          tokenHash: hashToken(mfaTempToken),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      return reply.send({
        mfaRequired: true,
        tempToken: mfaTempToken,
        email: user.email,
      });
    }

    // Create session
    await createSession(user.id, request, reply);

    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.AUTH_LOGIN_SUCCESS,
      status: 'SUCCESS',
      userId: user.id,
      actorEmail: user.email,
      request,
    });

    return reply.send({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        mfaEnabled: false,
      },
    });
  });

  // Verify MFA during Login
  server.post('/verify-mfa', async (request, reply) => {
    const { tempToken, code, isBackupCode } = request.body as {
      tempToken: string;
      code: string;
      isBackupCode?: boolean;
    };

    if (!tempToken || !code) {
      return reply.status(400).send({ error: 'Missing tempToken or security code' });
    }

    const challengeHash = hashToken(tempToken);
    const tokenRecord = await prisma.oneTimeToken.findUnique({
      where: { tokenHash: challengeHash },
      include: { user: { include: { mfaConfig: true } } },
    });

    if (!tokenRecord || tokenRecord.isUsed || tokenRecord.expiresAt < new Date()) {
      return reply.status(401).send({ error: 'MFA challenge expired or invalid. Please login again.' });
    }

    const user = tokenRecord.user;
    if (!user.mfaConfig || !user.mfaConfig.isEnabled) {
      return reply.status(400).send({ error: 'MFA is not enabled on this account' });
    }

    let verified = false;

    if (isBackupCode) {
      // Verify against backup codes
      const backupCodes: string[] = JSON.parse(user.mfaConfig.backupCodes || '[]');
      const cleanCode = code.trim().toUpperCase();
      const codeIndex = backupCodes.findIndex((b) => b === cleanCode);
      if (codeIndex !== -1) {
        verified = true;
        // Consume the backup code
        backupCodes.splice(codeIndex, 1);
        await prisma.mfaConfig.update({
          where: { id: user.mfaConfig.id },
          data: { backupCodes: JSON.stringify(backupCodes) },
        });
      }
    } else {
      // TOTP verification
      verified = authenticator.verify({
        token: code.trim(),
        secret: user.mfaConfig.secret,
      });
    }

    if (!verified) {
      await logAuditEvent({
        eventType: AUDIT_EVENT_TYPES.AUTH_MFA_FAILED,
        status: 'FAILURE',
        userId: user.id,
        actorEmail: user.email,
        request,
      });
      return reply.status(401).send({ error: 'Invalid authentication code' });
    }

    // Mark challenge token as used
    await prisma.oneTimeToken.update({
      where: { id: tokenRecord.id },
      data: { isUsed: true },
    });

    // Create session
    await createSession(user.id, request, reply);

    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.AUTH_MFA_VERIFIED,
      status: 'SUCCESS',
      userId: user.id,
      actorEmail: user.email,
      request,
    });

    return reply.send({
      message: 'MFA verified successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        mfaEnabled: true,
      },
    });
  });

  // Logout
  server.post('/logout', async (request, reply) => {
    if (request.user) {
      await logAuditEvent({
        eventType: AUDIT_EVENT_TYPES.AUTH_LOGOUT,
        status: 'SUCCESS',
        userId: request.user.id,
        actorEmail: request.user.email,
        request,
      });
    }
    await destroySession(request, reply);
    return reply.send({ message: 'Logged out successfully' });
  });

  // Get current user session profile
  server.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const user = request.user!;
    const mfa = await prisma.mfaConfig.findUnique({ where: { userId: user.id } });

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isSuspended: user.isSuspended,
        mfaEnabled: !!mfa?.isEnabled,
        createdAt: user.createdAt.toISOString(),
      },
    });
  });

  // Email verification
  server.post('/verify-email', async (request, reply) => {
    const parse = VerifyEmailSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0].message });
    }

    const { token } = parse.data;
    const tokenHash = hashToken(token);

    const tokenRecord = await prisma.oneTimeToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isUsed || tokenRecord.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'Verification code is invalid or has expired' });
    }

    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { isVerified: true },
    });

    await prisma.oneTimeToken.update({
      where: { id: tokenRecord.id },
      data: { isUsed: true },
    });

    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.AUTH_EMAIL_VERIFIED,
      status: 'SUCCESS',
      userId: tokenRecord.userId,
      actorEmail: tokenRecord.user.email,
      request,
    });

    return reply.send({ message: 'Email address verified successfully' });
  });
};
