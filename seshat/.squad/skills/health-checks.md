# Skill: HTTP & TCP Health Checks

Used by @capcom in `src/lib/monitoring/checks.ts`.

## Build check URL

```typescript
interface Service {
  id: string
  name: string
  port: number
  protocol: string   // 'http' | 'https' | 'tcp'
  ip: string | null
  shareIp: boolean
}

interface Node {
  ip: string
}

function buildCheckUrl(service: Service, node: Node): string {
  const ip = service.shareIp || !service.ip ? node.ip : service.ip
  if (service.protocol === 'tcp') return `tcp://${ip}:${service.port}`
  return `${service.protocol}://${ip}:${service.port}`
}
```

## HTTP Check

```typescript
import axios from 'axios'

export async function httpCheck(url: string): Promise<CheckResult> {
  const start = Date.now()
  try {
    await axios.get(url, {
      timeout: 5000,
      validateStatus: () => true,  // any HTTP response = online
    })
    return { status: 'online', latencyMs: Date.now() - start }
  } catch {
    return { status: 'offline', latencyMs: Date.now() - start }
  }
}
```

## TCP Check

```typescript
import net from 'net'

export async function tcpCheck(ip: string, port: number): Promise<CheckResult> {
  const start = Date.now()
  return new Promise(resolve => {
    const socket = net.createConnection({ host: ip, port })

    socket.on('connect', () => {
      socket.destroy()
      resolve({ status: 'online', latencyMs: Date.now() - start })
    })
    socket.on('error', () => {
      resolve({ status: 'offline', latencyMs: Date.now() - start })
    })
    socket.setTimeout(5000, () => {
      socket.destroy()
      resolve({ status: 'offline', latencyMs: Date.now() - start })
    })
  })
}
```

## Dispatch by protocol

```typescript
export async function checkService(service: Service, node: Node): Promise<CheckResult> {
  if (service.protocol === 'tcp') {
    const ip = service.shareIp || !service.ip ? node.ip : service.ip
    return tcpCheck(ip, service.port)
  }
  const url = buildCheckUrl(service, node)
  return httpCheck(url)
}

interface CheckResult {
  status: 'online' | 'offline' | 'unknown'
  latencyMs: number
}
```
