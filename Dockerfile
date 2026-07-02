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
ENV NODE_ENV=production

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

COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/common/types/generated/prisma ./src/common/types/generated/prisma

EXPOSE 8000

CMD ["dumb-init", "node", "dist/server.js"]