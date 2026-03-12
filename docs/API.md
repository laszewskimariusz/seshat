# Seshat API Reference

All protected endpoints require a JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are issued by `/api/auth/login` and `/api/auth/register`.

---

## Auth

### POST /api/auth/register

Create a new account.

**Body**
```json
{ "email": "user@example.com", "password": "secret" }
```

**Response `201`**
```json
{ "token": "<jwt>", "user": { "id": "...", "email": "user@example.com" } }
```

---

### POST /api/auth/login

Authenticate and receive a token.

**Body**
```json
{ "email": "user@example.com", "password": "secret" }
```

**Response `200`**
```json
{ "token": "<jwt>", "user": { "id": "...", "email": "user@example.com" } }
```

---

### POST /api/auth/logout

Clear the auth cookie.

**Response `200`**
```json
{ "success": true }
```

---

### GET /api/auth/me

Return the currently authenticated user. Requires auth.

**Response `200`**
```json
{ "user": { "id": "...", "email": "user@example.com" } }
```

---

## Clusters

### GET /api/clusters

List all clusters. Requires auth.

**Response `200`**
```json
{ "clusters": [ { "id": "...", "name": "homelab", "type": "proxmox", "color": "#...", "emoji": "🖥", "cidr": "192.168.1.0/24", "posX": 120, "posY": 80, "nodes": [...] } ] }
```

---

### POST /api/clusters

Create a cluster. Requires auth.

**Body**
```json
{
  "name": "homelab",
  "type": "proxmox",
  "color": "#e8d5b7",
  "emoji": "🖥",
  "cidr": "192.168.1.0/24",
  "posX": 120,
  "posY": 80
}
```

All fields except `name` are optional.

**Response `201`**
```json
{ "cluster": { "id": "...", ... } }
```

---

### GET /api/clusters/:id

Get a single cluster with its nodes and services. Requires auth.

**Response `200`**
```json
{ "cluster": { "id": "...", "nodes": [ { "id": "...", "services": [...] } ] } }
```

---

### PUT /api/clusters/:id

Update any cluster fields. Requires auth.

**Body** — any subset of cluster fields.

**Response `200`**
```json
{ "cluster": { "id": "...", ... } }
```

---

### DELETE /api/clusters/:id

Delete a cluster and all its nodes, services, and status logs (cascade). Requires auth.

**Response `200`**
```json
{ "success": true }
```

---

### PUT /api/clusters/:id/position

Update only the canvas position of a cluster. Requires auth.

**Body**
```json
{ "posX": 200, "posY": 150 }
```

**Response `200`**
```json
{ "cluster": { "id": "...", "posX": 200, "posY": 150, ... } }
```

---

## Nodes

### POST /api/clusters/:id/nodes

Add a node to a cluster. Requires auth.

**Body**
```json
{
  "name": "pve-01",
  "ip": "192.168.1.10",
  "type": "vm",
  "os": "Debian 12",
  "emoji": "🐧",
  "notes": "primary hypervisor"
}
```

`type` defaults to `"bare-metal"`. All fields except `name` and `ip` are optional.

**Response `201`**
```json
{ "node": { "id": "...", ... } }
```

---

### PUT /api/clusters/:id/nodes/:nid

Update a node. Requires auth.

**Body** — any subset of node fields.

**Response `200`**
```json
{ "node": { "id": "...", ... } }
```

---

### DELETE /api/clusters/:id/nodes/:nid

Delete a node and its services and status logs. Requires auth.

**Response `200`**
```json
{ "success": true }
```

---

## Services

### POST /api/clusters/:id/nodes/:nid/services

Add a service to a node. Requires auth.

**Body**
```json
{ "name": "Jellyfin", "port": 8096, "protocol": "http" }
```

`protocol` defaults to `"http"`. Accepted values: `"http"`, `"https"`, `"tcp"`.

**Response `201`**
```json
{ "service": { "id": "...", ... } }
```

---

### PUT /api/clusters/:id/nodes/:nid/services/:sid

Update a service. Requires auth.

**Body** — any subset of service fields.

**Response `200`**
```json
{ "service": { "id": "...", ... } }
```

---

### DELETE /api/clusters/:id/nodes/:nid/services/:sid

Delete a service and its status logs. Requires auth.

**Response `200`**
```json
{ "success": true }
```

---

## Status & Monitoring

### GET /api/status

Return latest status for all services. Requires auth.

**Response `200`**
```json
{
  "statuses": {
    "<serviceId>": { "status": "online", "latencyMs": 12, "checkedAt": "2026-03-12T10:00:00.000Z" }
  }
}
```

`status` values: `"online"` | `"offline"` | `"unknown"`

---

### POST /api/status/check

Trigger an immediate health check for all services. Requires auth.

**Response `200`**
```json
{ "results": [ { "serviceId": "...", "status": "online", "latencyMs": 8 } ] }
```

---

### GET /api/status/stream

Server-Sent Events stream. Pushes status updates every 30 seconds to all connected clients.

**Auth** — pass token as a query parameter (SSE does not support headers in browsers):

```
GET /api/status/stream?token=<jwt>
```

**Event format**
```
event: status
data: {"serviceId":"...","status":"online","latencyMs":5,"checkedAt":"..."}
```

---

### GET /api/health

Health check. No auth required.

**Response `200`**
```json
{ "ok": true, "db": true }
```
