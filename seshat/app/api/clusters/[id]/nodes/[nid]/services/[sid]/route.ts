import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'

export async function PUT(req: NextRequest, { params }: { params: { id: string; nid: string; sid: string } }) {
  try {
    const { userId } = requireAuth(req)
    const cluster = await prisma.cluster.findFirst({ where: { id: params.id, userId } })
    if (!cluster) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const data = await req.json()
    const service = await prisma.service.update({
      where: { id: params.sid },
      data: {
        name: data.name,
        port: data.port ? Number(data.port) : undefined,
        protocol: data.protocol,
        ip: data.ip,
        shareIp: data.shareIp,
      },
    })
    return NextResponse.json({ service })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; nid: string; sid: string } }) {
  try {
    const { userId } = requireAuth(req)
    const cluster = await prisma.cluster.findFirst({ where: { id: params.id, userId } })
    if (!cluster) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.service.delete({ where: { id: params.sid } })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
