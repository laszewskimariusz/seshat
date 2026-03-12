# Seshat — .md File Format

Each cluster is stored as one `.md` file on disk.
These are the **source of truth** for cluster topology.

**Location:** `data/users/{userId}/clusters/{clusterId}.md`

---

## Full Example

```markdown
---
id: clx1a2b3c4d5e6f7g8h9i0j
name: Proxmox Home
type: proxmox
color: blue
emoji: 🖥️
cidr: 192.168.1.0/24
position:
  x: 70
  y: 70
createdAt: 2024-01-15T10:00:00.000Z
updatedAt: 2024-01-20T14:30:00.000Z
nodes:
  - id: clxnode001
    name: ubuntu-server
    type: vm
    ip: 192.168.1.10
    os: Ubuntu 22.04
    emoji: 🖥
    notes: Main web server. Runs nginx + docker.
    services:
      - id: clxsvc001
        name: nginx
        port: 80
        protocol: http
        shareIp: true
        ip: null
      - id: clxsvc002
        name: portainer
        port: 9000
        protocol: http
        shareIp: true
        ip: null
      - id: clxsvc003
        name: grafana
        port: 3000
        protocol: http
        shareIp: true
        ip: null
  - id: clxnode002
    name: pihole
    type: vm
    ip: 192.168.1.53
    os: Debian 12
    emoji: 🛡
    notes: ""
    services:
      - id: clxsvc004
        name: pi-hole
        port: 80
        protocol: http
        shareIp: true
        ip: null
  - id: clxnode003
    name: homeassistant
    type: ct
    ip: 192.168.1.20
    os: ""
    emoji: 🏠
    notes: ""
    services:
      - id: clxsvc005
        name: HA frontend
        port: 8123
        protocol: http
        shareIp: true
        ip: null
---

# Proxmox Home

Free-form notes about this cluster go here.
This content appears in the cluster's detail panel.
Supports basic **Markdown**.
```

---

## Parsing (gray-matter)

```typescript
import matter from 'gray-matter'
import fs from 'fs/promises'

async function readCluster(userId: string, clusterId: string) {
  const path = `data/users/${userId}/clusters/${clusterId}.md`
  const raw = await fs.readFile(path, 'utf-8')
  const { data, content } = matter(raw)
  return { ...data, notes: content.trim() }
}
```

## Writing back

```typescript
async function writeCluster(userId: string, clusterId: string, clusterData: ClusterData) {
  const { notes, ...frontmatter } = clusterData
  const output = matter.stringify(notes ?? '', frontmatter)
  const dir = `data/users/${userId}/clusters`
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(`${dir}/${clusterId}.md`, output, 'utf-8')
}
```

## Notes on sync

- `.md` file = source of truth for topology (cluster, nodes, services tree)
- SQLite DB = fast query layer + canvas positions + status log
- Every write to topology goes to BOTH the `.md` file AND the DB
- Canvas position (`posX`, `posY`) is stored in DB only — no `.md` rewrite on drag
