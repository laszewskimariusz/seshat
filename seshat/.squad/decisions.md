# Decisions Log — Seshat

_All architecture decisions recorded here by @archie. Dates filled in by @scribe after commit._

---

## ADR-001: Self-hosted only, no cloud
Date: TBD
Status: accepted
Context: Seshat monitors homelab services at local IPs (192.168.x.x, 10.x.x.x). These are unreachable from any cloud provider (Vercel, Railway, Render, etc.). A cloud-deployed app physically cannot ping a container running on your Proxmox box.
Decision: Seshat runs exclusively on-premises via Docker Compose. No cloud deployment path. Users run it on their server, NAS, or Raspberry Pi.
Consequences: Zero cloud costs. Works fully offline. Users must have Docker installed. No "just click deploy" button.

---

## ADR-002: SQLite default, Prisma for portability
Date: TBD
Status: accepted
Context: Homelab users range from single-person setups on a Pi to small households. Most don't want to manage a Postgres server just to run a network map. But power users with existing Postgres instances should be able to use it.
Decision: SQLite is the default database (`DATABASE_URL=file:./data/seshat.db`). Prisma ORM is the abstraction layer — switching to PostgreSQL or MySQL requires only changing `DATABASE_URL` and `provider` in `schema.prisma`. No code changes needed.
Consequences: Zero-config for most users. The `.db` file lives in a Docker volume. Power users can bring their own DB. Prisma migrations work identically across all supported providers.

---

## ADR-003: Data stored as .md files (human-readable)
Date: TBD
Status: accepted
Context: User explicitly wants cluster/node/service data in `.md` files with YAML frontmatter — readable without the app, easy to back up, git-friendly.
Decision: Each cluster = one `.md` file. Stored on disk in `data/users/{userId}/clusters/{clusterId}.md`. Parsed with `gray-matter`. SQLite is used as an index/cache layer (fast queries, status log) but `.md` files are the source of truth for cluster topology.
Consequences: Human-readable data. Easy backup (just copy the `data/` folder). Slight complexity in keeping `.md` and DB in sync — @capcom must ensure writes go to both.

---

## ADR-004: Local JWT auth (no third-party)
Date: TBD
Status: accepted
Context: No Supabase, no Auth0, no external auth service. App must work fully offline.
Decision: `bcrypt` password hashing, `jsonwebtoken` for JWT tokens, stored in httpOnly cookies. Users table in SQLite. No OAuth, no magic links — just email + password.
Consequences: Simple to understand and audit. No external dependencies. Password reset requires admin access (future: SMTP optional feature for reset emails).

---

## ADR-005: Monitoring runs in-process (Node.js cron)
Date: TBD
Status: accepted
Context: Browser-based monitoring hits CORS and can't do TCP checks. A separate monitoring container adds complexity.
Decision: `node-cron` runs inside the Next.js Node.js process. Checks every 30s. HTTP via `axios`, TCP via `net.createConnection`. Results stored in `StatusLog` table + pushed to connected clients via SSE. The monitoring worker is initialized in `src/lib/monitoring/worker.ts` and started in the Next.js custom server.
Consequences: Simple single-container deployment. Cron restarts if container restarts (fine — first check within 30s). Not suitable for sub-second monitoring (not needed for homelab use case).

---

## ADR-006: Docker Compose single-container deployment
Date: TBD
Status: accepted
Context: Homelab users are comfortable with Docker Compose. Minimal services = minimal failure points.
Decision: One `docker-compose.yml` with a single `app` service. SQLite DB and `.md` files live in a named Docker volume. No separate DB container required for default setup.
Consequences: `docker compose up -d` and you're running. Volume persists data across restarts and updates. Users can add a Postgres container alongside if they switch providers.

---

## ADR-007: Branch protection — agents never touch main
Date: TBD
Status: accepted
Context: Production releases must be human-approved.
Decision: `main` is locked. `beta` is the release candidate branch — only @archie opens PRs there, only the human merges them. Agents work freely on `feature/*` and `dev`.
Consequences: Human has full control of what ships. Agents can iterate fast. GitHub branch protection rules + CI workflow enforce this.
