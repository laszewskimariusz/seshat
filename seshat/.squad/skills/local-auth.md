# Skill: Local JWT Auth

Used by @capcom in `src/lib/auth.ts` and `src/middleware.ts`.
No Supabase, no Auth0. Fully offline capable.

## src/lib/auth.ts

```typescript
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const SECRET = process.env.JWT_SECRET!
const COOKIE_NAME = 'seshat_token'
const EXPIRES_IN = '7d'

export function signToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, SECRET) as { userId: string; email: string }
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export { COOKIE_NAME }
```

## Cookie options (set on login/register response)

```typescript
import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth'

// In login/register API handler:
const response = NextResponse.json({ data: user })
response.cookies.set(COOKIE_NAME, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7,  // 7 days
  path: '/',
})
return response
```

## src/middleware.ts (route protection)

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

const PUBLIC_PATHS = ['/', '/register', '/api/auth/login', '/api/auth/register', '/api/health']

export function middleware(req: NextRequest) {
  const isPublic = PUBLIC_PATHS.some(p => req.nextUrl.pathname === p)
  if (isPublic) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token || !verifyToken(token)) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/api/:path*'],
}
```

## src/lib/db.ts (Prisma singleton with SQLite WAL)

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// SQLite WAL mode for better concurrent read performance
if (process.env.DATABASE_URL?.startsWith('file:')) {
  db.$executeRawUnsafe('PRAGMA journal_mode=WAL;').catch(() => {})
  db.$executeRawUnsafe('PRAGMA busy_timeout=5000;').catch(() => {})
}
```
