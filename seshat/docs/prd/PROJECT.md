# Seshat — Product Requirements Document

> **Archie reads this file to kick off the project.**
> Trigger command: `@archie Read docs/prd/PROJECT.md and start the project`

---

## Product Overview

**Seshat** is an open-source, self-hosted visual map of your homelab infrastructure.

It runs on your local network — on your server, NAS, or Raspberry Pi — and lets you visualize clusters, VMs, containers, and Docker services on an interactive canvas, while monitoring whether those services are actually up.

Think: **Excalidraw meets Notion**, for your homelab network.

---

## Why Self-Hosted

Seshat monitors services at local IPs like `192.168.1.10` or `10.0.0.53`.
These addresses are **unreachable from any cloud**. The app must run inside your network.
Deployment is a single `docker compose up -d`.

---

## Target Users

- Solo homelab enthusiasts running Proxmox, Docker, or Raspberry Pi clusters
- People who want to *see* what's running in their network at a glance
- Not enterprise. Lightweight, personal, fun.

---

## Design Language

| Element | Value |
|---------|-------|
| Style | Excalidraw meets Notion — sketchy, warm, handwritten |
| Background | Cream `#faf9f7` — paper feel, NOT dark terminal |
| Titles/labels | **Caveat** font — handwritten |
| Body text | **Nunito** — soft, readable |
| Shadows | Offset `3px 3px 0 #d4cfc7` — flat/sketch feel |
| Dividers | `border-style: dashed` |
| Status dots | Green glow pulse (online), plain red (offline), yellow blink (checking) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes + custom Node.js server |
| ORM | **Prisma** (database-agnostic) |
| Database (default) | **SQLite** — `file:./data/seshat.db` |
| Database (optional) | PostgreSQL or MySQL — change `DATABASE_URL` only |
| Auth | Local JWT (`jsonwebtoken` + `bcrypt`) — no third-party |
| Data format | `.md` files with YAML frontmatter (source of truth for topology) |
| Monitoring | `node-cron` + `axios` + `net` (in-process, server-side) |
| Deploy | **Docker Compose** — single container, named volume |

---

## Repository

- GitHub: `laszewskimariusz/seshat`
- Open source: MIT license
- Branch model:
  - `main` — LOCKED, human-only
  - `beta` — release candidate, PR from `dev`, human merges
  - `dev` — agents' integration branch
  - `feature/*` — per-task agent branches

---

## Work Items — Phase 1 (MVP)

---

### WI-01: Project Bootstrap
**Priority:** P0 | **Owner:** @archie | **Deps:** none
**Labels:** `type:chore`, `priority:p0`, `go:yes`

- [ ] Init Next.js 14 project with TypeScript and Tailwind CSS
- [ ] Configure font imports: Caveat + Nunito (Google Fonts)
- [ ] Add CSS variables file `src/styles/variables.css` with full design token set
- [ ] Init Prisma with SQLite provider: `npx prisma init`
- [ ] Create `data/` directory (gitignored except `.gitkeep`)
- [ ] Create `docker-compose.yml` (see WI-14)
- [ ] Create `.env.example` with all required vars
- [ ] Create `README.md` (stub — @scribe fills out in WI-13)
- [ ] Set up ESLint + Prettier
- [ ] Create branches: `dev` off `main`

---

### WI-02: Prisma Schema
**Priority:** P0 | **Owner:** @capcom | **Deps:** WI-01
**Labels:** `type:feature`, `priority:p0`, `go:yes`, `squad:capcom`

Define `prisma/schema.prisma` with models: `User`, `Cluster`, `Node`, `Service`, `StatusLog`.
See `docs/api/SCHEMA.md` for full schema.

- [ ] Write schema with SQLite provider (default)
- [ ] Include comment block explaining how to switch to PostgreSQL/MySQL
- [ ] Run `prisma migrate dev --name init` to create migration
- [ ] Generate Prisma client
- [ ] Create `src/lib/db.ts` — singleton Prisma client (handles SQLite WAL mode)
- [ ] Seed file `prisma/seed.ts` with demo user + one sample cluster

---

