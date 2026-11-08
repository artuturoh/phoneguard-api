import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Security - RapidAPI Proxy Secret Enforcement', () => {
  const originalSecret = process.env.RAPIDAPI_PROXY_SECRET;

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.RAPIDAPI_PROXY_SECRET = originalSecret;
    } else {
      delete process.env.RAPIDAPI_PROXY_SECRET;
    }
  });

  it('allows public routes (/health, /) without requiring proxy secret', async () => {
    process.env.RAPIDAPI_PROXY_SECRET = 'secret-key-prod-123';

    const healthRes = await request(app).get('/health');
    assert.equal(healthRes.status, 200);

    const rootRes = await request(app).get('/').set('Accept', 'application/json');
    assert.equal(rootRes.status, 200);
  });

  it('rejects /v1 requests with 401 when proxy secret header is missing', async () => {
    process.env.RAPIDAPI_PROXY_SECRET = 'secret-key-prod-123';

    const res = await request(app)
      .post('/v1/validate')
      .send({ phone: '+14155552671' });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('rejects /v1 requests with 401 when proxy secret header is incorrect', async () => {
    process.env.RAPIDAPI_PROXY_SECRET = 'secret-key-prod-123';

    const res = await request(app)
      .post('/v1/validate')
      .set('X-RapidAPI-Proxy-Secret', 'wrong-secret')
      .send({ phone: '+14155552671' });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('accepts /v1 requests when proxy secret header matches environment variable', async () => {
    process.env.RAPIDAPI_PROXY_SECRET = 'secret-key-prod-123';

    const res = await request(app)
      .post('/v1/validate')
      .set('X-RapidAPI-Proxy-Secret', 'secret-key-prod-123')
      .send({ phone: '+14155552671' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.isValid, true);
  });
});
