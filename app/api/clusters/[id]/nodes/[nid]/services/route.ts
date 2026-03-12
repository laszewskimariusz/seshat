import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'

export async function POST(req: NextRequest, { params }: { params: { id: string; nid: string } }) {
  try {
    const { userId } = requireAuth(req)
    const cluster = await prisma.cluster.findFirst({ where: { id: params.id, userId } })
    if (!cluster) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { name, port, protocol, ip, shareIp } = await req.json()
    if (!name || !port) return NextResponse.json({ error: 'Name and port required' }, { status: 400 })

    const service = await prisma.service.create({
      data: {
        nodeId: params.nid,
        userId,
        name,
        port: Number(port),
        protocol: protocol || 'HTTP',
        ip,
        shareIp: shareIp ?? true,
      },
    })
    return NextResponse.json({ service }, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
