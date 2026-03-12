import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/apiAuth'
import { getUserStatuses, registerSSEClient, unregisterSSEClient } from '@/lib/monitor'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  let userId: string
  try {
    const user = requireAuth(req)
    userId = user.userId
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  let send: (data: string) => void

  const stream = new ReadableStream({
    start(controller) {
      send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data))
        } catch {
          // Client disconnected
        }
      }

      const statuses = getUserStatuses(userId)
      send(`data: ${JSON.stringify({ type: 'snapshot', statuses })}\n\n`)

      registerSSEClient(userId, send)

      req.signal.addEventListener('abort', () => {
        unregisterSSEClient(userId, send)
        try { controller.close() } catch {}
      })
    },
    cancel() {
      unregisterSSEClient(userId, send)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
