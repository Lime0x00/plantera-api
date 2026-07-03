import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const dbDriver = process.env.DB_CONNECTION || 'postgresql';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'depiplant';

const computedUrl =
  process.env.DATABASE_URL ||
  `${dbDriver}://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: computedUrl,
  },
});
