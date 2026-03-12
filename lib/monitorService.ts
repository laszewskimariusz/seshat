import axios from 'axios'
import net from 'net'
import cron from 'node-cron'
import prisma from './prisma'

export type ServiceStatus = 'online' | 'offline' | 'unknown'

interface StatusEntry {
  serviceId: string
  status: ServiceStatus
  latencyMs: number | null
  checkedAt: Date
}

const statusCache = new Map<string, StatusEntry>()
let cronJob: ReturnType<typeof cron.schedule> | null = null

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
    const socket = net.createConnection({ host, port })
    socket.setTimeout(5000)
    socket.on('connect', () => {
      socket.destroy()
      resolve({ status: 'online', latencyMs: Date.now() - start })
    })
    socket.on('error', () => resolve({ status: 'offline', latencyMs: Date.now() - start }))
    socket.on('timeout', () => {
      socket.destroy()
      resolve({ status: 'offline', latencyMs: 5000 })
    })
  })
}

export async function checkAllServices(): Promise<StatusEntry[]> {
  const services = await prisma.service.findMany({ include: { node: true } })
  const results: StatusEntry[] = []

  for (const service of services) {
    const host = service.ip || service.node.ip
    let result: { status: ServiceStatus; latencyMs: number }

    if (service.protocol.toLowerCase() === 'http' || service.protocol.toLowerCase() === 'https') {
      result = await checkHTTP(`${service.protocol.toLowerCase()}://${host}:${service.port}`)
    } else {
      result = await checkTCP(host, service.port)
    }

    const entry: StatusEntry = {
      serviceId: service.id,
      status: result.status,
      latencyMs: result.latencyMs,
      checkedAt: new Date(),
    }
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
  }

  return results
}

export function getLatestStatus(): Map<string, StatusEntry> {
  return statusCache
}

export function getServiceStatus(serviceId: string): StatusEntry | undefined {
  return statusCache.get(serviceId)
}

export function startMonitoring() {
  if (cronJob) return
  cronJob = cron.schedule('*/30 * * * * *', () => {
    checkAllServices().catch(console.error)
  })
  console.log('[monitor] started — every 30s')
}

export function stopMonitoring() {
  cronJob?.stop()
  cronJob = null
}
