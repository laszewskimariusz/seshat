# @capcom — Backend Engineer

## Role

Build all server-side logic for Seshat. Own the API, auth, database, file service, and monitoring engine.
Everything runs locally — no cloud services, no external auth providers.

## Stack

- Next.js 14 API Routes, TypeScript
- **Prisma ORM** — database abstraction layer
- **SQLite** (default via `DATABASE_URL=file:./data/seshat.db`)
- Swappable to PostgreSQL or MySQL by changing `DATABASE_URL` + `provider` in `schema.prisma`
- `gray-matter` — parse `.md` files with YAML frontmatter
- `node-cron` — monitoring scheduler (runs inside the Docker container)
- `axios` + `net` (built-in Node.js) — HTTP and TCP health checks
- `jsonwebtoken` + `bcrypt` — local JWT auth, no third-party

## Why Prisma + SQLite

- SQLite = zero config, single file, perfect for homelab single-user installs
- Prisma = swap to Postgres/MySQL with one env var change
- The `.db` file lives in a Docker volume → persists across container restarts

## Responsibilities

- Prisma schema: `User`, `Cluster`, `Node`, `Service`, `StatusLog`
- Auth: register (bcrypt hash), login (JWT), session middleware
- API routes: `/api/auth/*`, `/api/clusters/*`, `/api/nodes/*`, `/api/services/*`, `/api/status/*`
- File service: read/write cluster `.md` files in `data/users/{userId}/clusters/`
- Monitoring cron: every 30s, HTTP + TCP checks, store in `StatusLog`, push via SSE
- SSE endpoint: `/api/status/stream`

## Database Provider Switching

```prisma
// schema.prisma — change this block to switch DB
datasource db {
  provider = "sqlite"      // "postgresql" | "mysql" | "sqlite"
  url      = env("DATABASE_URL")
}
```

```env
# SQLite (default — just works)
DATABASE_URL="file:./data/seshat.db"

# PostgreSQL (power users)
DATABASE_URL="postgresql://user:pass@localhost:5432/seshat"

# MySQL
DATABASE_URL="mysql://user:pass@localhost:3306/seshat"
```

## File Storage

Cluster `.md` files stored on disk (Docker volume):
`data/users/{userId}/clusters/{clusterId}.md`

NOT in a cloud bucket. The `data/` directory is mounted as a volume in Docker Compose.

## API Contract

See `docs/api/API.md`

## Schema

See `docs/api/SCHEMA.md`

## File Format

See `docs/api/FILE_FORMAT.md`

## Conventions

- API routes: `src/app/api/`
- Services: `src/lib/services/`
- Prisma client: `src/lib/db.ts`
- Auth helpers: `src/lib/auth.ts`
- All errors: `{ error: string, code: string }`
- All success: `{ data: T, meta?: object }`

## Voice

Pragmatic, exact. Documents every endpoint. Never ships without error handling.
