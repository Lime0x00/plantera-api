FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

FROM base AS development
ENV NODE_ENV=development PORT=8000
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 8000
CMD ["dumb-init", "npx", "nodemon", "--ext", "ts", "--exec", "npx", "tsx", "src/server.ts"]

FROM base AS builder
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --include=dev
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache dumb-init wget
ENV NODE_ENV=production PORT=8000

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/common/types/generated/prisma ./src/common/types/generated/prisma
COPY --from=builder /app/src/infrastructure/mail/templates /app/dist/src/infrastructure/mail/templates
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

COPY database/data/articles.json ./database/data/articles.json
COPY database/data/plants.json ./database/data/plants.json
COPY database/data/diseases.json ./database/data/diseases.json
COPY database/data ./dist/database/data

# Source files needed by seeders (run via tsx during startup)
COPY --from=builder /app/src ./src

EXPOSE 8000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["dumb-init", "node", "dist/src/server.cjs"]
