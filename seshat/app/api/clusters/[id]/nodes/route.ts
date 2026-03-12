import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = requireAuth(req)
    const cluster = await prisma.cluster.findFirst({ where: { id: params.id, userId } })
    if (!cluster) return NextResponse.json({ error: 'Cluster not found' }, { status: 404 })

    const { name, type, ip, os, emoji, notes } = await req.json()
    if (!name || !ip) return NextResponse.json({ error: 'Name and IP required' }, { status: 400 })

    const node = await prisma.node.create({
      data: { clusterId: params.id, userId, name, type: type || 'VM', ip, os, emoji, notes },
      include: { services: true },
    })
    return NextResponse.json({ node }, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
