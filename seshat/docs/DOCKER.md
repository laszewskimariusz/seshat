# Seshat — Docker Setup Guide

## Requirements

- Docker 24+ and Docker Compose V2
- A machine on your local network (server, NAS, Raspberry Pi, old laptop)
- Access to the machine on port 3000 (or whichever you configure)

---

## Quickstart (3 commands)

```bash
git clone https://github.com/laszewskimariusz/seshat
cd seshat
cp .env.example .env
# Edit .env — set JWT_SECRET to a random string
docker compose up -d
```

Open `http://your-server-ip:3000` in your browser.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./data/seshat.db` | SQLite path or Postgres/MySQL URL |
| `JWT_SECRET` | Yes | — | Random string, min 32 chars. **Change this!** |
| `PORT` | No | `3000` | Port the app listens on |
| `NODE_ENV` | No | `production` | `production` or `development` |

Generate a JWT secret:
```bash
openssl rand -base64 32
```

---

## docker-compose.yml (reference)

```yaml
version: '3.9'

services:
  app:
    image: ghcr.io/laszewskimariusz/seshat:latest
    # Or build locally:
    # build: .
    container_name: seshat
    restart: unless-stopped
    ports:
      - "${PORT:-3000}:3000"
    volumes:
      - seshat-data:/app/data
    environment:
      DATABASE_URL: ${DATABASE_URL:-file:./data/seshat.db}
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

---

## Updating Seshat

```bash
docker compose pull
docker compose up -d
```

Prisma migrations run automatically on startup. Your data in the volume is preserved.

---

## Backup

The entire state of Seshat lives in one Docker volume: `seshat-data`.

```bash
# Backup
docker run --rm \
  -v seshat-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/seshat-backup-$(date +%Y%m%d).tar.gz /data

# Restore
docker run --rm \
  -v seshat-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/seshat-backup-YYYYMMDD.tar.gz -C /
```

This backup contains:
- `seshat.db` — SQLite database (all users, canvas positions, status history)
- `users/*/clusters/*.md` — all cluster topology files

---

## Running on Raspberry Pi

Seshat supports `linux/arm64` and `linux/arm/v7`.
The Docker image is multi-arch. `docker compose up -d` works as-is on Pi 3/4/5.

---

## Reverse Proxy (optional)

To access Seshat at `http://seshat.home` or over HTTPS, put it behind Nginx Proxy Manager or Traefik.

**Nginx example:**
```nginx
server {
    listen 80;
    server_name seshat.home;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        # Required for SSE (monitoring stream)
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

**Important:** The `proxy_buffering off` line is required for the SSE monitoring stream to work correctly.
