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

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 15+ (running on `localhost:5432`)
- **Redis** 7+ (running on `localhost:6379`)
- **RabbitMQ** (optional, for queue workers)

## Docker (Standalone)

```bash
docker build -t plantera-api .
docker run -p 8000:8000 plantera-api
```

> The full stack with all services (PostgreSQL, Redis, RabbitMQ, MailHog, ML service) is available via Docker Compose in the [DEPI-Project](https://github.com/EssaMohy/DEPI-Project) parent repository.

## Running Locally

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL, Redis, and other credentials
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