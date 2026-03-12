# Seshat 🗺

> Visual homelab infrastructure map with live monitoring. Self-hosted. Open source.

Map your homelab — clusters, VMs, containers, Docker services — on an interactive canvas.
See at a glance what's running and what's actually online.

**Runs on your network. Monitors your local IPs. Zero cloud dependency.**

---

## What it looks like

Excalidraw meets Notion — warm, paper-like canvas with handwritten fonts.
Not a dark terminal dashboard.

---

## Quickstart

```bash
git clone https://github.com/laszewskimariusz/seshat
cd seshat
cp .env.example .env        # edit JWT_SECRET
docker compose up -d
```

Open `http://your-server-ip:3000`

Full setup guide → [docs/DOCKER.md](docs/DOCKER.md)

---

## Features

- 🗺 **Canvas** — drag clusters, pan and zoom, dot-grid background
- 🖥 **Nodes** — add VMs, Containers, Docker hosts with IP addresses
- 🔌 **Services** — attach HTTP/HTTPS/TCP services with ports
- 💚 **Live monitoring** — checks every 30s from your server, status updates via SSE
- 📄 **Markdown data** — cluster topology stored as readable `.md` files
- 👤 **Multi-user** — each user has their own panel
- 🐳 **Docker Compose** — single container, named volume, zero config

---

## Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes + Node.js custom server
- **ORM:** Prisma (database-agnostic)
- **Default DB:** SQLite — one file, no server needed
- **Optional DB:** PostgreSQL or MySQL — change one env var
- **Auth:** Local JWT (bcrypt + jsonwebtoken) — fully offline

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ | Random string ≥32 chars. Run: `openssl rand -base64 32` |
| `DATABASE_URL` | ✅ | Default: `file:./data/seshat.db` |
| `PORT` | No | Default: `3000` |

---

## Switching Database

SQLite works out of the box. To switch to PostgreSQL or MySQL — change two lines.
Guide → [docs/DATABASE.md](docs/DATABASE.md)

---

## Project Structure

```
src/
  app/              # Next.js pages + API routes
  components/       # React components
  lib/              # DB client, auth, API helpers, monitoring
  styles/           # CSS variables
prisma/
  schema.prisma     # Database schema (SQLite default)
data/               # .md files + SQLite DB (Docker volume)
docs/               # Setup guides, API docs, decisions
.squad/             # AI team configuration (Squad framework)
```

---

## AI-built, human-supervised

Seshat is built by a [Squad](https://bradygaster.github.io/squad/) of AI agents.
Architecture decisions, code, tests, and docs are written by the agents.
Releases are reviewed and merged by the human owner.

---

## Contributing

Issues and PRs welcome. See `.squad/team.md` for the agent team structure.
Humans are welcome members of the squad too.

---

## License

MIT — do whatever you want with it.
