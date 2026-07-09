#!/bin/sh
set -e

if [ "${DISABLE_DB_INIT}" != "true" ]; then
  echo "--- Initializing database ---"
  if command -v npx >/dev/null 2>&1 && npx prisma generate 2>/dev/null; then
    : # success
  else
    echo "WARNING: Prisma generate skipped (CLI not available)."
  fi

  if npx prisma migrate deploy 2>/dev/null; then
    echo "Migrations applied successfully."
  else
    DB_URL="${DB_CONNECTION:-postgresql}://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@${DB_HOST:-localhost}:${DB_PORT:-5432}/${DB_NAME:-plantera}"
    if DATABASE_URL="$DB_URL" npx prisma db push --accept-data-loss; then
      echo "Database synced via db push."
    else
      echo "WARNING: Database init failed — continuing anyway."
    fi
  fi

  echo "--- Seeding database ---"
  node -e "require('/app/dist/database/seeders/main.seeder.cjs').mainSeeder()" || echo "WARNING: Seed failed — continuing anyway."
fi

exec "$@"
