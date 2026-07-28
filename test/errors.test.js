import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { buildApp } from '../src/app.js';

describe('Error handling', () => {
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

  it('TC-011: returns 404 for unknown routes', async () => {
    const res = await request.get('/unknown');
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'Not Found' });
    assert.match(res.headers['content-type'], /application\/json/);
  });

  it('TC-012: error envelope has "error" key (consistent format)', async () => {
    const res = await request.get('/greet');
    assert.equal(res.status, 400);
    assert.match(res.headers['content-type'], /application\/json/);
    assert.ok(typeof res.body.error === 'string', 'body.error should be a string');
  });
});
