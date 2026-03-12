import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/apiAuth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = requireAuth(req)
    const existing = await prisma.cluster.findFirst({ where: { id: params.id, userId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { posX, posY } = await req.json()
    const cluster = await prisma.cluster.update({
      where: { id: params.id },
      data: { posX, posY },
    })
    return NextResponse.json({ cluster })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
