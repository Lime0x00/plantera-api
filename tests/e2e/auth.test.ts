import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '#app/app';

describe('Auth endpoints', () => {
  // ── Register ──
  describe('POST /api/v1/auth/register', () => {
    const validPayload = {
      firstName: 'E2E',
      lastName: 'Test',
      userName: `e2euser_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      email: `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.com`,
      password: 'testpass123',
    };

    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validPayload)
        .expect(201);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.accessToken).toHaveProperty('token');
      expect(res.body.data.accessToken).toHaveProperty('type', 'Bearer');
      expect(res.body.data.accessToken).toHaveProperty('expiresIn');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data).toHaveProperty('user');
    });

    it('should reject duplicate email with 409', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validPayload)
        .expect(409);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errorCode', 'CONFLICT');
    });

    it('should reject missing fields with 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ firstName: 'Only' })
        .expect(422);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errorCode');
      expect(res.body.errorCode).toMatch(/VALIDATION/);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'A',
          lastName: 'B',
          userName: 'c',
          email: 'd@e.com',
          password: 'short',
        })
        .expect(422);

      expect(res.body).toHaveProperty('details');
      expect(res.body.details).toHaveProperty('password');
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'A',
          lastName: 'B',
          userName: 'c',
          email: 'notanemail',
          password: 'longenough',
        })
        .expect(422);

      expect(res.body).toHaveProperty('details');
    });

    it('should return validation error with details on empty payload', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({})
        .expect(422);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errorCode', 'VALIDATION_FAILED');
      expect(res.body).toHaveProperty('error', 'Unprocessable Entity');
      expect(res.body).toHaveProperty('details');
    });
  });

  // ── Login ──
  describe('POST /api/v1/auth/login', () => {
    const email = `login_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.com`;
    const password = 'testpass123';

    beforeAll(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Login',
          lastName: 'User',
          userName: `loginuser_${Date.now()}`,
          email,
          password,
        });
    });

    it('should login successfully and return tokens + user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user).toHaveProperty('email', email);
    });

    it('should reject wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'wrongpass' })
        .expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });

    it('should reject unknown email with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'noone@test.com', password: 'testpass123' })
        .expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });

    it('should reject missing fields with 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({})
        .expect(422);

      expect(res.body).toHaveProperty('errorCode');
    });

    it('should lock account after 5 failed attempts and return 409', async () => {
      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({ email, password: 'wrongpass' })
          .expect(401);
        expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
      }

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'wrongpass' })
        .expect(409);

      expect(res.body).toHaveProperty('errorCode', 'CONFLICT');
      expect(res.body).toHaveProperty('error', 'Conflict');
      expect(res.body.details).toHaveProperty('attempts');
      expect(res.body.details.attempts).toHaveProperty(
        'code',
        'ACCOUNT_LOCKED'
      );
      expect(res.body.details.attempts).toHaveProperty('retryAfterMinutes');
    });
  });

  // ── Refresh Token ──
  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken = '';

    beforeAll(async () => {
      const email = `refresh_${Date.now()}@test.com`;
      const password = 'testpass123';
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Refresh',
          lastName: 'User',
          userName: `refresh_${Date.now()}`,
          email,
          password,
        })
        .expect(201);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);

      refreshToken = loginRes.body.data?.refreshToken || '';
    });

    it('should refresh access token successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.accessToken).toHaveProperty('token');
    });

    it('should reject invalid refresh token with 400 or 401', async () => {
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid' })
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });

    it('should reject missing refresh token with 422', async () => {
      await request(app).post('/api/v1/auth/refresh').send({}).expect(422);
    });
  });

  // ── Logout ──
  describe('POST /api/v1/auth/logout', () => {
    let accessToken = '';
    let refreshToken = '';

    beforeAll(async () => {
      const email = `logout_${Date.now()}@test.com`;
      const password = 'testpass123';
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Logout',
          lastName: 'User',
          userName: `logout_${Date.now()}`,
          email,
          password,
        })
        .expect(201);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);

      accessToken = loginRes.body.data?.accessToken?.token || '';
      refreshToken = loginRes.body.data?.refreshToken || '';
    });

    it('should logout successfully with auth token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
    });

    it('should reject logout without auth with 401', async () => {
      await request(app).post('/api/v1/auth/logout').expect(401);
    });
  });

  // ── Forgot Password ──
  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return success even for unknown email (no enumeration)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'unknown@test.com' })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
    });

    it('should return success for known email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@test.com' })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
    });

    it('should reject invalid email with 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'bad' })
        .expect(422);

      expect(res.body).toHaveProperty('errorCode');
    });

    it('should reject missing email with 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({})
        .expect(422);

      expect(res.body).toHaveProperty('errorCode');
    });
  });

  // ── Verify OTP ──
  describe('POST /api/v1/auth/verify-otp', () => {
    it('should reject invalid OTP with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: 'test@test.com', otp: '000000' })
        .expect(400);

      expect(res.body).toHaveProperty('errorCode', 'BAD_REQUEST');
    });

    it('should reject missing otp with 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: 'test@test.com' })
        .expect(422);

      expect(res.body).toHaveProperty('errorCode');
    });

    it('should reject missing email with 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ otp: '123456' })
        .expect(422);

      expect(res.body).toHaveProperty('errorCode');
    });
  });

  // ── Reset Password ──
  describe('POST /api/v1/auth/reset-password', () => {
    it('should reject invalid reset token with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: 'test@test.com',
          resetToken: 'invalid',
          password: 'newpass123',
        })
        .expect(400);

      expect(res.body).toHaveProperty('errorCode', 'BAD_REQUEST');
    });

    it('should reject short password with 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: 'test@test.com',
          resetToken: 'sometoken',
          password: 'short',
        })
        .expect(422);

      expect(res.body).toHaveProperty('details');
    });

    it('should reject missing fields with 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({})
        .expect(422);

      expect(res.body).toHaveProperty('errorCode');
    });
  });

  // ── Public endpoint access ──
  describe('Public endpoints', () => {
    it('POST /api/v1/auth/register should work without auth', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Public',
          lastName: 'Test',
          userName: `public_${Date.now()}`,
          email: `public_${Date.now()}@test.com`,
          password: 'testpass123',
        });

      expect(res.status).toBe(201);
    });

    it('POST /api/v1/auth/login should work without auth', async () => {
      const email = `publogin_${Date.now()}@test.com`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Pub',
          lastName: 'Login',
          userName: `publogin_${Date.now()}`,
          email,
          password: 'testpass123',
        });
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'testpass123' });
      expect(res.status).toBe(200);
    });

    it('POST /api/v1/auth/forgot-password should work without auth', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'anyone@test.com' });
      expect(res.status).toBe(200);
    });
  });
});
