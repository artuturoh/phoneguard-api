import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('PhoneGuard REST API - Endpoints', () => {
  describe('POST /v1/validate', () => {
    it('returns 200 with full phone contract for valid mobile', async () => {
      const res = await request(app)
        .post('/v1/validate')
        .send({ phone: '+34612345678' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.isValid, true);
      assert.equal(res.body.data.lineType, 'MOBILE');
      assert.equal(res.body.data.canReceiveSms, true);
      assert.equal(res.body.data.formats.e164, '+34612345678');
      assert.equal(res.body.data.formats.international, '+34 612 34 56 78');
      assert.equal(res.body.data.formats.national, '612 34 56 78');
      assert.equal(res.body.data.formats.rfc3966, 'tel:+34612345678');
      assert.equal(res.body.data.country.code, 'ES');
      assert.ok(Array.isArray(res.body.data.country.timezones));
      assert.equal(res.body.data.fraudAnalysis.recommendation, 'allow');
      assert.ok(res.body.meta.execution_time_ms !== undefined);
    });

    it('returns 200 with recommendation block for invalid phone', async () => {
      const res = await request(app)
        .post('/v1/validate')
        .send({ phone: '123' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.isValid, false);
      assert.equal(res.body.data.canReceiveSms, false);
      assert.equal(res.body.data.fraudAnalysis.recommendation, 'block');
      assert.ok(res.body.data.fraudAnalysis.riskScore >= 95);
    });

    it('returns 400 when phone parameter is missing', async () => {
      const res = await request(app)
        .post('/v1/validate')
        .send({});

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('returns 400 when defaultCountry code is not a 2-letter ISO code', async () => {
      const res = await request(app)
        .post('/v1/validate')
        .send({ phone: '+14155552671', defaultCountry: 'UNITED_STATES' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });
  });

  describe('GET /v1/validate', () => {
    it('returns 200 for valid query parameters', async () => {
      const res = await request(app)
        .get('/v1/validate?phone=%2B14155552671&country=US');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.isValid, true);
      assert.equal(res.body.data.formats.e164, '+14155552671');
      assert.equal(res.body.data.country.code, 'US');
    });

    it('returns 400 when phone query param is missing', async () => {
      const res = await request(app)
        .get('/v1/validate');

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });
  });

  describe('POST /v1/validate/batch', () => {
    it('validates up to 50 numbers in a single call', async () => {
      const payload = {
        numbers: [
          '+14155552671',
          { phone: '3312345678', defaultCountry: 'MX' },
          '+34612345678',
          '+18005550199'
        ]
      };

      const res = await request(app)
        .post('/v1/validate/batch')
        .send(payload);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.summary.total, 4);
      assert.equal(res.body.summary.valid, 4);
      assert.equal(res.body.data.length, 4);
      assert.ok(res.body.meta.execution_time_ms !== undefined);
    });

    it('rejects batch requests exceeding 50 items with 400 error', async () => {
      const oversizedBatch = Array.from({ length: 51 }, (_, i) => `+1415555${String(i).padStart(4, '0')}`);

      const res = await request(app)
        .post('/v1/validate/batch')
        .send({ numbers: oversizedBatch });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('rejects empty batch requests with 400 error', async () => {
      const res = await request(app)
        .post('/v1/validate/batch')
        .send({ numbers: [] });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });
  });
});
