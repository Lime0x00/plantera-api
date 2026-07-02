# Plantera Core API Backend Service

This is the primary REST API backend for the Plantera ecosystem. It serves requests from both the web client, coordinating database transactions, real-time caching, mail queues, and delegating machine learning tasks to the plant-analyzer microservice.

---

## Tech Stack & Dependencies

- **Runtime**: Node.js & TypeScript
- **Web Framework**: Express.js
- **Database ORM**: Prisma ORM with PostgreSQL
- **Caching & Blacklists**: Redis
- **Dependency Injection**: Awilix Container
- **Testing Suite**: Vitest (Unit & E2E Integration)
- **OpenAPI Documentation**: Swagger UI served dynamically via the OpenAPI 3.1.0 spec.

---

## Running with Docker (Recommended)

### Development Mode with Hot Reload

```bash
# From the root directory, build and start
docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml build backend
docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml up -d backend

# View logs
docker compose --env-file .env.dev logs -f backend

# Stop
docker compose stop backend
```

The backend will be available at http://localhost:8000 with hot-reload enabled. Code changes sync automatically via bind mounts.

### Production Mode

```bash
# Build optimized image
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml build backend

# Start
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml up -d backend
```

The backend will be available at http://localhost:8000.

### Environment Variables

The Docker templates live in `apps/backend/.env.docker`.
Copy them to `apps/backend/.env` for the normal Docker stack or `apps/backend/.env.dev` for the dev override stack.

For local development without Docker, configure in `apps/backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/depiplant
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
ANALYZER_URL=http://localhost:5000/v1
```

---

## Running Locally (Without Docker)

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL and Redis credentials
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 4. Run Development Server

```bash
npm run dev
```

The API gateway listens on http://localhost:8000

### 5. Run Tests

```bash
npm run test
```

---

## API Documentation & Swagger UI

The backend serves its own documentation dynamically:

- **Interactive Docs UI**: http://localhost:8000/api/v1/docs
- **Raw OpenAPI JSON Spec**: http://localhost:8000/api/v1/openapi.json

---

## Codebase Directory Layout

```text
apps/backend/
├── src/
│   ├── config/              # Environmental configuration loaders
│   ├── features/            # Feature modules (Auth, Garden, Profile, Social)
│   │   └── [feature_name]/
│   │       ├── [name].controller.ts
│   │       ├── [name].service.ts
│   │       ├── [name].routes.ts
│   │       └── dto/         # Request & Response Data Transfer Objects
│   ├── middleware/          # Rate limiting, validation, global error handlers
│   ├── openapi/             # JSON and YAML OpenAPI specifications (v1.json / v1.yaml)
│   ├── routes/              # Organizational root routers (v1.ts)
│   ├── utils/               # Loggers, token generators, and helper scripts
│   ├── container.ts         # Awilix Dependency Injection registration root
│   ├── app.ts               # Express application bootstrap configurations
│   └── server.ts            # Entrypoint listener
├── prisma/
│   └── schema.prisma        # Database schema
└── Dockerfile
```

---

## Architecture & Dependency Injection

Plantera Core API uses **Awilix** for loose-coupling and mockability during testing. All services, controllers, and database instances are resolved dynamically at startup.

To register new feature modules, update `src/container.ts` to bind your classes to the container lifecycle.

---

## Dockerfile Multi-Stage Build

The `Dockerfile` supports three build targets:

| Stage | Purpose | Use Case |
|-------|---------|----------|
| `development` | Hot-reload with nodemon/tsx | Docker dev mode |
| `builder` | Compiles TypeScript | Docker prod build |
| `production` | Lightweight runtime image | Docker prod run |

---

## OpenAPI Sync from Apidog

When updating endpoints on Apidog, sync the local specification files:

```bash
npm run openapi:sync
```

This exports from Apidog and compiles `v1.json` & `v1.yaml` (OAS 3.1.0).