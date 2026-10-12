import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { FastifyInstance } from 'fastify';
import { prisma } from '../src/utils/prisma.js';

describe('Authentication & Access Control REST API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
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
        email: 'test-weak@example.com',
        password: 'weak',
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('Password must be at least 10 characters long');
  });

  it('successfully registers a user with strong password', async () => {
    const email = `user-${Date.now()}@example.com`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email,
        password: 'ValidPassword123!',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.user.email).toBe(email);
  });

  it('rejects duplicate registration with identical email', async () => {
    const email = `dup-${Date.now()}@example.com`;
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'ValidPassword123!' },
    });

    const res2 = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'ValidPassword123!' },
    });

    expect(res2.statusCode).toBe(409);
  });

  it('rejects login with incorrect password', async () => {
    const email = `login-test-${Date.now()}@example.com`;
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'ValidPassword123!' },
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
      payload: { email, password: 'ValidPassword123!' },
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

  it('prevents regular users from accessing administrator routes', async () => {
    const email = `normal-${Date.now()}@example.com`;
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'ValidPassword123!' },
    });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'ValidPassword123!' },
    });

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
});
