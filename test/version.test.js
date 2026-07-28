/**
 * Tests for GET /version endpoint
 * TC-VER-001, TC-VER-002, TC-VER-003
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { buildApp } from '../src/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf8')
);

describe('GET /version', () => {
  let app;

  before(async () => {
    app = buildApp({ logger: false });
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  // TC-VER-001: Successful response — 200 OK with correct shape
  it('TC-VER-001: returns 200 OK with correct response shape', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/version',
    });

    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.equal(typeof body.name, 'string', 'name should be a string');
    assert.equal(typeof body.version, 'string', 'version should be a string');
    assert.equal(typeof body.gitUrl, 'string', 'gitUrl should be a string');
    assert.equal(body.name, 'greeting-service');
    assert.equal(body.gitUrl, 'https://github.com/ika100/e2e-greeting-service');
  });

  // TC-VER-002: Version read from package.json
  it('TC-VER-002: version matches package.json version', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/version',
    });

    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.equal(body.version, pkg.version);
  });

  // TC-VER-003: Endpoint accessible without auth
  it('TC-VER-003: endpoint is accessible without authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/version',
    });

    // Should not return 401 or 403
    assert.notEqual(response.statusCode, 401, 'should not require auth');
    assert.notEqual(response.statusCode, 403, 'should not be forbidden');
    assert.equal(response.statusCode, 200);
  });
});
