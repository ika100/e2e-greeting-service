/**
 * Version route plugin
 * GET /version → { "name": "greeting-service", "version": "<semver>", "gitUrl": "<url>" }
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf8')
);

const versionInfo = {
  name: pkg.name,
  version: pkg.version,
  gitUrl: 'https://github.com/ika100/e2e-greeting-service',
};

const schema = {
  response: {
    200: {
      type: 'object',
      required: ['name', 'version', 'gitUrl'],
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        gitUrl: { type: 'string', format: 'uri' },
      },
    },
  },
};

export default async function versionRoutes(app) {
  app.get('/version', { schema }, async (_request, _reply) => {
    return versionInfo;
  });
}
