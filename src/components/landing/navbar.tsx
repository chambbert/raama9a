'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react'

export function Navbar() {
  const { user, logout, loading } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-100">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-18 py-4">
          <Link href="/" className="font-serif-display text-2xl font-light tracking-widest text-stone-800 uppercase">
            Rääma 9a
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#amenities" className="text-xs tracking-widest uppercase text-stone-500 hover:text-stone-800 transition-colors">
              Amenities
            </Link>
            <Link href="/#location" className="text-xs tracking-widest uppercase text-stone-500 hover:text-stone-800 transition-colors">
              Location
            </Link>
            <Link href="/#reviews" className="text-xs tracking-widest uppercase text-stone-500 hover:text-stone-800 transition-colors">
              Reviews
            </Link>
            <Link href="/#contact" className="text-xs tracking-widest uppercase text-stone-500 hover:text-stone-800 transition-colors">
              Contact
            </Link>

            {loading ? (
              <div className="w-20 h-8 bg-stone-100 animate-pulse rounded" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs tracking-widest uppercase text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>{user.name}</span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded bg-white shadow-lg border border-stone-100 py-1">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      My Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login?callbackUrl=/dashboard"
                className="text-xs tracking-widest uppercase border border-stone-300 text-stone-600 hover:border-sky-600 hover:text-sky-600 px-5 py-2 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-stone-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-stone-100">
            <div className="flex flex-col gap-4">
              {['/#amenities', '/#location', '/#reviews', '/#contact'].map((href, i) => (
                <Link
                  key={href}
                  href={href}
                  className="text-xs tracking-widest uppercase text-stone-500 hover:text-stone-800 transition-colors py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {['Amenities', 'Location', 'Reviews', 'Contact'][i]}
                </Link>
              ))}

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-xs tracking-widest uppercase text-stone-500 hover:text-stone-800 transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left text-xs tracking-widest uppercase text-stone-500 hover:text-stone-800 transition-colors py-1"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login?callbackUrl=/dashboard"
                  className="text-xs tracking-widest uppercase text-stone-500 hover:text-stone-800 transition-colors py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
