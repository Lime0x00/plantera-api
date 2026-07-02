import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import app from '#app/app';
import { MlClient } from '#infrastructure/plant-analyzer-client';

describe('Diagnostics endpoints', () => {
  let authToken = '';

  beforeAll(async () => {
    vi.spyOn(MlClient.prototype, 'diagnose').mockResolvedValue({
      success: true,
      data: {
        detections: [
          {
            class: 'Leaf Spot',
            confidence: 0.95,
            instances: [{ box: [10, 10, 100, 100], confidence: 0.95 }],
          },
        ],
      },
    } as any);

    const email = `diag_${Date.now()}@test.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Diag',
        lastName: 'User',
        userName: `diagnostic_${Date.now()}`,
        email,
        password: 'testpass123',
      });
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'testpass123' });
    authToken = loginRes.body.data?.accessToken?.token || '';
  });

  // ── List Records ──
  describe('GET /api/v1/diagnostics', () => {
    it('should return list (empty initially)', async () => {
      const res = await request(app)
        .get('/api/v1/diagnostics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/v1/diagnostics').expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });
  });

  // ── Submit Diagnostic ──
  describe('POST /api/v1/diagnostics', () => {
    it('should reject without image', async () => {
      const res = await request(app)
        .post('/api/v1/diagnostics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject without auth with 401', async () => {
      const res = await request(app).post('/api/v1/diagnostics').expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });

    it('should submit legacy diagnostic successfully with mock image', async () => {
      const mockImage = Buffer.from('fake-image-data-base-64');
      const res = await request(app)
        .post('/api/v1/diagnostics')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', mockImage, 'test-plant.jpg')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('image');
      expect(res.body.data).toHaveProperty('detections');
    });
  });

  // ── Get Record ──
  describe('GET /api/v1/diagnostics/:id', () => {
    it('should return 404 for non-existent record', async () => {
      const res = await request(app)
        .get('/api/v1/diagnostics/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('errorCode');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/v1/diagnostics/1').expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });
  });
});
