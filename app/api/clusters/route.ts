import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req)
    const clusters = await prisma.cluster.findMany({
      where: { userId },
      include: { nodes: { include: { services: true } } },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ clusters })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req)
    const { name, type, color, cidr, emoji, posX, posY } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const cluster = await prisma.cluster.create({
      data: {
        name,
        type: type || 'general',
        color: color || '#6366f1',
        cidr,
        emoji: emoji || '🖥️',
        posX: posX ?? 100,
        posY: posY ?? 100,
        userId,
      },
      include: { nodes: { include: { services: true } } },
    })
    return NextResponse.json({ cluster }, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
