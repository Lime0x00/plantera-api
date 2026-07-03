# =============================================================================
# DEPI Backend Dockerfile
# Supports: development, builder, production stages
# =============================================================================

# =============================================================================
# Base stage - shared dependencies
# =============================================================================
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# =============================================================================
# Development stage - hot reload with nodemon + tsx
# =============================================================================
FROM base AS development
ENV NODE_ENV=development \
    PORT=8000

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npx prisma generate

EXPOSE 8000
CMD ["dumb-init", "npx", "nodemon", "--ext", "ts", "--exec", "npx", "tsx", "src/server.ts"]

# =============================================================================
# Builder stage - compile TypeScript for production
# =============================================================================
FROM base AS builder
ENV NODE_ENV=production \
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/depiplant

COPY package.json package-lock.json* ./
RUN npm install --include=dev

COPY . .
RUN npx prisma generate && npm run build

# =============================================================================
# Production stage - lightweight runtime
# =============================================================================
FROM node:22-alpine AS production
WORKDIR /app

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production \
    PORT=8000

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npx prisma generate && npm cache clean --force && \
    printf 'export * from "./index.js";\n' > /app/src/common/types/generated/prisma/client.ts

COPY --from=builder /app/dist ./dist

# Source files needed by seeders (run via tsx during startup)
COPY --from=builder /app/src ./src

EXPOSE 8000

COPY --from=builder /app/database ./database
CMD ["dumb-init", "sh", "-c", "npx prisma migrate deploy && npm run seed && node dist/server.js"]