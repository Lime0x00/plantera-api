# Plantera Backend API

REST API for the Plantera ecosystem — serves the web client, coordinates DB transactions, caching, mail queues, and delegates ML tasks to the plant-analyzer service.

## Quick Start (Docker Standalone)

Runs backend + PostgreSQL + Redis + RabbitMQ:

```bash
docker compose -f compose.yml up -d --build
```

For dev mode (includes MailHog + hot-reload):

```bash
docker compose -f compose.yml -f compose.override.yml up -d --build
```

Wait ~45s for migrations + seeds to complete. API at `http://localhost:8000`.

On first start, the entrypoint automatically:
1. Runs Prisma migrations (3 migration files)
2. Seeds the database (47 plants, 6 diseases, 8 articles, admin user)

Seeds are idempotent — safe to restart.

## Development Mode

```bash
docker compose -f compose.yml -f compose.override.yml up -d --build
```

Hot-reload on file changes (nodemon + tsx). Backend at `http://localhost:8001`.

| Service | Production | Dev |
|---------|-----------|-----|
| Backend | 8000 | 8001 |
| RabbitMQ mgmt | 15672 | 15674 |
| MailHog SMTP | 1025 | 25025 |
| MailHog web | 8025 | 25026 |

## Running Locally (Without Docker)

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### 2. Configure

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run seed
```

### 3. Run

```bash
npm run dev
```

API at `http://localhost:8000`. Swagger UI at `http://localhost:8000/api/v1/docs`.

### Worker

```bash
npm run dev:worker
```

## Database

- **ORM**: Prisma v7 with `prisma.config.ts` (URL not set in `schema.prisma`)
- **Migrations**: `prisma/migrations/` — 3 files (core, activity, community tables)
- **Seed**: `database/seeders/main.seeder.ts` — compiled to `dist/database/seeders/main.seeder.cjs`, called via `node -e "require('...').mainSeeder()"` in entrypoint

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | `8000` | API port |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `REDIS_HOST` | `redis` | Redis host |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3001` | CORS origins |
| `ANALYZER_URL` | `http://plant-analyzer:5000/v1` | ML service URL |
| `JWT_SECRET` | — | JWT signing key |
| `MAIL_HOST` | `mailhog` | SMTP host |

## API Documentation

- Interactive Swagger UI: `http://localhost:8000/api/v1/docs`
- Raw OpenAPI JSON: `http://localhost:8000/api/v1/openapi.json`

## Tech Stack

- **Runtime**: Node.js / TypeScript
- **Framework**: Express.js
- **ORM**: Prisma v7 (PostgreSQL)
- **Cache**: Redis (ioredis)
- **Queue**: BullMQ / RabbitMQ
- **DI**: Awilix
- **Build**: tsup (CJS output)
- **Testing**: Vitest

## Project Structure

```
src/
├── config/           # App configuration
├── features/         # Feature modules (auth, community, garden, etc.)
├── infrastructure/   # DB drivers, websocket gateways
├── middleware/       # Auth, validation, error handling
├── routes/          # Router composition
├── container.ts     # Awilix DI registration
├── app.ts           # Express bootstrap
└── server.ts        # Entrypoint
database/
├── data/            # Seed data (plants.json, diseases.json, articles.json)
├── seeders/         # TypeScript seed modules (compiled to dist/)
└── migrations/      # Prisma migration files
```
