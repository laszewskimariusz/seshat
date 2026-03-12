# Seshat — Database Configuration

Seshat uses **Prisma ORM**, which supports SQLite, PostgreSQL, and MySQL.
Switching databases requires changing **two lines** — no code changes.

---

## Default: SQLite

Zero config. Works out of the box. The database is a single file stored in the Docker volume.

```env
DATABASE_URL="file:./data/seshat.db"
```

**Best for:** Single-user or small household homelab setups.

---

## Switch to PostgreSQL

**When to use:** You already have a PostgreSQL instance running (e.g. on your NAS or a shared homelab DB server), or you want better concurrent write performance.

**Step 1** — Change `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

**Step 2** — Update `.env`:
```env
DATABASE_URL="postgresql://seshat_user:yourpassword@192.168.1.50:5432/seshat"
```

**Step 3** — Run migrations:
```bash
# If running directly:
npx prisma migrate deploy

# If using Docker Compose, migrations run automatically on startup
docker compose up -d
```

**docker-compose.yml addition** (if you want Postgres in the same Compose file):
```yaml
services:
  app:
    # ... existing config ...
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    container_name: seshat-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: seshat_user
      POSTGRES_PASSWORD: yourpassword
      POSTGRES_DB: seshat
    volumes:
      - seshat-pg:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U seshat_user -d seshat"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  seshat-data:
  seshat-pg:
```

---

## Switch to MySQL / MariaDB

**Step 1** — Change `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

**Step 2** — Update `.env`:
```env
DATABASE_URL="mysql://seshat_user:yourpassword@192.168.1.50:3306/seshat"
```

**Step 3** — Run migrations (same as Postgres above).

---

## Migrating data from SQLite to PostgreSQL

There is no automated migration tool included yet (Phase 2 backlog: WI-XX).
Manual approach:
1. Export your cluster `.md` files from `data/users/` — these are the source of truth
2. Set up PostgreSQL and run migrations
3. Re-register your user and re-import `.md` files via the UI (import feature: Phase 2)

For now, the simplest path is to start fresh with PostgreSQL and re-enter your clusters.
The `.md` files are human-readable and can be referenced during manual re-entry.
