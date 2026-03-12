# Seshat 🗺

> Visual homelab infrastructure map with live monitoring. Self-hosted. Open source.

Map your homelab — clusters, VMs, containers, Docker services — on an interactive canvas. See at a glance what's running and what's actually online.

**Runs on your network. Monitors your local IPs. Zero cloud dependency. One `docker compose up`.**

Think: Excalidraw meets Notion, for your homelab.

---

## ✨ Features

- 🗺 **Interactive canvas** — infinite pan, zoom, dot-grid background; drag clusters anywhere
- 🖥 **Cluster types** — Proxmox, Docker, Kubernetes, ARM/Pi, bare-metal, VPS
- 💻 **Node support** — VM, CT, Docker container, bare-metal
- 🟢 **Live status dots** — green pulse = online · red = offline · grey = unknown
- ⚡ **Auto-monitoring** — HTTP and TCP health checks every 30 seconds
- 📡 **Real-time updates** — Server-Sent Events push status to all open tabs
- 🔒 **Local auth** — JWT + bcrypt, no external auth provider
- 💾 **SQLite** — single file database, no Postgres setup needed
- 🐳 **Docker Compose** — one command deploy, data persists in a local volume

---

## 🚀 Quickstart (Docker — recommended)

**Prerequisites:** Docker + Docker Compose installed on your server.

```bash
# 1. Clone the repo
git clone https://github.com/laszewskimariusz/seshat.git
cd seshat/seshat

# 2. Configure environment
cp .env.example .env.local
# Open .env.local and set a strong JWT_SECRET — this is the only required change

# 3. Start
docker compose up -d

# 4. Open in browser
# http://your-server-ip:3000
```

First time? Register an account at `http://your-server-ip:3000` and start mapping.

> **Tip:** Use your server's LAN IP (e.g. `192.168.1.10:3000`) to access from other devices on your network.

---

## ⚙️ Configuration

Edit `.env.local` before starting:

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | *(required)* | Secret key for JWT signing — use a long random string |
| `JWT_EXPIRES_IN` | `7d` | How long login sessions last |
| `DATABASE_URL` | `file:./data/seshat.db` | Path to SQLite database file |

Generate a secure secret:
```bash
openssl rand -base64 32
```

---

## 💻 Development Setup

**Prerequisites:** Node.js 20+, npm

```bash
# 1. Clone and enter the app directory
git clone https://github.com/laszewskimariusz/seshat.git
cd seshat/seshat

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local — set JWT_SECRET

# 4. Set up the database
npx prisma migrate dev

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Useful dev commands

```bash
npm run dev          # Start development server (hot reload)
npm run build        # Production build
npm run lint         # ESLint
npx prisma studio    # Visual database browser at localhost:5555
npx prisma migrate dev --name <name>  # Create a new migration
```

---

## 📁 Project Structure

```
seshat/
├── app/
│   ├── api/              # API routes (auth, clusters, nodes, services, status)
│   ├── app/              # Main canvas page (/app)
│   ├── components/       # UI components (ClusterCard, NodeCard, DetailPanel…)
│   ├── lib/              # Shared utilities (auth, prisma, monitor, api client)
│   └── register/         # Register page
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # SQLite migrations
├── data/                 # SQLite database file (created on first run)
├── docs/
│   ├── ARCHITECTURE.md   # Full architecture reference
│   └── API.md            # API endpoint documentation
├── Dockerfile
└── docker-compose.yml
```

---

## 🗄️ Data Model

```
User → Cluster → Node → Service → StatusLog
```

- **Cluster** — a logical group (e.g. "Proxmox Node", "Docker Host")
- **Node** — a machine or container (VM, CT, Docker, bare-metal) with an IP
- **Service** — a port/protocol on a node (e.g. Nginx :80, Grafana :3000)
- **StatusLog** — health check results (online/offline/unknown, latency ms)

---

## 🐳 Docker Compose Details

```yaml
# docker-compose.yml (simplified)
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data   # SQLite database persists here
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=file:/app/data/seshat.db
```

Database is stored in `./data/seshat.db` on your host — back it up like any file.

**Update to a new version:**
```bash
git pull
docker compose up -d --build
```

---

## 🔌 API

All endpoints documented in [docs/API.md](docs/API.md).

Auth endpoints don't require a token. All others require:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🧪 Testing

```bash
# Unit + integration tests
npm test

# E2E tests (requires running app on localhost:3000)
npm run test:e2e
```

Test plan and coverage targets: [docs/TEST_PLAN.md](docs/TEST_PLAN.md)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Fonts | Caveat (handwritten) + Nunito (body) |
| Backend | Next.js API Routes, TypeScript |
| Database | SQLite via Prisma 7 |
| Deploy | Docker Compose |
| Monitoring | node-cron + axios + net |
| Auth | JWT + bcrypt (local, no cloud) |

---

## 🗺 Roadmap (Phase 2)

- [ ] Dark mode
- [ ] TCP port health check (in addition to HTTP)
- [ ] Uptime history (% over 24h)
- [ ] Export canvas as PNG
- [ ] Discord/Slack webhook on service down
- [ ] Docker API auto-discovery
- [ ] Proxmox API auto-discovery
- [ ] Mobile responsive layout

---

## 🤝 Contributing

Pull requests welcome. For major changes, open an issue first.

```bash
git checkout -b feature/your-feature
# make changes
git commit -m "feat: your feature"
git push origin feature/your-feature
# open PR → dev branch
```

---

## 📄 License

MIT — do whatever you want with it.
