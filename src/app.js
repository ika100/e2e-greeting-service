// Fastify application factory
// Export buildApp for testing; server.js calls it for production.
import Fastify from 'fastify';

/**
 * Build and return a configured Fastify instance.
 * @param {import('fastify').FastifyServerOptions} opts
 * @returns {import('fastify').FastifyInstance}
 */
export function buildApp(opts = {}) {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL || 'info' },
    ...opts,
  });

  // 404 handler
  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ error: 'Not Found' });
  });

  // Global error serialiser — always return { "error": "<message>" }
  app.setErrorHandler((err, _request, reply) => {
    const statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Map AJV validation errors to human-readable messages
    if (statusCode === 400 && err.validation) {
      const v = err.validation[0];
      if (v) {
        if (v.keyword === 'required' || v.keyword === 'minLength') {
          message = 'name query parameter is required';
        } else if (v.keyword === 'maxLength') {
          message = 'name must not exceed 100 characters';
        } else if (v.keyword === 'pattern') {
          message = 'name contains invalid characters';
        }
      }
    }

    reply.code(statusCode).send({ error: message });
  });

  // Register routes
  app.register(import('./routes/health.js'));
  app.register(import('./routes/greet.js'));
  app.register(import('./routes/version.js'));

  return app;
}
