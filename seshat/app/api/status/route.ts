import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiAuth'
import { getUserStatuses } from '@/lib/monitor'

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req)
    const statuses = getUserStatuses(userId)
    return NextResponse.json({ statuses })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
