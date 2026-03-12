# Changelog

## [0.1.0] — Phase 1 MVP

### Added
- Interactive canvas with infinite pan, zoom, and dot-grid background
- Cluster cards draggable to any position, colored by type (Proxmox, Docker, K8s, ARM, bare-metal, VPS)
- Node cards with type badge (VM/CT/Docker/bare-metal), IP, OS
- Service tags with live status dots (online/offline/unknown)
- Background monitoring: HTTP and TCP health checks every 30 seconds
- Server-Sent Events stream for real-time status updates
- Detail panel for editing nodes (slide-in from right)
- New Cluster modal with 6 type tiles
- Add Node modal with IP prefill (192.168.x.x)
- Local JWT auth: register, login, logout
- SQLite database via Prisma 7 with full cascade deletes
- Docker Compose deployment with persistent data volume
- 7-day status log pruning
