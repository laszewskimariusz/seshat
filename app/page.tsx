'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from './lib/authContext'
import { apiFetch } from './lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      login(data.token, data.user)
      router.push('/app')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="font-caveat text-5xl text-center mb-2 text-gray-800">Seshat</h1>
        <p className="text-center text-gray-500 mb-8 font-nunito">Your homelab, mapped.</p>

        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-lg p-6">
          <h2 className="font-caveat text-2xl mb-4 text-gray-800">Sign in</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
                placeholder="you@homelab.local" required
                data-testid="email-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
                placeholder="••••••••" required
                data-testid="password-input"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-2 px-4 bg-black text-white rounded font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              data-testid="login-btn"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            No account?{' '}
            <Link href="/register" className="text-black font-medium underline">Register</Link>
          </p>
        </div>
      </div>
    </main>
  )
}

