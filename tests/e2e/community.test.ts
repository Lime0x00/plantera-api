import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '#app/app';

describe('Community (Posts & Comments) endpoints', () => {
  let authToken = '';
  let postId = 0;
  let commentId = 0;

  beforeAll(async () => {
    const email = `comm_${Date.now()}@test.com`;
    const password = 'testpass123';
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Comm',
        lastName: 'User',
        userName: `commuser_${Date.now()}`,
        email,
        password,
      });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });
    authToken = loginRes.body.data?.accessToken?.token || '';
  });

  describe('POST /api/v1/posts', () => {
    it('should create a community post successfully', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'My monstera leaf is turning yellow!',
          content:
            'Need some advice on watering frequency for my monstera deliciosa.',
          category: 'Help',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('My monstera leaf is turning yellow!');
      postId = res.body.data.id;
    });

    it('should reject invalid inputs with 422', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '', // Empty title
        })
        .expect(422);

      expect(res.body).toHaveProperty('errorCode', 'VALIDATION_FAILED');
    });
  });

  describe('GET /api/v1/posts', () => {
    it('should return list of posts', async () => {
      const res = await request(app).get('/api/v1/posts').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/posts/:id', () => {
    it('should return post by ID', async () => {
      const res = await request(app).get(`/api/v1/posts/${postId}`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('My monstera leaf is turning yellow!');
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app).get('/api/v1/posts/999999').expect(404);

      expect(res.body).toHaveProperty('errorCode', 'RESOURCE_NOT_FOUND');
    });
  });

  describe('POST /api/v1/posts/:postId/like', () => {
    it('should toggle like on post successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Post liked.');

      // Toggle off (unlike)
      const res2 = await request(app)
        .post(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res2.body.success).toBe(true);
      expect(res2.body.message).toBe('Like removed.');
    });
  });

  describe('Comments operations', () => {
    it('should add a comment to a post', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'You might be overwatering it. Let the top soil dry out.',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.content).toBe(
        'You might be overwatering it. Let the top soil dry out.'
      );
      commentId = res.body.data.id;
    });

    it('should list comments for a post', async () => {
      const res = await request(app)
        .get(`/api/v1/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].id).toBe(commentId);
    });

    it('should delete comment successfully', async () => {
      const res = await request(app)
        .delete(`/api/v1/posts/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/posts/:id', () => {
    it('should update post successfully', async () => {
      const res = await request(app)
        .patch(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'My monstera leaf is turning yellow! (Updated)',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(
        'My monstera leaf is turning yellow! (Updated)'
      );
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    it('should delete post successfully', async () => {
      const res = await request(app)
        .delete(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
