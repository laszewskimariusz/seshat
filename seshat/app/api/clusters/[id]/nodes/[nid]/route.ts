import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'

export async function PUT(req: NextRequest, { params }: { params: { id: string; nid: string } }) {
  try {
    const { userId } = requireAuth(req)
    const cluster = await prisma.cluster.findFirst({ where: { id: params.id, userId } })
    if (!cluster) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const data = await req.json()
    const node = await prisma.node.update({
      where: { id: params.nid },
      data: { name: data.name, type: data.type, ip: data.ip, os: data.os, emoji: data.emoji, notes: data.notes },
      include: { services: true },
    })
    return NextResponse.json({ node })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; nid: string } }) {
  try {
    const { userId } = requireAuth(req)
    const cluster = await prisma.cluster.findFirst({ where: { id: params.id, userId } })
    if (!cluster) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.node.delete({ where: { id: params.nid } })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
