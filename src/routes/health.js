/**
 * Health check route plugin
 * GET /health → { "status": "ok" }
 */
export default async function healthRoutes(app) {
  app.get('/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: { status: { type: 'string' } },
        },
      },
    },
  }, async (_request, _reply) => {
    return { status: 'ok' };
  });
}
