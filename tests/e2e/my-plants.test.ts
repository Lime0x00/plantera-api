import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import app from '#app/app';
import { container } from '#app/container';
import { QueueService } from '#infrastructure/queue/queue.service';
import { MlClient } from '#infrastructure/plant-analyzer-client';

describe('My Plants endpoints', () => {
  let authToken = '';
  let myPlantId = 0;

  beforeAll(async () => {
    // Mock ML client calls to run independently of ML backend service
    vi.spyOn(MlClient.prototype, 'classify').mockResolvedValue({
      success: true,
      message: 'Classification successful',
      data: [{ class_name: 'asparagus_fern', class_id: 5, confidence: 0.98 }],
    });
    vi.spyOn(MlClient.prototype, 'diagnose').mockResolvedValue({
      success: true,
      message: 'Diagnosis successful',
      data: {
        detections: [],
      },
    });

    // Mock queue adds to prevent docker worker from running background jobs during E2E tests
    vi.spyOn(QueueService.prototype, 'dispatch').mockResolvedValue(undefined);

    // Clear cache to prevent test pollution
    const cacheService = container.resolve('cacheService') as any;
    await cacheService.clear();

    const email = `myplant_${Date.now()}@test.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'MyP',
        lastName: 'User',
        userName: `myplantuser_${Date.now()}`,
        email,
        password: 'testpass123',
      });
    if (res.body.data?.accessToken?.token) {
      authToken = res.body.data.accessToken.token;
    } else {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'testpass123' });
      authToken = loginRes.body.data?.accessToken?.token || '';
    }
  });

  // ── Add ──
  describe('POST /api/v1/my-plants', () => {
    it('should add a plant successfully', async () => {
      const res = await request(app)
        .post('/api/v1/my-plants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plantId: 1 })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.myPlant).toHaveProperty('id');
      expect(res.body.data.myPlant.plant).toHaveProperty('id', 1);
      myPlantId = res.body.data.myPlant.id;
    });

    it('should reject duplicate with 409 and include plantId details', async () => {
      const res = await request(app)
        .post('/api/v1/my-plants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plantId: 1 })
        .expect(409);

      expect(res.body).toHaveProperty('errorCode', 'CONFLICT');
      expect(res.body.details).toHaveProperty('plantId');
      expect(res.body.details.plantId).toHaveProperty('code', 'CONFLICT');
    });

    it('should reject missing plantId with 422', async () => {
      const res = await request(app)
        .post('/api/v1/my-plants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(422);

      expect(res.body).toHaveProperty('errorCode');
    });

    it('should reject non-existent plantId with 404', async () => {
      const res = await request(app)
        .post('/api/v1/my-plants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plantId: 999999 })
        .expect(404);

      expect(res.body).toHaveProperty('errorCode');
    });
  });

  // ── List ──
  describe('GET /api/v1/my-plants', () => {
    it('should return list with the added plant', async () => {
      const res = await request(app)
        .get('/api/v1/my-plants')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/v1/my-plants').expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });
  });


  // ── Remove ──
  describe('DELETE /api/v1/my-plants/:id', () => {
    it('should remove plant', async () => {
      const res = await request(app)
        .delete(`/api/v1/my-plants/${myPlantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
    });

    it('should return 404 for already removed plant', async () => {
      const res = await request(app)
        .delete(`/api/v1/my-plants/${myPlantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('errorCode');
    });

    it('should return 404 for non-existent my-plant', async () => {
      const res = await request(app)
        .delete('/api/v1/my-plants/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('errorCode');
    });
  });

  // ── Water ──
  describe('POST /api/v1/my-plants/:id/water', () => {
    let plantId = 0;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/my-plants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plantId: 2 })
        .expect(201);
      plantId = res.body.data.myPlant.id;
    });

    it('should water a plant successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/my-plants/${plantId}/water`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.myPlant).toHaveProperty('id', plantId);
    });

    it('should return 404 for non-existent my-plant', async () => {
      const res = await request(app)
        .post('/api/v1/my-plants/999999/water')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('errorCode');
    });
  });

  // ── Fertilize ──
  describe('POST /api/v1/my-plants/:id/fertilize', () => {
    let plantId = 0;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/my-plants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plantId: 3 })
        .expect(201);
      plantId = res.body.data.myPlant.id;
    });

    it('should fertilize a plant successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/my-plants/${plantId}/fertilize`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.myPlant).toHaveProperty('id', plantId);
    });

    it('should return 404 for non-existent my-plant', async () => {
      const res = await request(app)
        .post('/api/v1/my-plants/999999/fertilize')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('errorCode');
    });
  });

  // ── Upcoming Care ──
  describe('GET /api/v1/my-plants/care/upcoming', () => {
    it('should return upcoming care tasks', async () => {
      const res = await request(app)
        .get('/api/v1/my-plants/care/upcoming')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .get('/api/v1/my-plants/care/upcoming')
        .expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });
  });

  // ── Calendar Care ──
  describe('GET /api/v1/my-plants/care/calendar', () => {
    it('should return calendar care tasks', async () => {
      const startDate = new Date(Date.now() - 86400000).toISOString();
      const endDate = new Date(Date.now() + 86400000).toISOString();
      const res = await request(app)
        .get(
          `/api/v1/my-plants/care/calendar?startDate=${startDate}&endDate=${endDate}`
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject invalid date range with 422', async () => {
      const res = await request(app)
        .get(
          '/api/v1/my-plants/care/calendar?startDate=invalid&endDate=alsoinvalid'
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(422);

      expect(res.body).toHaveProperty('errorCode');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .get('/api/v1/my-plants/care/calendar')
        .expect(401);

      expect(res.body).toHaveProperty('errorCode', 'UNAUTHORIZED');
    });
  });

  // ── Image Identification ──
  describe('POST /api/v1/my-plants/identify', () => {
    it('should submit identification successfully with mock image', async () => {
      const mockImage = Buffer.from('fake-image-data');
      const res = await request(app)
        .post('/api/v1/my-plants/identify')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', mockImage, 'test.jpg')
        .expect(201);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('recordId');
      expect(res.body.data).toHaveProperty('myPlant');
    });
  });

  // ── MyPlant Diagnosis ──
  describe('MyPlant Diagnoses', () => {
    let testMyPlantId = 0;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/my-plants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plantId: 4 })
        .expect(201);
      testMyPlantId = res.body.data.myPlant.id;
    });

    it('should submit my-plant diagnosis successfully', async () => {
      const mockImage = Buffer.from('fake-image-data');
      const res = await request(app)
        .post(`/api/v1/my-plants/${testMyPlantId}/diagnose`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', mockImage, 'test.jpg')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('recordId');
      expect(res.body.data).toHaveProperty('status', 'pending');
    });

    it('should retrieve diagnoses for my-plant successfully', async () => {
      const res = await request(app)
        .get(`/api/v1/my-plants/${testMyPlantId}/diagnoses`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should update my-plant image successfully', async () => {
      const mockImage = Buffer.from('fake-image-data');
      const res = await request(app)
        .patch(`/api/v1/my-plants/${testMyPlantId}/image`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', mockImage, 'test.jpg')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.myPlant).toHaveProperty('imageUrl');
    });
  });
});
