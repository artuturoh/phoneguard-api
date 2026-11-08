import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Landing Page & Content Negotiation', () => {
  it('serves modern HTML landing page when client accepts text/html', async () => {
    const res = await request(app)
      .get('/')
      .set('Accept', 'text/html');

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /html/);
    assert.match(res.text, /PhoneGuard/);
    assert.match(res.text, /All Systems Operational/);
    assert.match(res.text, /Interactive API Playground/);
    assert.match(res.text, /Tailwind CSS/);
  });

  it('serves JSON service metadata when client accepts application/json', async () => {
    const res = await request(app)
      .get('/')
      .set('Accept', 'application/json');

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /json/);
    assert.equal(res.body.service, 'PhoneGuard API');
    assert.equal(res.body.status, 'operational');
    assert.ok(res.body.endpoints);
  });

  it('provides microservice healthcheck with uptime and memory metrics', async () => {
    const res = await request(app).get('/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.service, 'PhoneGuard API');
    assert.ok(typeof res.body.uptime_seconds === 'number');
    assert.ok(typeof res.body.memory_mb.rss === 'number');
    assert.ok(typeof res.body.memory_mb.heap_used === 'number');
  });

  it('returns Helmet security headers including configured CSP for Tailwind CDN', async () => {
    const res = await request(app).get('/');

    assert.ok(res.headers['content-security-policy']);
    assert.match(res.headers['content-security-policy'], /cdn\.tailwindcss\.com/);
    assert.match(res.headers['content-security-policy'], /fonts\.googleapis\.com/);
  });
});
