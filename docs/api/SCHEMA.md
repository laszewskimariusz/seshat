# Seshat — Database Schema (Prisma)

Default provider: **SQLite**
Switch to PostgreSQL or MySQL by changing `DATABASE_URL` + `provider` in `schema.prisma`.

---

## schema.prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

// ─────────────────────────────────────────
// DEFAULT: SQLite — zero config, single file
// To switch: change provider + DATABASE_URL
// ─────────────────────────────────────────
datasource db {
  provider = "sqlite"
  // "postgresql" | "mysql" | "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           String      @id @default(cuid())
  email        String      @unique
  passwordHash String
  displayName  String?
  createdAt    DateTime    @default(now())
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
  mdPath    String?  // relative path to .md file on disk
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
  id         String      @id @default(cuid())
  nodeId     String
  node       Node        @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  userId     String
  name       String
  port       Int
  protocol   String      @default("http")  // http | https | tcp
  ip         String?     // null = inherit node IP
  shareIp    Boolean     @default(true)
  createdAt  DateTime    @default(now())
  statusLogs StatusLog[]
}

model StatusLog {
  id         String   @id @default(cuid())
  serviceId  String
  service    Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  status     String   // online | offline | unknown
  latencyMs  Int?
  errorMsg   String?
  checkedAt  DateTime @default(now())
}
```

---

## Switching from SQLite to PostgreSQL

Only two changes needed:

**1. `prisma/schema.prisma`** — change provider:
```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

**2. `.env`** — change DATABASE_URL:
```env
# Before (SQLite)
DATABASE_URL="file:./data/seshat.db"

# After (PostgreSQL)
DATABASE_URL="postgresql://seshat:password@localhost:5432/seshat"
```

Then run:
```bash
npx prisma migrate dev
```

That's it. No code changes.

---

## Switching to MySQL

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```
```env
DATABASE_URL="mysql://seshat:password@localhost:3306/seshat"
```

---

## SQLite WAL Mode (Performance)

For SQLite, enable WAL mode for better concurrent read performance.
Add to `src/lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Enable WAL mode for SQLite
db.$executeRawUnsafe('PRAGMA journal_mode=WAL;').catch(() => {})
// Increase busy timeout to handle concurrent requests
db.$executeRawUnsafe('PRAGMA busy_timeout=5000;').catch(() => {})

export { db }
```