### WI-03: Local Auth (Register / Login / JWT)
**Priority:** P0 | **Owner:** @capcom | **Deps:** WI-02
**Labels:** `type:feature`, `priority:p0`, `go:yes`, `squad:capcom`

No third-party auth. Local users table, bcrypt passwords, JWT in httpOnly cookie.

- [ ] `POST /api/auth/register` — hash password, create User, return JWT
- [ ] `POST /api/auth/login` — verify password, return JWT in httpOnly cookie
- [ ] `GET /api/auth/me` — return current user from JWT
- [ ] `POST /api/auth/logout` — clear cookie
- [ ] `src/lib/auth.ts` — `signToken()`, `verifyToken()`, `hashPassword()`, `comparePassword()`
- [ ] `src/middleware.ts` — protect `/app` and all `/api/*` except auth routes

---

### WI-04: File Service (.md read/write)
**Priority:** P0 | **Owner:** @capcom | **Deps:** WI-03
**Labels:** `type:feature`, `priority:p0`, `go:yes`, `squad:capcom`

- [ ] `src/lib/services/fileService.ts`
- [ ] `readCluster(userId, clusterId)` → parse `.md` → return cluster object
- [ ] `writeCluster(userId, clusterId, data)` → serialize to `.md`, write to disk
- [ ] `deleteCluster(userId, clusterId)` → remove file
- [ ] `listClusters(userId)` → scan directory, return array of parsed cluster objects
- [ ] Ensure `data/users/{userId}/clusters/` directories are created on first write
- [ ] File path: `data/users/{userId}/clusters/{clusterId}.md`
- [ ] Format: YAML frontmatter + markdown body (notes). See `docs/api/FILE_FORMAT.md`

---

### WI-05: Cluster CRUD API
**Priority:** P0 | **Owner:** @capcom | **Deps:** WI-04
**Labels:** `type:feature`, `priority:p0`, `go:yes`, `squad:capcom`

- [ ] `GET /api/clusters` — list user's clusters (read from `.md` files)
- [ ] `POST /api/clusters` — create cluster (write `.md` + insert DB row)
- [ ] `GET /api/clusters/:id` — get cluster with nodes + services
- [ ] `PUT /api/clusters/:id` — update cluster (rewrite `.md` + update DB row)
- [ ] `DELETE /api/clusters/:id` — delete cluster (remove `.md` + DB row + cascade)
- [ ] `PUT /api/clusters/:id/position` — update canvas x/y position (DB only, no .md rewrite)

---

### WI-06: Node & Service CRUD API
**Priority:** P0 | **Owner:** @capcom | **Deps:** WI-05
**Labels:** `type:feature`, `priority:p0`, `go:yes`, `squad:capcom`

- [ ] `POST /api/clusters/:cid/nodes` — add VM/CT/Docker node
- [ ] `PUT /api/clusters/:cid/nodes/:nid` — update node (name, IP, OS, type, notes)
- [ ] `DELETE /api/clusters/:cid/nodes/:nid` — remove node + cascade services
- [ ] `POST /api/clusters/:cid/nodes/:nid/services` — add service (name, port, protocol, shareIp, ip)
- [ ] `PUT /api/clusters/:cid/nodes/:nid/services/:sid` — update service
- [ ] `DELETE /api/clusters/:cid/nodes/:nid/services/:sid` — remove service
- [ ] All mutations must rewrite the corresponding `.md` file (fileService)

---

### WI-07: Monitoring Engine
**Priority:** P0 | **Owner:** @capcom | **Deps:** WI-06
**Labels:** `type:feature`, `priority:p0`, `go:yes`, `squad:capcom`

- [ ] `src/lib/monitoring/worker.ts` — cron scheduler
- [ ] `src/lib/monitoring/checks.ts` — `httpCheck()`, `tcpCheck()`, `buildCheckUrl()`
- [ ] Cron: every 30 seconds, check all services for all users
- [ ] Store each result in `StatusLog` table
- [ ] Cache latest status per service in `Map<serviceId, StatusResult>` (in-memory)
- [ ] `GET /api/status` — return cached status map for current user's services
- [ ] `GET /api/status/stream` — SSE endpoint, push events on status change
- [ ] `POST /api/status/check` — trigger immediate manual check
- [ ] Start monitoring worker in Next.js custom server (`server.ts`)

