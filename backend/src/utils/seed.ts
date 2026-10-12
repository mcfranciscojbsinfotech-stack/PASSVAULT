import { prisma } from './prisma.js';
import { hashPassword } from './password-hasher.js';
import { CONFIG } from '../config/env.js';
import { ROLES, AUDIT_EVENT_TYPES } from '@passvault/shared';
import { logAuditEvent } from './audit.js';

export async function provisionFirstAdmin() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: ROLES.ADMIN },
  });

  if (!existingAdmin) {
    console.log(`Provisioning initial administrator account (${CONFIG.FIRST_ADMIN_EMAIL})...`);
    const passwordHash = await hashPassword(CONFIG.FIRST_ADMIN_PASSWORD);

    const admin = await prisma.user.create({
      data: {
        email: CONFIG.FIRST_ADMIN_EMAIL,
        firstName: 'System',
        lastName: 'Administrator',
        contactNumber: '+1-555-0100',
        dateOfBirth: '1990-01-01',
        passwordHash,
        role: ROLES.ADMIN,
        isVerified: true,
      },
    });

    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.AUTH_REGISTER,
      status: 'SUCCESS',
      userId: admin.id,
      actorEmail: admin.email,
      details: { role: ROLES.ADMIN, isInitialProvision: true },
    });

    console.log(`Initial administrator provisioned successfully.`);
  }
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  provisionFirstAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to provision admin:', err);
      process.exit(1);
    });
}
