import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiAuth'
import { checkAll } from '@/lib/monitor'

export async function POST(req: NextRequest) {
  try {
    requireAuth(req)
    const results = await checkAll()
    return NextResponse.json({ results, count: results.length })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
