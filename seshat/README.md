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
cd seshat/seshat
cp .env.example .env.local   # edit JWT_SECRET
docker compose up -d
```

Open `http://your-server-ip:3000`

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./data/seshat.db` | SQLite database path |
| `JWT_SECRET` | *(required)* | Secret for JWT signing — change this! |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |

---

## Development

```bash
cd seshat/seshat
npm install
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000`

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, TypeScript |
| Database | SQLite via Prisma 7 |
| Deploy | Docker Compose |
| Monitoring | node-cron + axios + net |
| Auth | Local JWT (bcrypt + jsonwebtoken) |

---

## Features

- 🗺 **Interactive canvas** — infinite pan, zoom, dot-grid background
- 🖱 **Drag clusters** — position your infrastructure how you think of it
- 🟢 **Live status dots** — green pulse = online, red = offline, grey = unknown
- ⚡ **30-second monitoring** — HTTP and TCP checks for all services
- 📡 **SSE stream** — status updates push to all open browser tabs
- 🔒 **Local auth** — JWT, bcrypt, no cloud services

---

## API

See [docs/API.md](docs/API.md) for full endpoint reference.

---

## License

MIT
