import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '#app/app';

describe('Notifications endpoints', () => {
  let authToken = '';

  beforeAll(async () => {
    const email = `notif_${Date.now()}@test.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Notif',
        lastName: 'User',
        userName: `notifuser_${Date.now()}`,
        email,
        password: 'testpass123',
      });
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'testpass123' });
    authToken = loginRes.body.data?.accessToken?.token || '';
  });

  // ── List ──
  describe('GET /api/v1/notifications', () => {
    it('should return notifications list', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('totalCount');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/v1/notifications').expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });
  });

  // ── Mark as Read ──
  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should return 404 for non-existent notification', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/999999/read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('errorCode');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/999999/read')
        .expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });
  });
});
