import axios from 'axios'
import net from 'net'
import cron, { ScheduledTask } from 'node-cron'
import prisma from './prisma'

export type ServiceStatus = 'online' | 'offline' | 'unknown'

export interface StatusEntry {
  serviceId: string
  userId: string
  status: ServiceStatus
  latencyMs: number | null
  checkedAt: Date
}

const statusCache = new Map<string, StatusEntry>()
const sseClients = new Map<string, Set<(data: string) => void>>()

async function checkHTTP(url: string): Promise<{ status: ServiceStatus; latencyMs: number }> {
  const start = Date.now()
  try {
    await axios.get(url, { timeout: 5000, validateStatus: () => true })
    return { status: 'online', latencyMs: Date.now() - start }
  } catch {
    return { status: 'offline', latencyMs: Date.now() - start }
  }
}

async function checkTCP(host: string, port: number): Promise<{ status: ServiceStatus; latencyMs: number }> {
  return new Promise((resolve) => {
    const start = Date.now()
    const socket = net.createConnection({ host, port, timeout: 5000 })
    socket.on('connect', () => {
      socket.destroy()
      resolve({ status: 'online', latencyMs: Date.now() - start })
    })
    socket.on('error', () => resolve({ status: 'offline', latencyMs: Date.now() - start }))
    socket.on('timeout', () => { socket.destroy(); resolve({ status: 'offline', latencyMs: 5000 }) })
  })
}

export async function checkAll(): Promise<StatusEntry[]> {
  const services = await prisma.service.findMany({ include: { node: true } })
  const results: StatusEntry[] = []

  for (const service of services) {
    const previous = statusCache.get(service.id)
    let result: { status: ServiceStatus; latencyMs: number }

    if (service.protocol.toLowerCase() === 'http' || service.protocol.toLowerCase() === 'https') {
      const scheme = service.protocol.toLowerCase()
      const ip = service.ip || service.node.ip
      result = await checkHTTP(`${scheme}://${ip}:${service.port}`)
    } else {
      const ip = service.ip || service.node.ip
      result = await checkTCP(ip, service.port)
    }

    const entry: StatusEntry = {
      serviceId: service.id,
      userId: service.userId,
      status: result.status,
      latencyMs: result.latencyMs,
      checkedAt: new Date(),
    }

    const changed = !previous || previous.status !== entry.status
    statusCache.set(service.id, entry)
    results.push(entry)

    await prisma.statusLog.create({
      data: {
        serviceId: service.id,
        userId: service.userId,
        status: result.status,
        latencyMs: result.latencyMs,
      },
    })

    if (changed) {
      broadcastToUser(service.userId, { type: 'status', serviceId: service.id, status: entry.status, latencyMs: entry.latencyMs })
    }
  }

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  await prisma.statusLog.deleteMany({ where: { checkedAt: { lt: cutoff } } })

  return results
}

export function getLatestStatus(): Map<string, StatusEntry> {
  return statusCache
}

export function getServiceStatus(serviceId: string): StatusEntry | undefined {
  return statusCache.get(serviceId)
}

export function getUserStatuses(userId: string): Record<string, StatusEntry> {
  const result: Record<string, StatusEntry> = {}
  statusCache.forEach((entry, id) => {
    if (entry.userId === userId) result[id] = entry
  })
  return result
}

export function registerSSEClient(userId: string, send: (data: string) => void) {
  if (!sseClients.has(userId)) sseClients.set(userId, new Set())
  sseClients.get(userId)!.add(send)
}

export function unregisterSSEClient(userId: string, send: (data: string) => void) {
  sseClients.get(userId)?.delete(send)
}

function broadcastToUser(userId: string, payload: object) {
  const clients = sseClients.get(userId)
  if (!clients || clients.size === 0) return
  const data = `data: ${JSON.stringify(payload)}\n\n`
  clients.forEach((send) => send(data))
}

let cronJob: ScheduledTask | null = null

export function startMonitoring() {
  if (cronJob) return
  cronJob = cron.schedule('*/30 * * * * *', () => {
    checkAll().catch(console.error)
  })
  console.log('[monitor] Started — checking every 30s')
}

export function stopMonitoring() {
  cronJob?.stop()
  cronJob = null
}
