import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = requireAuth(req)
    const cluster = await prisma.cluster.findFirst({
      where: { id: params.id, userId },
      include: { nodes: { include: { services: true } } },
    })
    if (!cluster) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ cluster })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = requireAuth(req)
    const existing = await prisma.cluster.findFirst({ where: { id: params.id, userId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const data = await req.json()
    const cluster = await prisma.cluster.update({
      where: { id: params.id },
      data: {
        name: data.name,
        type: data.type,
        color: data.color,
        cidr: data.cidr,
        emoji: data.emoji,
        posX: data.posX,
        posY: data.posY,
      },
      include: { nodes: { include: { services: true } } },
    })
    return NextResponse.json({ cluster })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = requireAuth(req)
    const existing = await prisma.cluster.findFirst({ where: { id: params.id, userId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.cluster.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
