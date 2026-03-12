'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User { id: string; email: string }
interface AuthCtx {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const t = localStorage.getItem('seshat_token')
    const u = localStorage.getItem('seshat_user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    setLoading(false)
  }, [])

  const login = (t: string, u: User) => {
    localStorage.setItem('seshat_token', t)
    localStorage.setItem('seshat_user', JSON.stringify(u))
    setToken(t); setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('seshat_token')
    localStorage.removeItem('seshat_user')
    setToken(null); setUser(null)
    router.push('/')
  }

  return <AuthContext.Provider value={{ user, token, login, logout, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
