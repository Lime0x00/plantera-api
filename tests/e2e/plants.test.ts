import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import app from '#app/app';
import { container } from '#app/container';
import { QueueService } from '#infrastructure/queue/queue.service';

describe('Plants endpoints', () => {
  let token = '';

  beforeAll(async () => {
    // Mock queue adds to prevent docker worker from running background jobs during E2E tests
    vi.spyOn(QueueService.prototype, 'dispatch').mockResolvedValue(undefined);

    // Clear cache to prevent test pollution
    const cacheService = container.resolve('cacheService') as any;
    await cacheService.clear();

    const email = `plants_${Date.now()}@test.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Plant',
        lastName: 'User',
        userName: `plantsuser_${Date.now()}`,
        email,
        password: 'testpass123',
      });
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'testpass123' });
    token = loginRes.body.data?.accessToken?.token || '';
  });

  // ── List Plants ──
  describe('GET /api/v1/plants', () => {
    it('should return paginated plants list', async () => {
      const res = await request(app)
        .get('/api/v1/plants?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
      expect(res.body.meta).toHaveProperty('page', 1);
      expect(res.body.meta).toHaveProperty('limit', 5);
      expect(res.body.meta).toHaveProperty('totalCount');
      expect(res.body.meta).toHaveProperty('totalPages');
    });

    it('should return second page of pagination', async () => {
      const res = await request(app)
        .get('/api/v1/plants?page=2&limit=3')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.meta.page).toBe(2);
      expect(res.body.meta.limit).toBe(3);
    });

    it('should return correct pagination metadata types', async () => {
      const res = await request(app)
        .get('/api/v1/plants?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(typeof res.body.meta.totalCount).toBe('number');
      expect(typeof res.body.meta.totalPages).toBe('number');
      expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(1);
      expect(res.body.meta.totalCount).toBeGreaterThan(0);
    });

    it('should filter plants by category', async () => {
      const res = await request(app)
        .get('/api/v1/plants?category=Indoor&limit=100')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      for (const plant of res.body.data) {
        expect(Array.isArray(plant.category)).toBe(true);
        expect(plant.category.some((c: string) => c.includes('Indoor'))).toBe(
          true
        );
      }
    });

    it('should search plants by name', async () => {
      const res = await request(app)
        .get('/api/v1/plants?search=Monstera')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return empty data for search with no matches', async () => {
      const res = await request(app)
        .get('/api/v1/plants?search=NonExistentPlantXYZ')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.length).toBe(0);
    });
  });

  // ── Get Plant By ID ──
  describe('GET /api/v1/plants/:id', () => {
    it('should return a single plant by ID', async () => {
      const res = await request(app)
        .get('/api/v1/plants/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id', 1);
      expect(res.body.data).toHaveProperty('commonName');
      expect(res.body.data).toHaveProperty('scientificName');
    });

    it('should return 404 for non-existent plant', async () => {
      const res = await request(app)
        .get('/api/v1/plants/999999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('errorCode', 'RESOURCE_NOT_FOUND');
    });

    it('should return error in spec format on 404', async () => {
      const res = await request(app)
        .get('/api/v1/plants/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errorCode');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('error');
    });
  });

  // ── Classify ──
  describe('POST /api/v1/plants/classify', () => {
    it('should reject without image', async () => {
      const res = await request(app)
        .post('/api/v1/plants/classify')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject without auth with 401', async () => {
      const res = await request(app)
        .post('/api/v1/plants/classify')
        .expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });

    it('should submit classification successfully with mock image', async () => {
      const mockImage = Buffer.from('fake-image-data-base-64');
      const res = await request(app)
        .post('/api/v1/plants/classify')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', mockImage, 'test-plant.jpg')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('recordId');
      expect(res.body.data).toHaveProperty('status', 'pending');
    });
  });

  // ── Diagnose ──
  describe('POST /api/v1/plants/diagnose', () => {
    it('should reject without image', async () => {
      const res = await request(app)
        .post('/api/v1/plants/diagnose')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject without auth with 401', async () => {
      const res = await request(app)
        .post('/api/v1/plants/diagnose')
        .expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });

    it('should submit diagnosis successfully with mock image', async () => {
      const mockImage = Buffer.from('fake-image-data-base-64');
      const res = await request(app)
        .post('/api/v1/plants/diagnose')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', mockImage, 'test-plant.jpg')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('recordId');
      expect(res.body.data).toHaveProperty('status', 'pending');
    });
  });

  // ── Auth guard ──
  describe('Authentication', () => {
    it('should reject requests without token with 401', async () => {
      const res = await request(app).get('/api/v1/plants').expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });

    it('should reject requests with expired token with 401', async () => {
      await request(app)
        .get('/api/v1/plants')
        .set('Authorization', 'Bearer expired.jwt.token')
        .expect(401);
    });

    it('should reject requests with malformed auth header', async () => {
      await request(app)
        .get('/api/v1/plants')
        .set('Authorization', 'Basic sometoken')
        .expect(401);
    });
  });
});
