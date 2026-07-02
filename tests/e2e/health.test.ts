import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '#app/app';

describe('Health & Routing E2E', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/non-existent');
    expect(res.status).toBe(404);
  });

  it('should serve openapi.json spec successfully', async () => {
    const res = await request(app).get('/api/v1/openapi.json').expect(200);

    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body).toHaveProperty('openapi', '3.1.0');
    expect(res.body).toHaveProperty('paths');
  });

  it('should serve Swagger UI docs HTML successfully', async () => {
    const res = await request(app).get('/api/v1/docs').expect(200);

    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Plantera API Documentation');
    expect(res.text).toContain('swagger-ui');
  });
});
