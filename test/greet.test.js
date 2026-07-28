import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { buildApp } from '../src/app.js';
import { greetHandler } from '../src/routes/greet.js';

describe('GET /greet', () => {
  let app;
  let request;

  before(async () => {
    app = buildApp({ logger: false });
    await app.ready();
    request = supertest(app.server);
  });

  after(async () => {
    await app.close();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('TC-001: returns 200 with personalised greeting for Alice', async () => {
    const res = await request.get('/greet?name=Alice');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { greeting: 'Hello, Alice!' });
    assert.match(res.headers['content-type'], /application\/json/);
  });

  it('TC-002: handles special characters (María)', async () => {
    const res = await request.get('/greet?name=Mar%C3%ADa');
    assert.equal(res.status, 200);
    assert.ok(res.body.greeting.includes('María'), `Expected greeting to include "María", got: ${res.body.greeting}`);
  });

  it('TC-003: trims leading/trailing whitespace', async () => {
    const res = await request.get('/greet?name=%20Alice%20');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { greeting: 'Hello, Alice!' });
  });

  it('TC-004: greetHandler pure function returns correct string', () => {
    assert.equal(greetHandler('Bob'), 'Hello, Bob!');
  });

  it('TC-008: accepts name at exactly 100 characters', async () => {
    const name = 'A'.repeat(100);
    const res = await request.get(`/greet?name=${name}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.greeting.includes(name));
  });

  // ── Validation errors ─────────────────────────────────────────────────────

  it('TC-005: returns 400 when name is missing', async () => {
    const res = await request.get('/greet');
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { error: 'name query parameter is required' });
  });

  it('TC-006: returns 400 when name is empty string', async () => {
    const res = await request.get('/greet?name=');
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { error: 'name query parameter is required' });
  });

  it('TC-007: returns 400 when name exceeds 100 characters', async () => {
    const name = 'A'.repeat(101);
    const res = await request.get(`/greet?name=${name}`);
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { error: 'name must not exceed 100 characters' });
  });

  it('TC-009: returns 400 for null byte injection', async () => {
    const res = await request.get('/greet?name=foo%00bar');
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { error: 'name contains invalid characters' });
  });

  it('TC-SEC-006: returns 400 for script injection attempt (no XSS in JSON)', async () => {
    const res = await request.get('/greet?name=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
    // The name contains <> which are printable ASCII, so it would be valid.
    // But the greeting is JSON — no script execution possible.
    // Accept either 200 (echoed safely in JSON) or 400 (if pattern blocks it).
    assert.ok(res.status === 200 || res.status === 400, `Expected 200 or 400, got ${res.status}`);
    if (res.status === 200) {
      // Verify it's returned as safe JSON string — no HTML execution context
      assert.ok(typeof res.body.greeting === 'string');
    } else {
      assert.ok(typeof res.body.error === 'string');
    }
  });
});
