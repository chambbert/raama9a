'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Image, Book, MapPin, Star, Settings,
  Building, Calendar, Key, Menu, X, LogOut, User,
  ClipboardList, AlertTriangle, BookOpen,
} from 'lucide-react'

type NavItem = { href: string; label: string; icon: React.ElementType; badgeKey?: 'pending' }
type NavGroup = { label: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/bookings', label: 'Bookings', icon: BookOpen, badgeKey: 'pending' },
      { href: '/admin/visits', label: 'Visits', icon: Calendar },
      { href: '/admin/incidents', label: 'Incidents', icon: AlertTriangle },
    ],
  },
  {
    label: 'Guests',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
    ],
  },
  {
    label: 'Property',
    items: [
      { href: '/admin/apartments', label: 'Apartments', icon: Building },
      { href: '/admin/key-codes', label: 'Key Codes', icon: Key },
      { href: '/admin/cleaning-tasks', label: 'Cleaning Tasks', icon: ClipboardList },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/hero-images', label: 'Hero Images', icon: Image },
      { href: '/admin/instructions', label: 'Instructions', icon: Book },
      { href: '/admin/sightseeing', label: 'Sightseeing', icon: MapPin },
    ],
  },
  {
    label: 'Config',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [pendingBookings, setPendingBookings] = useState(0)

  useEffect(() => {
    fetch('/api/admin/bookings', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { if (typeof data.pendingCount === 'number') setPendingBookings(data.pendingCount) })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      )}

      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform lg:transform-none',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-800">
            <Link href="/" className="text-xl font-bold text-red-500">StayHost</Link>
            <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
          </div>

          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-red-400" />
              </div>
              <div className="overflow-hidden">
                <p className="font-medium truncate text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-2">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="px-5 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  const badge = item.badgeKey === 'pending' && pendingBookings > 0 ? pendingBookings : null
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 mx-2 px-3 py-2 rounded-lg transition-colors text-sm',
                        isActive ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {badge && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                          {badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
