# Skill: Server-Sent Events (SSE) — Monitoring Stream

Used by @capcom (server) and @fenster (client).

---

## Server: /api/status/stream (Next.js API Route)

```typescript
// src/app/api/status/stream/route.ts
import { NextRequest } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { statusCache, addSSEClient, removeSSEClient } from '@/lib/monitoring/worker'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) {
    return new Response('Unauthorized', { status: 401 })
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      // Send current status snapshot immediately
      const snapshot = statusCache.getForUser(payload.userId)
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'snapshot', data: snapshot })}\n\n`)
      )

      // Register client for push updates
      const send = (event: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          removeSSEClient(payload.userId, send)
        }
      }

      addSSEClient(payload.userId, send)

      // Heartbeat every 25s to keep connection alive through proxies
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, 25000)

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        removeSSEClient(payload.userId, send)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',  // Nginx: disable buffering
    },
  })
}
```

---

## Client: React hook (useStatusStream)

```typescript
// src/hooks/useStatusStream.ts
import { useEffect, useCallback } from 'react'

type StatusUpdate = {
  serviceId: string
  status: 'online' | 'offline' | 'unknown'
  latencyMs: number | null
  checkedAt: string
}

type SnapshotEvent = {
  type: 'snapshot'
  data: Record<string, StatusUpdate>
}

export function useStatusStream(
  onUpdate: (update: StatusUpdate) => void,
  onSnapshot: (data: Record<string, StatusUpdate>) => void
) {
  const connect = useCallback(() => {
    const es = new EventSource('/api/status/stream', { withCredentials: true })
    let retryDelay = 1000

    es.onmessage = (e) => {
      const payload = JSON.parse(e.data)
      if (payload.type === 'snapshot') {
        onSnapshot(payload.data)
      } else {
        onUpdate(payload as StatusUpdate)
        retryDelay = 1000  // reset on success
      }
    }

    es.onerror = () => {
      es.close()
      // Exponential backoff reconnect
      setTimeout(() => connect(), Math.min(retryDelay, 30000))
      retryDelay = Math.min(retryDelay * 2, 30000)
    }

    return es
  }, [onUpdate, onSnapshot])

  useEffect(() => {
    const es = connect()
    return () => es.close()
  }, [connect])
}
```
