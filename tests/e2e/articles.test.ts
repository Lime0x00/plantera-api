import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '#app/app';
import { container } from '#app/container';

describe('Articles endpoints', () => {
  let userToken = '';
  let adminToken = '';
  let articleId = 0;

  beforeAll(async () => {
    // 1. Create a regular user
    const userEmail = `user_art_${Date.now()}@test.com`;
    const userPassword = 'testpass123';
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Art',
        lastName: 'User',
        userName: `artuser_${Date.now()}`,
        email: userEmail,
        password: userPassword,
      });
    const userLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: userPassword });
    userToken = userLogin.body.data?.accessToken?.token || '';

    // 2. Create an admin user
    const adminEmail = `admin_art_${Date.now()}@test.com`;
    const adminPassword = 'testpass123';
    const adminRegister = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Art',
        lastName: 'Admin',
        userName: `artadmin_${Date.now()}`,
        email: adminEmail,
        password: adminPassword,
      });
    const adminId = adminRegister.body.data?.user?.id;

    // Elevate user role to admin in DB
    const authRepository = container.resolve('authRepository') as any;
    await authRepository.update({
      where: { id: adminId },
      data: { role: 'admin' },
    });

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    adminToken = adminLogin.body.data?.accessToken?.token || '';
  });

  describe('POST /api/v1/articles', () => {
    it('should reject non-admin users with 403', async () => {
      const res = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Unauthorized Article',
          content: 'This should not be allowed.',
        })
        .expect(403);

      expect(res.body).toHaveProperty('errorCode', 'FORBIDDEN');
    });

    it('should create an article successfully when admin', async () => {
      const res = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Plantera Care Tips',
          content: 'Keep your plants hydrated and happy.',
          excerpt: 'Quick care tips for your house plants.',
          published: true,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('Plantera Care Tips');
      articleId = res.body.data.id;
    });
  });

  describe('GET /api/v1/articles', () => {
    it('should return list of articles', async () => {
      const res = await request(app).get('/api/v1/articles').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/articles/:id', () => {
    it('should return article by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/articles/${articleId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Plantera Care Tips');
    });

    it('should return 404 for non-existent article', async () => {
      const res = await request(app).get('/api/v1/articles/999999').expect(404);

      expect(res.body).toHaveProperty('errorCode', 'RESOURCE_NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/articles/:id', () => {
    it('should update article successfully when admin', async () => {
      const res = await request(app)
        .patch(`/api/v1/articles/${articleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Plantera Care Guide V2',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Plantera Care Guide V2');
    });
  });

  describe('DELETE /api/v1/articles/:id', () => {
    it('should delete article successfully when admin', async () => {
      const res = await request(app)
        .delete(`/api/v1/articles/${articleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
