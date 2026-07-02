import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '#app/app';

describe('Profile endpoints', () => {
  let authToken = '';
  const password = 'testpass123';

  beforeAll(async () => {
    const email = `profile_${Date.now()}@test.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Prof',
        lastName: 'User',
        userName: `profuser_${Date.now()}`,
        email,
        password,
      });
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });
    authToken = loginRes.body.data?.accessToken?.token || '';
  });

  // ── Update Profile ──
  describe('PATCH /api/v1/profile', () => {
    it('should update user profile', async () => {
      const res = await request(app)
        .patch('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'UpdatedFirst' })
        .expect(200);

      expect(res.body.data.user.firstName).toBe('UpdatedFirst');
    });

    it('should reject without auth with 401', async () => {
      const res = await request(app)
        .patch('/api/v1/profile')
        .send({ firstName: 'NoAuth' })
        .expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });

    it('should reject email conflict with 409', async () => {
      const otherEmail = `other_${Date.now()}@test.com`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Other',
          lastName: 'User',
          userName: `other_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          email: otherEmail,
          password: 'testpass123',
        });

      const res = await request(app)
        .post('/api/v1/profile/email/send-otp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ newEmail: otherEmail })
        .expect(409);

      expect(res.body).toHaveProperty('errorCode', 'CONFLICT');
      expect(res.body).toHaveProperty('error', 'Conflict');
      expect(res.body.details).toHaveProperty('email');
      expect(res.body.details.email).toHaveProperty('code', 'CONFLICT');
    });
  });

  // ── Change Password ──
  describe('PATCH /api/v1/profile/password', () => {
    it('should change password', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: password, newPassword: 'newpass1234' })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
    });

    it('should reject wrong current password', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: 'wrongpass', newPassword: 'newpass1234' })
        .expect(400);

      expect(res.body).toHaveProperty('errorCode', 'BAD_REQUEST');
    });

    it('should reject short new password with 422', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: 'newpass1234', newPassword: 'short' })
        .expect(422);

      expect(res.body).toHaveProperty('details');
    });

    it('should reject missing fields with 422', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(422);

      expect(res.body).toHaveProperty('errorCode');
    });
  });

  // ── Notification Preferences ──
  describe('Notification preferences', () => {
    it('GET should return preferences', async () => {
      const res = await request(app)
        .get('/api/v1/profile/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.preferences).toHaveProperty('pushEnabled');
      expect(res.body.data.preferences).toHaveProperty('wateringReminders');
    });

    it('PATCH should update preferences', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pushEnabled: false, wateringReminders: false })
        .expect(200);

      expect(res.body.data.preferences.pushEnabled).toBe(false);
      expect(res.body.data.preferences.wateringReminders).toBe(false);
    });

    it('PATCH should restore preferences', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pushEnabled: true, wateringReminders: true })
        .expect(200);

      expect(res.body.data.preferences.pushEnabled).toBe(true);
      expect(res.body.data.preferences.wateringReminders).toBe(true);
    });

    it('PATCH should reject without auth with 401', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/notifications')
        .send({ pushEnabled: false })
        .expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });

    it('GET should reject without auth with 401', async () => {
      const res = await request(app)
        .get('/api/v1/profile/notifications')
        .expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });
  });

  // ── Push Tokens ──
  describe('POST /api/v1/profile/push-token', () => {
    it('should save a push token successfully', async () => {
      const res = await request(app)
        .post('/api/v1/profile/push-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ token: 'ExponentPushToken[test_token_123]', platform: 'expo' })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
    });

    it('should reject missing token with 422', async () => {
      const res = await request(app)
        .post('/api/v1/profile/push-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(422);

      expect(res.body).toHaveProperty('errorCode');
    });

    it('should reject invalid platform with 422', async () => {
      const res = await request(app)
        .post('/api/v1/profile/push-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ token: 'test', platform: 'invalid' })
        .expect(422);

      expect(res.body).toHaveProperty('errorCode');
    });

    it('should reject without auth with 401', async () => {
      const res = await request(app)
        .post('/api/v1/profile/push-token')
        .send({ token: 'test' })
        .expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });
  });

  describe('DELETE /api/v1/profile/push-token', () => {
    it('should remove push token successfully', async () => {
      const res = await request(app)
        .delete('/api/v1/profile/push-token')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
    });

    it('should reject without auth with 401', async () => {
      const res = await request(app)
        .delete('/api/v1/profile/push-token')
        .expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });
  });
});
