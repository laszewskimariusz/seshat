# Seshat — Product Requirements Document (PRD)

> **Archie reads this file to start the project.**
> Command: `@archie Read docs/prd/PROJECT.md and start the project`

---

## Product Overview

**Seshat** is a lightweight, visual homelab infrastructure map for enthusiasts.
It lets you visualize your home network — clusters, VMs, containers, Docker services — on an interactive canvas, and monitor whether services are live.

Think: Excalidraw meets Notion, for your homelab.

---

## Users

- Solo homelab enthusiasts with Proxmox, Docker, or Raspberry Pi setups
- Small self-hosted setups (1–5 users per instance)
- Not enterprise. Lightweight, fun, personal.

---

## Design Language

- **Font**: Caveat (handwritten, titles) + Nunito (body)
- **Palette**: Warm cream/paper (#faf9f7) — NOT dark terminal
- **Borders**: Offset shadow (3px 3px 0) — sketch feel
- **Feel**: Like drawing in a notebook, not a dashboard

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, TypeScript |
| Database | SQLite via Prisma ORM (embedded, no cloud dependency) |
| Deploy | Docker Compose (self-hosted, homelab server) |
| Data format | SQLite database (Prisma-managed, single file at `data/seshat.db`) |
| Monitoring | node-cron + axios + net (server-side), pings 192.168.x.x IPs every 30s |
| Auth | Local JWT (bcrypt + jsonwebtoken, httpOnly cookie, no external provider) |

---

## Repository

- GitHub: `laszewskimariusz/seshat`
- Branch model:
  - `main` — LOCKED, human-only
  - `beta` — release candidate, PR from `dev`, human merges
  - `dev` — agents' integration branch
  - `feature/*` — per-task agent branches

---

## Work Items

### Phase 1 — MVP

#### WI-01: Project Bootstrap
Priority: P0
Owner: @archie
Dependencies: none
Labels: `type:chore`, `priority:p0`, `go:yes`

Tasks:
- Init Next.js 14 project with TypeScript
- Configure Tailwind CSS + font imports (Caveat, Nunito)
- Init Prisma with SQLite provider, run `prisma migrate dev --name init`
- Create `docker-compose.yml` with app service + named volume `seshat-data`
- Create branch structure: `main`, `beta`, `dev`
- Add `.env.example` (JWT_SECRET, DATABASE_URL)
- Add basic `README.md`

---

#### WI-02: Prisma Schema & Local Auth
Priority: P0
Owner: @capcom
Dependencies: WI-01
Labels: `type:feature`, `priority:p0`, `go:yes`, `squad:capcom`

Tasks:
- Write `prisma/schema.prisma`: models `User`, `Cluster`, `Node`, `Service`, `StatusLog`
- Run `prisma migrate dev --name init` to create SQLite DB
- Auth: register (email + bcrypt password), login → sign JWT, store in httpOnly cookie `seshat_token`
- API routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Middleware: protect all `/api/*` routes except `/api/auth/*` and `/api/health`
- No external auth provider — fully offline JWT

Schema detail: see `docs/api/SCHEMA.md`

---

#### WI-03: Database Seeding / Initial Data
Priority: P0
Owner: @capcom
Dependencies: WI-02
Labels: `type:feature`, `priority:p0`, `go:yes`, `squad:capcom`

Tasks:
- Write `prisma/seed.ts`: optional seed script for dev/demo data
- Create `src/lib/db.ts`: Prisma client singleton with SQLite WAL mode pragmas
- Validate Prisma migration runs automatically on container startup
- No file storage service needed — all data lives in SQLite

---

#### WI-04: Cluster CRUD API
Priority: P0
Owner: @capcom
Dependencies: WI-03
Labels: `type:feature`, `priority:p0`, `go:yes`, `squad:capcom`

Endpoints:
- `GET /api/clusters` — list user's clusters (with nodes)
- `POST /api/clusters` — create cluster (writes to SQLite via Prisma)
- `GET /api/clusters/:id` — get single cluster with full node + service tree
- `PUT /api/clusters/:id` — update cluster fields
- `PUT /api/clusters/:id/position` — update canvas x/y only (drag-end)
- `DELETE /api/clusters/:id` — delete cluster (cascades to nodes, services, status logs)

---

#### WI-05: Node & Service CRUD API
Priority: P0
Owner: @capcom
Dependencies: WI-04
Labels: `type:feature`, `priority:p0`, `go:yes`, `squad:capcom`

Endpoints:
- `POST /api/clusters/:id/nodes` — add VM/CT/Docker node
- `PUT /api/clusters/:id/nodes/:nid` — update node (IP, name, OS, type)
- `DELETE /api/clusters/:id/nodes/:nid` — remove node
- `POST /api/clusters/:id/nodes/:nid/services` — add service (name, port, protocol)
- `PUT /api/clusters/:id/nodes/:nid/services/:sid` — update service
- `DELETE /api/clusters/:id/nodes/:nid/services/:sid` — remove service

---

#### WI-06: Monitoring Service
Priority: P0
Owner: @capcom
Dependencies: WI-05
Labels: `type:feature`, `priority:p0`, `go:yes`, `squad:capcom`

Tasks:
- `monitorService.ts`: cron every 30s
- For each service: HTTP check (axios, 5s timeout) OR TCP check (net.createConnection)
- Result: `{ serviceId, status: 'online'|'offline'|'unknown', checkedAt, latencyMs }`
- Store results in `status_log` table
- Cache latest status in memory (Map)
- `GET /api/status` — return all latest statuses for current user
- `GET /api/status/stream` — SSE stream, push updates on change

---

#### WI-07: Login & Register Pages
Priority: P0
Owner: @fenster
Dependencies: WI-02
Labels: `type:feature`, `priority:p0`, `go:yes`, `squad:fenster`

Tasks:
- `/` — landing/login page
- `/register` — register page
- Design: warm paper background, Caveat font, centered card
- Form: email + password, validation, error states
- On success: redirect to `/app`
- JWT auth integration via `src/lib/auth.ts` (fetch to `/api/auth/login`)

---

#### WI-08: Main Canvas Page
Priority: P0
Owner: @fenster
Dependencies: WI-04, WI-07
Labels: `type:feature`, `priority:p0`, `go:yes`, `squad:fenster`

Tasks:
- `/app` — main page, protected route
- Topbar: logo, "New Cluster" btn, "Add Node" btn, "Check Status" btn, user chip
- Sidebar: nav (Canvas / Monitoring / List), cluster list with colored dots
- Canvas: infinite pan (mousedown drag), zoom (wheel), dot grid background
- Render clusters as draggable cards (fetch from `GET /api/clusters`)
- Render nodes inside clusters as node cards
- Save cluster position on drag-end (`PUT /api/clusters/:id` with x/y)
- Zoom controls (−/+/reset)
- Legend (online/offline/checking)

---

#### WI-09: Cluster & Node UI Components
Priority: P0
Owner: @fenster
Dependencies: WI-08
Labels: `type:feature`, `priority:p0`, `go:yes`, `squad:fenster`

Tasks:
- `ClusterCard` component: header (emoji, name, meta, status dot, "+ node" btn), body (node cards grid), dashed border divider
- `NodeCard` component: type badge (VM/CT/Docker), emoji, name, IP, service tags with status dots
- `ServiceTag` component: dot (color by status), name, port
- `DetailPanel` component: slide-in from right, edit name/IP/type/OS/notes, save/delete
- `NewClusterModal` component: name, type picker (6 tiles), CIDR, color chips
- `AddNodeModal` component: type (VM/CT/Docker), name, IP, OS, cluster selector

---

#### WI-10: Live Status UI
Priority: P0
Owner: @fenster
Dependencies: WI-06, WI-09
Labels: `type:feature`, `priority:p0`, `go:yes`, `squad:fenster`

Tasks:
- Connect to `GET /api/status/stream` (SSE)
- On status update: update status dots on canvas in real-time
- "Check Status" button: POST manual check, show spinner
- Status dot states: online (green pulse), offline (red), checking (yellow blink), unknown (grey)
- Topbar counter: "X / Y online"

---

#### WI-11: Tests — Phase 1
Priority: P1
Owner: @fido
Dependencies: WI-06, WI-10
Labels: `type:test`, `priority:p1`, `go:yes`, `squad:fido`

Tasks:
- Unit tests: `fileService`, `monitorService`, auth middleware
- Integration tests: all CRUD endpoints (cluster, node, service)
- E2E (Playwright): all 7 critical paths from fido charter
- Test report: `.squad/log/test-report-phase1.md`

---

#### WI-12: Documentation — Phase 1
Priority: P1
Owner: @scribe
Dependencies: WI-11
Labels: `type:docs`, `priority:p1`, `go:yes`, `squad:scribe`

Tasks:
- `README.md`: what it is, how to run locally, env vars, deploy via Docker Compose
- `docs/api/API.md`: all endpoints documented
- `docs/DOCKER.md`: full Docker Compose setup, backup/restore, reverse proxy
- `CHANGELOG.md`: Phase 1 entry
- `.squad/decisions.md`: fill in actual dates from ADRs

---

#### WI-13: Beta PR
Priority: P0
Owner: @archie
Dependencies: WI-12
Labels: `type:chore`, `priority:p0`, `go:yes`, `squad:archie`

Tasks:
- All tests green (@fido confirms)
- All docs updated (@scribe confirms)
- Open PR: `dev` → `beta`
- PR title: `feat: Seshat Phase 1 MVP`
- PR description: summary of what was built, screenshots, test results, how to review
- Assign reviewer: `@laszewskimariusz`
- **DO NOT merge. Wait for human.**

---

### Phase 2 — Post-MVP (Backlog)

These are created as GitHub Issues with `release:backlog`, `go:yes`:

- WI-20: Dark mode toggle
- WI-21: TCP port health check (in addition to HTTP)
- WI-22: Uptime history (% over 24h)
- WI-23: Export canvas as PNG
- WI-24: Notification webhook (Discord/Slack) when service goes down
- WI-25: Docker API auto-discovery
- WI-26: Proxmox API auto-discovery
- WI-27: Mobile responsive layout

---

## Definition of Done (Phase 1)

- [ ] User can register and log in
- [ ] User can create a cluster with name, type, color, CIDR
- [ ] User can add VM/CT/Docker nodes to a cluster
- [ ] User can add services (name, port, protocol) to a node
- [ ] Clusters appear on canvas and are draggable
- [ ] Canvas supports pan and zoom
- [ ] Node detail panel opens on click, edits save correctly
- [ ] Monitoring checks all services every 30s
- [ ] Status dots update live via SSE
- [ ] All data stored in SQLite (`data/seshat.db`) via Prisma
- [ ] All critical path E2E tests pass
- [ ] PR `dev` → `beta` open and ready for human review
