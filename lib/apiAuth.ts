import { NextRequest } from 'next/server'
import { verifyToken } from './auth'

export function getAuthUser(req: NextRequest): { userId: string; email: string } | null {
  try {
    const header = req.headers.get('authorization')
    if (header?.startsWith('Bearer ')) {
      const token = header.slice(7)
      return verifyToken(token)
    }
    const cookie = req.cookies.get('seshat_token')
    if (cookie?.value) {
      return verifyToken(cookie.value)
    }
    return null
  } catch {
    return null
  }
}

export function requireAuth(req: NextRequest): { userId: string; email: string } {
  const user = getAuthUser(req)
  if (!user) throw new Error('Unauthorized')
  return user
}
