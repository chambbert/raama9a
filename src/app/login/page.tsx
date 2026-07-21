'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { Alert } from '@/components/ui/alert'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)

      if (result.success) {
        if (result.role === 'ADMIN') {
          window.location.href = '/admin'
        } else if (result.role === 'CLEANER') {
          window.location.href = '/cleaner'
        } else {
          window.location.href = callbackUrl
        }
      } else {
        setError(result.error || 'Login failed')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-stone-900 flex-col items-center justify-center p-16">
        <Link href="/" className="text-center">
          <p className="text-xs tracking-widest uppercase text-sky-500 mb-4">Pärnu · Estonia</p>
          <h1 className="font-serif-display text-5xl font-light tracking-widest text-white uppercase mb-3">
            Rääma 9a
          </h1>
          <div className="w-8 h-px bg-white/30 mx-auto mb-3" />
          <p className="text-xs tracking-widest uppercase text-stone-400">Riverside Apartment</p>
        </Link>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-12">
          <Link href="/">
            <p className="text-xs tracking-widest uppercase text-sky-600 mb-2">Pärnu · Estonia</p>
            <h1 className="font-serif-display text-3xl font-light tracking-widest text-stone-800 uppercase">
              Rääma 9a
            </h1>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-10">
            <p className="text-xs tracking-widest uppercase text-stone-400 mb-2">Guest portal</p>
            <h2 className="font-serif-display text-3xl font-light text-stone-800 tracking-wide">
              Welcome back
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <Alert variant="error">{error}</Alert>}

            <div>
              <label htmlFor="email" className="block text-xs tracking-widest uppercase text-stone-400 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full border-0 border-b border-stone-200 focus:border-sky-600 focus:outline-none py-2 text-sm text-stone-800 placeholder:text-stone-300 bg-transparent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs tracking-widest uppercase text-stone-400 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border-0 border-b border-stone-200 focus:border-sky-600 focus:outline-none py-2 text-sm text-stone-800 placeholder:text-stone-300 bg-transparent transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 text-xs tracking-widest uppercase bg-stone-900 text-white hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-stone-100 text-center">
            <Link href="/" className="text-xs tracking-widest uppercase text-stone-400 hover:text-stone-800 transition-colors">
              ← Back to site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
