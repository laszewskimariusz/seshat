import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({ data: { email, passwordHash, displayName } })
    const token = signToken({ userId: user.id, email: user.email })

    const res = NextResponse.json({ user: { id: user.id, email: user.email, displayName: user.displayName } }, { status: 201 })
    res.cookies.set('seshat_token', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
