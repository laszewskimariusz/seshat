'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/authContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !token) router.push('/')
  }, [token, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <span className="font-caveat text-2xl text-gray-500">Loading...</span>
      </div>
    )
  }
  if (!token) return null

  return <>{children}</>
}