---

### WI-08: Login & Register Pages
**Priority:** P0 | **Owner:** @fenster | **Deps:** WI-03
**Labels:** `type:feature`, `priority:p0`, `go:yes`, `squad:fenster`

- [ ] `/` — login page
- [ ] `/register` — register page
- [ ] Design: cream background, centered card, offset shadow, Caveat headline
- [ ] Form: email + password, error states, loading state on submit
- [ ] On login success → redirect to `/app`
- [ ] On register success → redirect to `/app`
- [ ] Auth via `src/lib/api.ts` calling `/api/auth/login` and `/api/auth/register`

---

### WI-09: Main Canvas Page
**Priority:** P0 | **Owner:** @fenster | **Deps:** WI-05, WI-08
**Labels:** `type:feature`, `priority:p0`, `go:yes`, `squad:fenster`

- [ ] `/app` — protected route
- [ ] **Topbar:** logo (Caveat), "New Cluster" btn, "Add Node" btn, "Check Status" btn, live counter chip, user chip with logout
- [ ] **Sidebar:** nav items (Canvas / Monitoring / List), cluster list with color dots + node counts
- [ ] **Canvas:** dot-grid background, infinite pan (drag on empty space), scroll-to-zoom
- [ ] Fetch clusters from `GET /api/clusters`, render on canvas at saved positions
- [ ] Save cluster position on drag-end via `PUT /api/clusters/:id/position`
- [ ] Zoom controls: − / + / reset button, zoom % label
- [ ] Legend: status dot reference (online/offline/checking/unknown)
- [ ] Keyboard: `Space` + drag = pan, `Ctrl/Cmd +/-` = zoom (nice to have)

---

### WI-10: Cluster & Node Components
**Priority:** P0 | **Owner:** @fenster | **Deps:** WI-09
**Labels:** `type:feature`, `priority:p0`, `go:yes`, `squad:fenster`

- [ ] `ClusterCard` — draggable, header (emoji, Caveat name, meta, status dot, "+ node" btn), body (node card grid), dashed border divider
- [ ] `NodeCard` — type badge (VM/CT/Docker), emoji, Caveat name, IP, service tags. Color stripe top by type.
- [ ] `ServiceTag` — status dot (color by live status), name, port number
- [ ] `DetailPanel` — slide-in from right, edit name/IP/type/OS/notes fields, save/delete, shows current status
- [ ] `NewClusterModal` — name input, type picker (6 tiles: Proxmox/Docker/K8s/ARM/Bare Metal/VPS), CIDR, color chips
- [ ] `AddNodeModal` — type picker (VM/CT/Docker), name, IP, OS, cluster selector
- [ ] `AddServiceModal` — name, port, protocol (HTTP/HTTPS/TCP), IP override or share node IP checkbox

---

### WI-11: Live Status UI
**Priority:** P0 | **Owner:** @fenster | **Deps:** WI-07, WI-10
**Labels:** `type:feature`, `priority:p0`, `go:yes`, `squad:fenster`

- [ ] Connect to `GET /api/status/stream` (SSE) on canvas mount
- [ ] On SSE event: update status dot for matching service in React state
- [ ] "Check Status" button: POST to `/api/status/check`, set all dots to "checking" briefly
- [ ] Status dot states: `online` (green glow pulse), `offline` (red), `checking` (yellow blink), `unknown` (grey)
- [ ] Topbar live counter: "X / Y online" — recalculate on each SSE update
- [ ] Reconnect SSE on disconnect (exponential backoff)

---

### WI-12: Docker Setup
**Priority:** P0 | **Owner:** @capcom | **Deps:** WI-07
**Labels:** `type:chore`, `priority:p0`, `go:yes`, `squad:capcom`

