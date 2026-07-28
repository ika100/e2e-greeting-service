import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { buildApp } from '../src/app.js';

describe('GET /health', () => {
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

  it('TC-010: returns 200 with status ok', async () => {
    const res = await request.get('/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
    assert.match(res.headers['content-type'], /application\/json/);
  });
});
