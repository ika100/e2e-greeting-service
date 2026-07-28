/**
 * Greeting route plugin
 * GET /greet?name=X → { "greeting": "Hello, X!" }
 */

const schema = {
  querystring: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        // Printable characters only: no control chars, no null bytes
        pattern: '^[\\x20-\\x7E\\u00A0-\\uFFFF]+$',
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: { greeting: { type: 'string' } },
    },
  },
};

/**
 * Pure greeting handler — exported for unit testing.
 * @param {string} name
 * @returns {string}
 */
export function greetHandler(name) {
  return `Hello, ${name}!`;
}

export default async function greetRoutes(app) {
  app.get('/greet', { schema }, async (request, _reply) => {
    const trimmedName = request.query.name.trim();
    // After trimming, check if the name is empty
    if (!trimmedName) {
      const err = new Error('name query parameter is required');
      err.statusCode = 400;
      throw err;
    }
    return { greeting: greetHandler(trimmedName) };
  });
}
