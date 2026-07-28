# Stage 1: Install production dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production runtime image
FROM node:22-alpine AS runtime
WORKDIR /app

# Create non-root user/group
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy production deps and source
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json .

# Run as non-root
USER appuser

ENV PORT=3000
ENV NODE_ENV=production
ENV LOG_LEVEL=info

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