- [ ] `Dockerfile` — multi-stage build (deps → builder → runner), non-root user
- [ ] `docker-compose.yml` — single `app` service, named volume for `data/`, port `3000`
- [ ] `.dockerignore`
- [ ] `server.ts` — custom Next.js server that initializes the monitoring worker on startup
- [ ] Prisma migration runs automatically on container start (`prisma migrate deploy`)
- [ ] Health check endpoint: `GET /api/health` → `{ status: "ok", db: "ok", uptime: N }`
- [ ] Document env vars: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`

---

### WI-13: Tests — Phase 1
**Priority:** P1 | **Owner:** @fido | **Deps:** WI-07, WI-11
**Labels:** `type:test`, `priority:p1`, `go:yes`, `squad:fido`

- [ ] Unit: `authService` (hash, compare, sign, verify)
- [ ] Unit: `fileService` (read, write, delete, list)
- [ ] Unit: `monitorService` (httpCheck mock, tcpCheck mock)
- [ ] Integration: all CRUD endpoints (auth, clusters, nodes, services)
- [ ] Integration: status endpoint + SSE
- [ ] E2E (Playwright): all 8 critical paths from `fido/charter.md`
- [ ] Test report: `.squad/log/test-report-phase1.md`
- [ ] All tests must pass with SQLite (default config)

---

### WI-14: Documentation — Phase 1
**Priority:** P1 | **Owner:** @scribe | **Deps:** WI-13
**Labels:** `type:docs`, `priority:p1`, `go:yes`, `squad:scribe`

- [ ] `README.md` — what it is, Docker Compose quickstart (3 commands), screenshot placeholder, env vars table
- [ ] `docs/DOCKER.md` — full setup guide: install Docker, clone repo, configure `.env`, first run, data backup, update procedure
- [ ] `docs/DATABASE.md` — SQLite default explanation, how to switch to PostgreSQL (step-by-step), MySQL note
- [ ] `docs/api/API.md` — all endpoints with examples
- [ ] `CHANGELOG.md` — Phase 1 entry
- [ ] `.squad/decisions.md` — fill in actual dates

---

### WI-15: Beta PR
**Priority:** P0 | **Owner:** @archie | **Deps:** WI-14
**Labels:** `type:chore`, `priority:p0`, `go:yes`, `squad:archie`

- [ ] Confirm @fido: all tests green
- [ ] Confirm @scribe: all docs updated
- [ ] Confirm @capcom: `docker compose up` works cleanly from scratch
- [ ] Confirm @fenster: UI matches design language spec
- [ ] Open PR: `dev → beta`
- [ ] PR title: `feat: Seshat Phase 1 MVP — self-hosted homelab map`
- [ ] PR body: what was built, how to test, Docker setup instructions, screenshots, test results
- [ ] Assign reviewer: `@laszewskimariusz`
- [ ] **DO NOT MERGE. Human reviews and merges.**

---

## Phase 2 — Backlog

Created as GitHub Issues with `release:backlog`, `go:yes`:

| ID | Feature |
|----|---------|
| WI-20 | Dark/light mode toggle |
| WI-21 | TCP port check (in addition to HTTP) |
| WI-22 | Uptime history (% over 24h) with mini sparkline |
| WI-23 | Export canvas as PNG |
| WI-24 | Webhook notification (Discord/Slack) when service goes down |
| WI-25 | Docker API auto-discovery (read containers from Docker socket) |
| WI-26 | Proxmox API auto-discovery |
| WI-27 | SMTP optional — password reset emails |
| WI-28 | Mobile-friendly responsive layout |
| WI-29 | Multi-user admin panel (invite users) |
| WI-30 | Import from existing network scan (nmap output) |

---

## Definition of Done — Phase 1

- [ ] `docker compose up -d` starts the app with zero manual steps
- [ ] User can register and log in (local auth, no cloud)
- [ ] User can create clusters (name, type, color, CIDR)
- [ ] User can add VM/CT/Docker nodes to clusters
- [ ] User can add services (name, port, protocol, IP) to nodes
- [ ] Clusters are draggable on the canvas, position saves
- [ ] Canvas supports pan and zoom
- [ ] Node detail panel opens, edits persist
- [ ] Monitoring checks all services every 30s
- [ ] Status dots update live via SSE
- [ ] All topology data saved as `.md` files in `data/` volume
- [ ] SQLite DB persists across container restarts (Docker volume)
- [ ] Switching to PostgreSQL works by changing `DATABASE_URL` only
- [ ] All critical path E2E tests pass
- [ ] PR `dev → beta` open, ready for human review
