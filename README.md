# Plantera API

REST API for Plantera — plant care & disease detection platform. Express + Prisma + PostgreSQL + Socket.IO.

---

## Quick Start (Docker)

**Requirements:** PostgreSQL 15+ (local or cloud)

```bash
# 1. Clone
git clone https://github.com/Lime0x00/plantera-api.git
cd plantera-api

# 2. Configure
cp .env.example .env
# Edit .env — set DATABASE_URL to your PostgreSQL connection string

# 3. Build
docker build -t plantera-api .

# 4. Run
docker run -p 8000:8000 -v $(pwd)/.env:/app/.env plantera-api
```

The container does everything automatically:
1. Runs database migrations
2. Seeds catalog data (47 plants, 6 diseases)
3. Starts the server

**Verify:** `curl http://localhost:8000/health` → `{"status":"ok"}`

**Register a user:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"Pass123!","userName":"myuser","firstName":"Your","lastName":"Name"}'
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `REDIS_HOST` | No | `localhost` | Redis host (optional, caching) |
| `ALLOWED_ORIGINS` | No | `*` | CORS origins |
| `JWT_SECRET` | No | (auto) | JWT signing key |
| `ANALYZER_URL` | No | `http://localhost:5000/v1` | ML service URL |

Full list in `.env.example`.

---

## With Plant Analyzer (ML Disease Detection)

```bash
# Create shared network
docker network create plantera-net

# Start ML service
docker run -d --network plantera-net --name plant-analyzer -p 5000:5000 plant-analyzer

# Start backend on same network
docker run --network plantera-net -p 8000:8000 \
  -v $(pwd)/.env:/app/.env \
  -e ANALYZER_URL=http://plant-analyzer:5000/v1 \
  plantera-api
```

---

## Running Locally (No Docker)

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Server at `http://localhost:8000`.

---

## API Docs

- Swagger UI: `http://localhost:8000/api/v1/docs`
- OpenAPI spec: `http://localhost:8000/api/v1/openapi.json`

---

## Project Structure

```
src/
├── config/            # Config loaders
├── features/          # Auth, Plants, Profile, Community
│   └── [name]/
│       ├── [name].controller.ts
│       ├── [name].service.ts
│       └── [name].routes.ts
├── infrastructure/    # DB, Redis, Mail, Queue, WebSocket
├── framework/         # Middleware, Context, DI container
├── common/            # Types, helpers, errors, constants
├── app.ts             # Express bootstrap
└── server.ts          # Entry point
prisma/
└── schema.prisma
database/
└── seeders/           # Catalog seed data
```
