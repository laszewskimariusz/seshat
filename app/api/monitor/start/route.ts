import { NextResponse } from 'next/server'
import { startMonitoring } from '@/lib/monitor'

export async function POST() {
  startMonitoring()
  return NextResponse.json({ started: true })
}
