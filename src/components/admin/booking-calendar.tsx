'use client'

import { useState, useEffect, useRef } from 'react'
import type { Booking } from '@/types'

interface Visit {
  id: string
  checkIn: string
  checkOut: string
  apartment: { name: string }
  user: { name: string; email: string; phone?: string | null }
}

type CalendarEvent =
  | { type: 'booking'; data: Booking }
  | { type: 'visit'; data: Visit }

function formatEuro(n: number) {
  return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(d: string) {
  return new Date(d.split('T')[0] + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function toDs(d: Date): string {
  return (
    d.getFullYear() +
    '-' + String(d.getMonth() + 1).padStart(2, '0') +
    '-' + String(d.getDate()).padStart(2, '0')
  )
}

function eventCoversDate(ev: CalendarEvent, ds: string): boolean {
  const ci = (ev.type === 'booking' ? ev.data.checkIn : ev.data.checkIn).split('T')[0]
  const co = (ev.type === 'booking' ? ev.data.checkOut : ev.data.checkOut).split('T')[0]
  return ci <= ds && ds < co
}

const STATUS_BG: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500',
  PENDING: 'bg-amber-400',
}
const STATUS_PILL: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
}

const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function BookingCalendarWidget() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [hoveredEvents, setHoveredEvents] = useState<CalendarEvent[]>([])
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/bookings', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/visits', { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([bd, vd]) => {
        if (bd.bookings) {
          setBookings(bd.bookings.filter((b: Booking) => b.status !== 'REJECTED'))
        }
        if (vd.visits) setVisits(vd.visits)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startPad = (firstDay.getDay() + 6) % 7 // Mon = 0

  const days: (Date | null)[] = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d))

  const allEvents: CalendarEvent[] = [
    ...bookings.map((b) => ({ type: 'booking' as const, data: b })),
    ...visits.map((v) => ({ type: 'visit' as const, data: v })),
  ]

  const todayDs = toDs(new Date())
  const monthLabel = currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const handleCellEnter = (date: Date, e: React.MouseEvent) => {
    const ds = toDs(date)
    const evs = allEvents.filter((ev) => eventCoversDate(ev, ds))
    if (!evs.length) return
    setHoveredEvents(evs)
    updatePos(e.clientX, e.clientY)
  }

  const handleCellMove = (e: React.MouseEvent) => {
    if (!hoveredEvents.length) return
    updatePos(e.clientX, e.clientY)
  }

  const handleCellLeave = () => setHoveredEvents([])

  function updatePos(cx: number, cy: number) {
    const w = tooltipRef.current?.offsetWidth ?? 240
    const h = tooltipRef.current?.offsetHeight ?? 120
    const vw = window.innerWidth
    const vh = window.innerHeight
    const x = cx + 14 + w > vw ? cx - w - 14 : cx + 14
    const y = cy + 14 + h > vh ? cy - h - 14 : cy + 14
    setTooltipPos({ x, y })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-lg leading-none"
          >
            ‹
          </button>
          <button
            onClick={() => { const n = new Date(); setCurrentMonth(new Date(n.getFullYear(), n.getMonth(), 1)) }}
            className="px-2 py-1 text-xs rounded-lg hover:bg-gray-100 text-gray-500 font-medium"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-lg leading-none"
          >
            ›
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <>
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 pb-1">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden">
            {days.map((date, idx) => {
              if (!date) {
                return <div key={idx} className="bg-gray-50 min-h-[60px]" />
              }
              const ds = toDs(date)
              const evs = allEvents.filter((ev) => eventCoversDate(ev, ds))
              const isToday = ds === todayDs

              return (
                <div
                  key={idx}
                  className={`bg-white min-h-[60px] p-1 ${evs.length ? 'cursor-default' : ''}`}
                  onMouseEnter={evs.length ? (e) => handleCellEnter(date, e) : undefined}
                  onMouseMove={evs.length ? handleCellMove : undefined}
                  onMouseLeave={evs.length ? handleCellLeave : undefined}
                >
                  <span
                    className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mx-auto ${
                      isToday ? 'bg-red-500 text-white' : 'text-gray-700'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <div className="flex flex-col gap-px mt-0.5">
                    {evs.slice(0, 3).map((ev, i) => {
                      const isBk = ev.type === 'booking'
                      const color = isBk
                        ? (STATUS_BG[ev.data.status] ?? 'bg-gray-400')
                        : 'bg-blue-400'
                      const label = isBk ? ev.data.guestName : ev.data.user.name
                      return (
                        <div
                          key={i}
                          className={`${color} text-white text-[9px] leading-tight rounded px-1 py-px truncate`}
                        >
                          {label}
                        </div>
                      )
                    })}
                    {evs.length > 3 && (
                      <div className="text-[9px] text-gray-400 pl-1">+{evs.length - 3}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block flex-shrink-0" />
              Confirmed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block flex-shrink-0" />
              Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block flex-shrink-0" />
              Visit
            </span>
          </div>
        </>
      )}

      {/* Hover tooltip */}
      {hoveredEvents.length > 0 && (
        <div
          ref={tooltipRef}
          className="fixed z-50 bg-white shadow-2xl border border-gray-200 rounded-xl p-3.5 text-sm w-64 pointer-events-none"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          {hoveredEvents.map((ev, i) => (
            <div key={i} className={i > 0 ? 'mt-3 pt-3 border-t border-gray-100' : ''}>
              {ev.type === 'booking' ? (
                <>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_BG[ev.data.status] ?? 'bg-gray-400'}`} />
                    <span className="font-semibold text-gray-900 truncate">{ev.data.guestName}</span>
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_PILL[ev.data.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ev.data.status.charAt(0) + ev.data.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>{ev.data.guestEmail}</div>
                    {ev.data.guestPhone && <div>{ev.data.guestPhone}</div>}
                    {ev.data.apartment && <div className="text-gray-700 font-medium">{ev.data.apartment.name}</div>}
                    <div>
                      {fmtDate(ev.data.checkIn)}&nbsp;→&nbsp;{fmtDate(ev.data.checkOut)}
                    </div>
                    {ev.data.totalPrice > 0 && (
                      <div className="font-semibold text-gray-800 pt-0.5">{formatEuro(ev.data.totalPrice)}</div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="font-semibold text-gray-900 truncate">{ev.data.user.name}</span>
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                      Visit
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>{ev.data.user.email}</div>
                    {ev.data.user.phone && <div>{ev.data.user.phone}</div>}
                    <div className="text-gray-700 font-medium">{ev.data.apartment.name}</div>
                    <div>
                      {fmtDate(ev.data.checkIn)}&nbsp;→&nbsp;{fmtDate(ev.data.checkOut)}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
