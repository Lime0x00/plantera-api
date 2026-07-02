import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '#app/app';

describe('Diseases endpoints', () => {
  let existingDiseaseId = 0;

  beforeAll(async () => {
    const res = await request(app).get('/api/v1/diseases?limit=1');
    if (res.body.data?.length > 0) {
      existingDiseaseId = res.body.data[0].id;
    }
  });

  // ── List ──
  describe('GET /api/v1/diseases', () => {
    it('should return paginated disease list', async () => {
      const res = await request(app)
        .get('/api/v1/diseases?page=1&limit=5')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('page', 1);
      expect(res.body.meta).toHaveProperty('totalPages');
      expect(res.body.meta).toHaveProperty('totalCount');
    });

    it('should filter diseases by type', async () => {
      const res = await request(app)
        .get('/api/v1/diseases?type=Fungal')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should handle empty result for invalid type', async () => {
      const res = await request(app)
        .get('/api/v1/diseases?type=NonexistentTypeXYZ')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.totalCount).toBe(0);
    });
  });

  // ── Get By ID ──
  describe('GET /api/v1/diseases/:id', () => {
    it('should return a single disease by ID', async () => {
      if (!existingDiseaseId) return;

      const res = await request(app)
        .get(`/api/v1/diseases/${existingDiseaseId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('imageUrl');
    });

    it('should return 404 for non-existent disease', async () => {
      const res = await request(app).get('/api/v1/diseases/999999').expect(404);

      expect(res.body).toHaveProperty('errorCode', 'RESOURCE_NOT_FOUND');
      expect(res.body).toHaveProperty('success', false);
    });

    it('should return 404 for invalid id', async () => {
      const res = await request(app).get('/api/v1/diseases/0').expect(404);

      expect(res.body).toHaveProperty('errorCode');
    });
  });
});
