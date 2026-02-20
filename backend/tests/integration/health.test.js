import request from 'supertest';
import app from '../../src/index.js';

describe('health endpoint', () => {
  it('returns healthy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
  });
});
