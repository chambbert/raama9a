'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import type { Booking, Apartment } from '@/types'

interface Visit {
  id: string
  checkIn: string
  checkOut: string
  apartment: { name: string }
  user: { name: string; email: string; phone?: string | null }
}

type NewBookingForm = {
  apartmentId: string
  guestName: string
  guestEmail: string
  guestPhone: string
  checkIn: string
  checkOut: string
  adults: number
  notes: string
}

function emptyForm(apartments: Apartment[], checkIn?: string): NewBookingForm {
  const ci = checkIn ?? toDs(new Date())
  const co = toDs(new Date(new Date(ci + 'T00:00:00').getTime() + 24 * 60 * 60 * 1000))
  return {
    apartmentId: apartments[0]?.id ?? '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkIn: ci,
    checkOut: co,
    adults: 1,
    notes: '',
  }
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
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [hoveredEvents, setHoveredEvents] = useState<CalendarEvent[]>([])
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [bookingForm, setBookingForm] = useState<NewBookingForm>(emptyForm([]))
  const [bookingError, setBookingError] = useState('')
  const [submittingBooking, setSubmittingBooking] = useState(false)

  const loadEvents = () => {
    return Promise.all([
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
  }

  useEffect(() => {
    loadEvents()
    fetch('/api/apartments', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.apartments) setApartments(d.apartments) })
      .catch(() => {})
  }, [])

  const openNewBooking = (checkIn?: string) => {
    setBookingForm(emptyForm(apartments, checkIn))
    setBookingError('')
    setIsBookingModalOpen(true)
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingBooking(true)
    setBookingError('')

    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...bookingForm,
          guestPhone: bookingForm.guestPhone || null,
          notes: bookingForm.notes || null,
          visitors: [],
        }),
      })

      if (res.ok) {
        setIsBookingModalOpen(false)
        loadEvents()
      } else {
        const data = await res.json()
        setBookingError(data.error || 'Failed to create booking')
      }
    } catch {
      setBookingError('An error occurred')
    } finally {
      setSubmittingBooking(false)
    }
  }

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
            onClick={() => openNewBooking()}
            disabled={!apartments.length}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 text-gray-600 text-xs font-medium disabled:opacity-40 mr-1"
            title="Book a stay directly (e.g. for yourself or family)"
          >
            <Plus className="h-3.5 w-3.5" />
            New booking
          </button>
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
                  className={`bg-white min-h-[60px] p-1 ${evs.length || !apartments.length ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'}`}
                  onMouseEnter={evs.length ? (e) => handleCellEnter(date, e) : undefined}
                  onMouseMove={evs.length ? handleCellMove : undefined}
                  onMouseLeave={evs.length ? handleCellLeave : undefined}
                  onClick={evs.length || !apartments.length ? undefined : () => openNewBooking(ds)}
                  title={evs.length || !apartments.length ? undefined : 'Book this date'}
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

      {/* New booking modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title="New Booking"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <p className="text-xs text-gray-500 -mt-2">
            Blocks these dates immediately — no guest request or approval step. Use this for
            your own stays or family/friends.
          </p>

          {bookingError && <Alert variant="error">{bookingError}</Alert>}

          {apartments.length > 1 && (
            <Select
              id="apartmentId"
              label="Apartment"
              value={bookingForm.apartmentId}
              onChange={(e) => setBookingForm({ ...bookingForm, apartmentId: e.target.value })}
              options={apartments.map((a) => ({ value: a.id, label: a.name }))}
              required
            />
          )}

          <Input
            id="guestName"
            label="Guest name"
            value={bookingForm.guestName}
            onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
            placeholder="e.g. Kaspar / Family"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="guestEmail"
              type="email"
              label="Email"
              value={bookingForm.guestEmail}
              onChange={(e) => setBookingForm({ ...bookingForm, guestEmail: e.target.value })}
              required
            />
            <Input
              id="guestPhone"
              type="tel"
              label="Phone (optional)"
              value={bookingForm.guestPhone}
              onChange={(e) => setBookingForm({ ...bookingForm, guestPhone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="checkIn"
              type="date"
              label="Check-in"
              value={bookingForm.checkIn}
              onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
              required
            />
            <Input
              id="checkOut"
              type="date"
              label="Check-out"
              value={bookingForm.checkOut}
              onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
              required
            />
          </div>

          <Input
            id="adults"
            type="number"
            label="Adults"
            min={1}
            max={4}
            value={bookingForm.adults}
            onChange={(e) => setBookingForm({ ...bookingForm, adults: Number(e.target.value) || 1 })}
          />

          <Textarea
            id="bookingNotes"
            label="Notes (optional)"
            value={bookingForm.notes}
            onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
            rows={2}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBookingModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={submittingBooking} className="flex-1">
              Create Booking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
