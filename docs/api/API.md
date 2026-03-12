# Seshat — API Reference

**Base URL:** `http://localhost:3000/api` (or your server's IP/hostname)
**Auth:** JWT in httpOnly cookie (`seshat_token`). Set automatically on login.
All routes except `/api/auth/*` and `/api/health` require a valid session cookie.

---

## Health

### GET /api/health
No auth required. Used by Docker health check.
```json
// 200
{ "status": "ok", "db": "ok", "uptime": 3600 }

// 503 (DB unreachable)
{ "status": "error", "db": "unreachable", "uptime": 3600 }
```

---

## Auth

### POST /api/auth/register
```json
// Request
{ "email": "jan@example.com", "password": "mypassword123" }

// 201
{ "data": { "id": "cuid", "email": "jan@example.com" } }

// 400 — validation error
{ "error": "Email already registered", "code": "AUTH_DUPLICATE" }
```
Sets `seshat_token` httpOnly cookie on success.

### POST /api/auth/login
```json
// Request
{ "email": "jan@example.com", "password": "mypassword123" }

// 200
{ "data": { "id": "cuid", "email": "jan@example.com", "displayName": "Jan" } }

// 401
{ "error": "Invalid credentials", "code": "AUTH_INVALID" }
```
Sets `seshat_token` httpOnly cookie on success.

### POST /api/auth/logout
```json
// 200
{ "data": { "message": "Logged out" } }
```
Clears `seshat_token` cookie.

### GET /api/auth/me
```json
// 200
{ "data": { "id": "cuid", "email": "jan@example.com", "displayName": "Jan" } }
```

---

## Clusters

### GET /api/clusters
```json
// 200
{
  "data": [
    {
      "id": "cuid",
      "name": "Proxmox Home",
      "type": "proxmox",
      "color": "blue",
      "emoji": "🖥️",
      "cidr": "192.168.1.0/24",
      "posX": 70,
      "posY": 70,
      "nodes": [...]
    }
  ]
}
```

### POST /api/clusters
```json
// Request
{ "name": "Proxmox Home", "type": "proxmox", "color": "blue", "emoji": "🖥️", "cidr": "192.168.1.0/24" }

// 201
{ "data": { "id": "cuid", "name": "Proxmox Home", ... } }
```

### GET /api/clusters/:id
Returns cluster with full node + service tree.

### PUT /api/clusters/:id
Partial update. Rewrites `.md` file.
```json
{ "name": "New Name", "cidr": "10.0.0.0/24" }
```

### PUT /api/clusters/:id/position
Canvas drag-end. Only updates x/y in DB — does NOT rewrite `.md` file.
```json
{ "posX": 240, "posY": 180 }
```

### DELETE /api/clusters/:id
Deletes cluster, all nodes, services, status logs, and the `.md` file.

---

## Nodes

### POST /api/clusters/:cid/nodes
```json
// Request
{ "name": "ubuntu-server", "type": "vm", "ip": "192.168.1.10", "os": "Ubuntu 22.04", "emoji": "🖥", "notes": "" }

// 201
{ "data": { "id": "cuid", "name": "ubuntu-server", ... } }
```

### PUT /api/clusters/:cid/nodes/:nid
```json
{ "name": "new-name", "ip": "192.168.1.11", "notes": "updated notes" }
```

### DELETE /api/clusters/:cid/nodes/:nid
Cascades to services + status logs.

---

## Services

### POST /api/clusters/:cid/nodes/:nid/services
```json
// Request
{ "name": "nginx", "port": 80, "protocol": "http", "shareIp": true }

// With custom IP (shareIp: false)
{ "name": "vaultwarden", "port": 8222, "protocol": "http", "shareIp": false, "ip": "192.168.1.101" }

// 201
{ "data": { "id": "cuid", "name": "nginx", "port": 80, ... } }
```

### PUT /api/clusters/:cid/nodes/:nid/services/:sid
### DELETE /api/clusters/:cid/nodes/:nid/services/:sid

---

## Monitoring / Status

### GET /api/status
Returns latest cached status for all services owned by current user.
```json
{
  "data": {
    "svc-cuid-1": { "status": "online",  "latencyMs": 42,   "checkedAt": "2024-01-15T10:00:00Z" },
    "svc-cuid-2": { "status": "offline", "latencyMs": 5001, "checkedAt": "2024-01-15T10:00:01Z" },
    "svc-cuid-3": { "status": "unknown", "latencyMs": null,  "checkedAt": null }
  }
}
```

### GET /api/status/stream
Server-Sent Events. Connect once, receive updates on status change.
```
Content-Type: text/event-stream

data: {"serviceId":"svc-cuid-1","status":"online","latencyMs":38,"checkedAt":"2024-01-15T10:00:30Z"}

data: {"serviceId":"svc-cuid-2","status":"offline","latencyMs":5001,"checkedAt":"2024-01-15T10:00:31Z"}
```

### POST /api/status/check
Trigger an immediate manual check for all current user's services.
```json
// 200
{ "data": { "triggered": 12, "message": "Immediate check queued" } }
```

---

## Error Format

All errors follow this shape:
```json
{ "error": "Human-readable message", "code": "SNAKE_CASE_CODE" }
```

Common codes: `AUTH_REQUIRED`, `AUTH_INVALID`, `AUTH_DUPLICATE`, `NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`
