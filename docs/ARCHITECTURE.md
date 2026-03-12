# Seshat — Architecture

Stack: Next.js 14 · TypeScript · Prisma · SQLite · Docker Compose · Local JWT

---

## Data Model

Prisma schema (SQLite default). Full schema at `prisma/schema.prisma`.

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  displayName  String?
  createdAt    DateTime  @default(now())
  clusters     Cluster[]
  statusLogs   StatusLog[]
}

model Cluster {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  type      String   // proxmox | docker | k8s | arm | bare-metal | vps
  color     String   @default("blue")
  emoji     String   @default("🖥️")
  cidr      String?
  posX      Int      @default(70)
  posY      Int      @default(70)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  nodes     Node[]
}

model Node {
  id        String    @id @default(cuid())
  clusterId String
  cluster   Cluster   @relation(fields: [clusterId], references: [id], onDelete: Cascade)
  userId    String
  name      String
  type      String    // vm | ct | docker | bare-metal
  ip        String
  os        String?
  emoji     String?
  notes     String?
  createdAt DateTime  @default(now())
  services  Service[]
}

model Service {
  id        String      @id @default(cuid())
  nodeId    String
  node      Node        @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  userId    String
  name      String
  port      Int
  protocol  String      @default("http") // http | https | tcp
  ip        String?     // null = inherit node.ip
  shareIp   Boolean     @default(true)
  createdAt DateTime    @default(now())
  statusLogs StatusLog[]
}

