'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { cn } from '@/lib/utils'
import { Home, Key, Book, MapPin, Star, LogOut, User } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/dashboard/key-codes', label: 'Key Codes', icon: Key },
  { href: '/dashboard/instructions', label: 'Instructions', icon: Book },
  { href: '/dashboard/sightseeing', label: 'Sightseeing', icon: MapPin },
  { href: '/dashboard/review', label: 'Review', icon: Star },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="relative z-10 hidden lg:flex flex-col w-60 min-h-screen bg-stone-900 flex-shrink-0">
        {/* Logo */}
        <div className="px-8 py-8 border-b border-stone-800">
          <Link href="/">
            <p className="text-xs tracking-widest uppercase text-sky-500 mb-1">Pärnu · Estonia</p>
            <h1 className="font-serif-display text-xl font-light tracking-widest text-white uppercase">
              Rääma 9a
            </h1>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-colors',
                  isActive
                    ? 'text-white bg-stone-800 border-l-2 border-sky-500'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/50 border-l-2 border-transparent'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs tracking-widest uppercase">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="px-6 py-6 border-t border-stone-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-stone-300" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-stone-200 truncate">{user?.name}</p>
              <p className="text-xs text-stone-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs tracking-widest uppercase text-stone-500 hover:text-white transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-stone-900 flex items-center justify-between px-5 py-4 border-b border-stone-800">
        <Link href="/">
          <span className="font-serif-display text-lg font-light tracking-widest text-white uppercase">
            Rääma 9a
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="text-stone-400 hover:text-white transition-colors"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900 border-t border-stone-800 flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors',
                isActive ? 'text-sky-400' : 'text-stone-500 hover:text-stone-300'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] tracking-wider uppercase">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
