import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import app from '#app/app';
import { container } from '#app/container';
import { QueueService } from '#infrastructure/queue/queue.service';
import { MlClient } from '#infrastructure/plant-analyzer-client';

describe('MyPlants Lifecycle Integration E2E', () => {
  let token = '';
  let recordId = 0;
  let myPlantId = 0;

  beforeAll(async () => {
    // Mock ML client calls to run independently of ML backend service
    vi.spyOn(MlClient.prototype, 'classify').mockResolvedValue({
      success: true,
      message: 'Classification successful',
      data: [{ class_name: 'Aloe Vera', class_id: 2, confidence: 0.98 }],
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

    // Register & Login a fresh user
    const email = `lifecycle_${Date.now()}@test.com`;
    const password = 'testpass123';
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Life',
        lastName: 'Cycle',
        userName: `lifecycle_${Date.now()}`,
        email,
        password,
      })
      .expect(201);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    token = loginRes.body.data?.accessToken?.token || '';
  });

  // Step 1: Upload image to identify
  it('should upload image for plant identification', async () => {
    const mockImage = Buffer.from('fake-image-data-lifecycle');
    const res = await request(app)
      .post('/api/v1/my-plants/identify')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', mockImage, 'plant.jpg')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('recordId');
    recordId = res.body.data.recordId;
  });

  // Step 2: Force complete the identification record in DB
  it('should force complete classification status in database', async () => {
    const diagnosticRepo = container.resolve('diagnosticRepository') as any;
    await diagnosticRepo.update({
      where: { id: recordId },
      data: {
        status: 'completed',
        result: {
          predictions: [
            {
              className: 'Aloe Vera',
              confidence: 0.98,
              plantId: 2, // Aloe Vera (from seeds)
            },
          ],
        },
      },
    });

    const record = await diagnosticRepo.findUnique({ where: { id: recordId } });
    expect(record.status).toBe('completed');
  });

  // Step 3: Confirm identification (which adds it to my-plants)
  it('should confirm identification and add to my-plants', async () => {
    const res = await request(app)
      .post('/api/v1/my-plants/identify/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recordId,
        predictionIndex: 0,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('myPlant');
    expect(res.body.data.myPlant.plant).toHaveProperty('id', 2);
    myPlantId = res.body.data.myPlant.id;
  });

  // Step 3b: Try to confirm the same identification again (should fail with 409)
  it('should reject double confirmation of the same record with 409', async () => {
    const res = await request(app)
      .post('/api/v1/my-plants/identify/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recordId,
        predictionIndex: 0,
      })
      .expect(409);

    expect(res.body).toHaveProperty('errorCode', 'CONFLICT');
  });

  // Step 4: List my-plants and verify it is there
  it('should list my-plants containing the confirmed plant', async () => {
    const res = await request(app)
      .get('/api/v1/my-plants')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const found = res.body.data.find((mp: any) => mp.id === myPlantId);
    expect(found).toBeDefined();
  });

  // Step 5: Check care schedule / upcoming tasks
  it('should get care schedule for my-plants', async () => {
    const res = await request(app)
      .get('/api/v1/my-plants/care/upcoming')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  // Step 6: Water and fertilize the plant
  it('should water the new plant', async () => {
    const res = await request(app)
      .post(`/api/v1/my-plants/${myPlantId}/water`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should fertilize the new plant', async () => {
    const res = await request(app)
      .post(`/api/v1/my-plants/${myPlantId}/fertilize`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  // Step 7: Diagnose the plant for diseases
  it('should diagnose the plant successfully', async () => {
    const mockImage = Buffer.from('fake-disease-image');
    const res = await request(app)
      .post(`/api/v1/my-plants/${myPlantId}/diagnose`)
      .set('Authorization', `Bearer ${token}`)
      .attach('image', mockImage, 'sick.jpg')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('recordId');
    expect(res.body.data).toHaveProperty('status', 'pending');
  });

  // Step 9: Get diagnoses history
  it('should get diagnoses history list', async () => {
    const res = await request(app)
      .get(`/api/v1/my-plants/${myPlantId}/diagnoses`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // Step 10: Delete the plant (soft-delete)
  it('should soft-delete the plant from user garden', async () => {
    await request(app)
      .delete(`/api/v1/my-plants/${myPlantId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify it is no longer listed
    const res = await request(app)
      .get('/api/v1/my-plants')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const found = res.body.data.find((mp: any) => mp.id === myPlantId);
    expect(found).toBeUndefined();
  });

  // Step 11: Re-add the same plant (should restore instead of crashing)
  it('should restore the soft-deleted plant upon re-adding', async () => {
    const res = await request(app)
      .post('/api/v1/my-plants')
      .set('Authorization', `Bearer ${token}`)
      .send({ plantId: 2 }) // Aloe Vera
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.myPlant).toHaveProperty('id', myPlantId); // Should reuse same ID!
  });
});