model StatusLog {
  id        String   @id @default(cuid())
  serviceId String
  service   Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    String   // online | offline | unknown
  latencyMs Int?
  errorMsg  String?
  checkedAt DateTime @default(now())
}
```

---

## API Route Map

All routes under `src/app/api/`. Auth required on all except `/api/auth/*` and `/api/health`.
Auth token stored as httpOnly cookie `seshat_token`.

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account (email + password) |
| POST | `/api/auth/login` | Login → set seshat_token cookie |
| POST | `/api/auth/logout` | Clear seshat_token cookie |
| GET  | `/api/auth/me` | Return current user from token |

### Clusters
| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/clusters` | List user's clusters with nodes |
| POST   | `/api/clusters` | Create cluster |
| GET    | `/api/clusters/[id]` | Get cluster + full node/service tree |
| PUT    | `/api/clusters/[id]` | Update cluster fields |
| PUT    | `/api/clusters/[id]/position` | Update canvas x/y only (drag-end) |
| DELETE | `/api/clusters/[id]` | Delete cluster (cascades) |

### Nodes
| Method | Route | Description |
|--------|-------|-------------|
| POST   | `/api/clusters/[id]/nodes` | Add node to cluster |
| PUT    | `/api/clusters/[id]/nodes/[nid]` | Update node |
| DELETE | `/api/clusters/[id]/nodes/[nid]` | Remove node (cascades) |

### Services
| Method | Route | Description |
|--------|-------|-------------|
| POST   | `/api/clusters/[id]/nodes/[nid]/services` | Add service |
| PUT    | `/api/clusters/[id]/nodes/[nid]/services/[sid]` | Update service |
| DELETE | `/api/clusters/[id]/nodes/[nid]/services/[sid]` | Remove service |

### Status / Monitoring
| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/status` | Latest cached status for all user's services |
| GET    | `/api/status/stream` | SSE stream — push updates on change |
| POST   | `/api/status/check` | Trigger immediate manual check |
| GET    | `/api/health` | DB health (used by Docker healthcheck) |

---

## Docker Compose Layout

```yaml
version: '3.9'

services:
  app:
    build: .
    container_name: seshat
    restart: unless-stopped
    ports:
      - "${PORT:-3000}:3000"
    volumes:
      - seshat-data:/app/data
    environment:
      DATABASE_URL: ${DATABASE_URL:-file:/app/data/seshat.db}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

volumes:
  seshat-data:
    name: seshat-data
```

**Key points:**
- Single container. No separate DB container needed — SQLite is embedded.
- `./data` volume persists the SQLite file across container restarts/upgrades.
- `DATABASE_URL=file:/app/data/seshat.db` — absolute path inside container.
- `JWT_SECRET` must be set in `.env`. Generate: `openssl rand -base64 32`.
- Prisma migrations run automatically on container startup via entrypoint.

---

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────┐
│  Node.js server process                             │
│                                                     │
│  node-cron (every 30s)                              │
│    └─► monitorService.checkAll(userId)              │
│           ├─► HTTP check: axios.get(url, {timeout:5000})  │
│           │     target: http://192.168.x.x:port     │
│           └─► TCP check: net.createConnection(ip,port)    │
│                                                     │
│  Results:                                           │
│    ├─► statusCache: Map<serviceId, StatusResult>    │
│    │     (in-memory, latest status per service)     │
│    └─► StatusLog (SQLite via Prisma)                │
│          (historical record, pruned after 7 days)   │
│                                                     │
│  SSE clients: Map<userId, Set<Response>>            │
│    ├─► on status change → push to all client streams│
│    └─► GET /api/status/stream connects here         │
└─────────────────────────────────────────────────────┘
```

**Flow:**
1. `node-cron` fires every 30 seconds.
2. For each user's services, determine check type:
   - `http` / `https` → `axios.get` with 5s timeout. Online if 2xx/3xx.
   - `tcp` → `net.createConnection(port, ip)` with 5s timeout. Online if connected.
3. Result `{ serviceId, status, latencyMs, checkedAt }` written to:
   - `statusCache` Map (memory, overwrite previous)
   - `StatusLog` table (append, for history)
4. If status changed since last check → push event to all open SSE connections for that user.
5. `GET /api/status` returns current `statusCache` snapshot.
6. `GET /api/status/stream` registers a `Response` in SSE clients map, streams events until disconnect.

**Key files:**
- `src/lib/monitor.ts` — checkAll(), HTTP check, TCP check, statusCache
- `src/lib/sse.ts` — SSE client registry, broadcast()
- `src/app/api/status/route.ts` — GET snapshot
- `src/app/api/status/stream/route.ts` — SSE endpoint

---

## Gap Analysis

### What exists (as of 2026-03-12)

| Item | Status |
|------|--------|
| `seshat/README.md` | ✅ Done — correct stack, quickstart, env vars |
| `seshat/docs/DOCKER.md` | ✅ Done — full Docker setup, backup, reverse proxy |
| `seshat/docs/DATABASE.md` | ✅ Done — SQLite/PostgreSQL/MySQL switching guide |
| `seshat/docs/api/SCHEMA.md` | ✅ Done — full Prisma schema documented |
| `seshat/docs/api/API.md` | ✅ Done — all endpoints documented |
| `seshat/docs/api/FILE_FORMAT.md` | ⚠️ Stale — references old `.md` file format, not needed |
| `seshat/.env.example` | ✅ Done — JWT_SECRET, DATABASE_URL |
| `.squad/` agent config | ✅ Done — team, charters, skills, routing |
| `PROJECT.md` | ✅ Fixed — now reflects SQLite/Prisma/Docker stack |
| `seshat/docs/ARCHITECTURE.md` (this file) | ✅ Done — just created |

### What's missing (not yet built)

| Item | WI | Priority |
|------|----|----------|
| Next.js project init (`package.json`, `src/`, `app/`) | WI-01 | P0 |
| `prisma/schema.prisma` (actual file, not just docs) | WI-02 | P0 |
| Prisma migrations (`prisma/migrations/`) | WI-02 | P0 |
| `docker-compose.yml` (actual file) | WI-01 | P0 |
| `Dockerfile` | WI-01 | P0 |
| `src/lib/db.ts` — Prisma client singleton | WI-03 | P0 |
| `src/lib/auth.ts` — JWT sign/verify, bcrypt | WI-02 | P0 |
| `src/middleware.ts` — route protection | WI-02 | P0 |
| Auth API routes (`/api/auth/*`) | WI-02 | P0 |
| Cluster CRUD API routes | WI-04 | P0 |
| Node CRUD API routes | WI-05 | P0 |
| Service CRUD API routes | WI-05 | P0 |
| `src/lib/monitor.ts` — cron + checks | WI-06 | P0 |
| `src/lib/sse.ts` — SSE client registry | WI-06 | P0 |
| Status API routes (`/api/status`, `/api/status/stream`) | WI-06 | P0 |
| Login / Register pages (`/`, `/register`) | WI-07 | P0 |
| Main canvas page (`/app`) | WI-08 | P0 |
| UI components (ClusterCard, NodeCard, DetailPanel, modals) | WI-09 | P0 |
| Live status UI (SSE connect, status dots) | WI-10 | P0 |
| Tests (unit, integration, E2E) | WI-11 | P1 |
| `docs/api/FILE_FORMAT.md` | — | Remove/archive (no longer relevant) |

### Next action
Start WI-01 (project bootstrap): `@archie Read PROJECT.md and start WI-01`
