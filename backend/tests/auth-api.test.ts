import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { FastifyInstance } from 'fastify';
import { prisma } from '../src/utils/prisma.js';
import { ROLES } from '@passvault/shared';
import { hashPassword } from '../src/utils/password-hasher.js';

import { provisionFirstAdmin } from '../src/utils/seed.js';

describe('Authentication & Access Control REST API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const adminHash = await hashPassword('PassVaultAdmin123!');
    await prisma.user.upsert({
      where: { email: 'admin@passvault.local' },
      update: {
        passwordHash: adminHash,
        role: ROLES.ADMIN,
        isSuspended: false,
      },
      create: {
        email: 'admin@passvault.local',
        firstName: 'System',
        lastName: 'Admin',
        contactNumber: '+1-555-0100',
        dateOfBirth: '1990-01-01',
        passwordHash: adminHash,
        role: ROLES.ADMIN,
        isVerified: true,
      },
    });
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns healthy status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('healthy');
  });

  it('rejects registration with invalid weak password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test-weak@example.com',
        contactNumber: '+1-555-0001',
        dateOfBirth: '1995-01-01',
        password: 'weak',
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('Password must be at least 10 characters long');
  });

  it('successfully registers a user with personal details', async () => {
    const email = `user-${Date.now()}@example.com`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        firstName: 'Maria',
        lastName: 'Santos',
        email,
        contactNumber: '+63-917-1234567',
        dateOfBirth: '1998-10-25',
        password: 'ValidPassword123!',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.user.email).toBe(email);
    expect(body.user.firstName).toBe('Maria');
    expect(body.user.lastName).toBe('Santos');
    expect(body.user.contactNumber).toBe('+63-917-1234567');
    expect(body.user.dateOfBirth).toBe('1998-10-25');
  });

  it('rejects duplicate registration with identical email', async () => {
    const email = `dup-${Date.now()}@example.com`;
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        firstName: 'John',
        lastName: 'Doe',
        email,
        contactNumber: '+1-555-0002',
        dateOfBirth: '1992-02-02',
        password: 'ValidPassword123!',
      },
    });

    const res2 = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        firstName: 'John',
        lastName: 'Doe',
        email,
        contactNumber: '+1-555-0002',
        dateOfBirth: '1992-02-02',
        password: 'ValidPassword123!',
      },
    });

    expect(res2.statusCode).toBe(409);
  });

  it('rejects login with incorrect password', async () => {
    const email = `login-test-${Date.now()}@example.com`;
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        firstName: 'Test',
        lastName: 'User',
        email,
        contactNumber: '+1-555-0003',
        dateOfBirth: '1993-03-03',
        password: 'ValidPassword123!',
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'WrongPassword999!' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('logs in successfully and returns session cookie', async () => {
    const email = `success-login-${Date.now()}@example.com`;
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        firstName: 'Success',
        lastName: 'User',
        email,
        contactNumber: '+1-555-0004',
        dateOfBirth: '1994-04-04',
        password: 'ValidPassword123!',
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'ValidPassword123!' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.cookies).toBeDefined();
    const sessionCookie = res.cookies.find((c) => c.name === 'passvault_session');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
  });

  it('prevents regular users from logging into the Admin portal or accessing admin routes', async () => {
    const email = `normal-${Date.now()}@example.com`;
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        firstName: 'Normal',
        lastName: 'Client',
        email,
        contactNumber: '+1-555-0005',
        dateOfBirth: '1995-05-05',
        password: 'ValidPassword123!',
      },
    });

    // Attempt to login using portalRole: 'ADMIN'
    const adminPortalLoginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'ValidPassword123!', portalRole: 'ADMIN' },
    });
    expect(adminPortalLoginRes.statusCode).toBe(403);
    expect(adminPortalLoginRes.body).toContain('administrator privileges');

    // Regular login
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'ValidPassword123!', portalRole: 'USER' },
    });
    expect(loginRes.statusCode).toBe(200);

    const sessionCookie = loginRes.cookies.find((c) => c.name === 'passvault_session');

    // Attempt to access admin users endpoint
    const adminRes = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
      cookies: { passvault_session: sessionCookie?.value || '' },
    });

    expect(adminRes.statusCode).toBe(403);
    expect(adminRes.body).toContain('administrator privileges required');
  });

  it('allows primary admin to register a sub-admin account with personal details', async () => {
    // Login as default seeded admin
    const adminLoginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@passvault.local',
        password: 'PassVaultAdmin123!',
        portalRole: 'ADMIN',
      },
    });

    expect(adminLoginRes.statusCode).toBe(200);
    const adminCookie = adminLoginRes.cookies.find((c) => c.name === 'passvault_session');

    const subAdminEmail = `subadmin-${Date.now()}@passvault.local`;
    const createSubAdminRes = await app.inject({
      method: 'POST',
      url: '/api/admin/sub-admins',
      cookies: { passvault_session: adminCookie?.value || '' },
      payload: {
        firstName: 'Deputy',
        lastName: 'Officer',
        email: subAdminEmail,
        contactNumber: '+1-555-9988',
        dateOfBirth: '1991-11-11',
        password: 'SubAdminSecure123!',
      },
    });

    expect(createSubAdminRes.statusCode).toBe(201);
    const body = JSON.parse(createSubAdminRes.body);
    expect(body.subAdmin.role).toBe(ROLES.SUB_ADMIN);
    expect(body.subAdmin.firstName).toBe('Deputy');
    expect(body.subAdmin.lastName).toBe('Officer');

    // Sub-admin can login via Admin portal
    const subAdminLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: subAdminEmail,
        password: 'SubAdminSecure123!',
        portalRole: 'ADMIN',
      },
    });

    expect(subAdminLogin.statusCode).toBe(200);
  });
});
