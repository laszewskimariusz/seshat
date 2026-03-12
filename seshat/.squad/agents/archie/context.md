# @archie — Context & Memory

## Project

- **Name:** Seshat
- **Repo:** laszewskimariusz/seshat
- **Type:** Open-source, self-hosted homelab tool
- **Deploy:** Docker Compose on user's own server/NAS/Pi — NO cloud
- **Stack:** Next.js 14 (App Router) · TypeScript · Prisma ORM · SQLite (default) · Docker

## Why Self-Hosted

Seshat monitors local network services (192.168.x.x, 10.x.x.x).
These IPs are unreachable from any cloud provider.
The app MUST run inside the user's local network.
Docker Compose is the standard deployment method for homelabbers.

## Current Milestone

Phase 1 — MVP. See `docs/prd/PROJECT.md`.

## Known Decisions

- SQLite default, swappable via DATABASE_URL (Prisma supports PostgreSQL, MySQL too)
- No cloud dependency — fully offline capable
- Data in `.md` files (YAML frontmatter) + SQLite (index/cache layer)
- Monitoring cron runs in Node.js process inside Docker container
- No Vercel, no Supabase, no external auth services
- Auth: local JWT (jsonwebtoken + bcrypt) — no third-party
- Docker Compose: `app` (Next.js) + `db` volume (SQLite file)
- `beta` branch = release candidate, human-reviewed PR only

## Active Issues

_Updated by @archie after each session._
