'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Apartment, PriceBreakdownItem, Visitor } from '@/types'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('et-EE', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(amount)
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

// d is a local-midnight Date representing a picked calendar day — read its
// local Y/M/D components, not toISOString(), which converts to UTC and
// shifts the date back a day in timezones ahead of UTC (e.g. Estonia).
function toDateString(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

type BreakdownGroup = { startDate: string; endDate: string; nights: number; pricePerNight: number; subtotal: number }

function groupBreakdown(items: PriceBreakdownItem[]): BreakdownGroup[] {
  if (!items.length) return []
  const groups: BreakdownGroup[] = []
  let start = 0
  for (let i = 1; i <= items.length; i++) {
    if (i === items.length || items[i].price !== items[start].price) {
      const slice = items.slice(start, i)
      groups.push({
        startDate: slice[0].date,
        endDate: slice[slice.length - 1].date,
        nights: slice.length,
        pricePerNight: slice[0].price,
        subtotal: slice.reduce((s, it) => s + it.price, 0),
      })
      start = i
    }
  }
  return groups
}

function formatGroupLabel(startDate: string, endDate: string): string {
  const s = new Date(startDate + 'T00:00:00')
  const e = new Date(endDate + 'T00:00:00')
  const sLabel = s.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  if (startDate === endDate) return sLabel
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`
  }
  return `${sLabel} – ${e.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`
}

function formatShort(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

type BlockedRange = { checkIn: string; checkOut: string }

interface BookingSectionProps {
  apartments: Apartment[]
}

export function BookingSection({ apartments }: BookingSectionProps) {
  const today = useMemo(() => startOfDay(new Date()), [])

  // Calendar nav
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  // Date selection
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)

  // Apartment + availability
  const [selectedApartmentId, setSelectedApartmentId] = useState(apartments[0]?.id ?? '')
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)

  const selectedApartment = apartments.find((a) => a.id === selectedApartmentId)

  const pricingMap = useMemo(
    () => new Map(selectedApartment?.pricing.map((p) => [p.dayOfWeek, p.pricePerNight]) ?? []),
    [selectedApartment],
  )

  const datePriceMap = useMemo(
    () => new Map(selectedApartment?.datePrices.map((dp) => [dp.date, dp.price]) ?? []),
    [selectedApartment],
  )

  const hasPricing = useMemo(
    () => selectedApartment?.pricing.some((p) => p.pricePerNight > 0) || (selectedApartment?.cleanerFee ?? 0) > 0,
    [selectedApartment],
  )

  const minPrice = useMemo(() => {
    const prices = (selectedApartment?.pricing ?? []).filter((p) => p.pricePerNight > 0).map((p) => p.pricePerNight)
    return prices.length ? Math.min(...prices) : null
  }, [selectedApartment])

  // Fetch availability when apartment changes
  useEffect(() => {
    if (!selectedApartmentId) return
    setCheckIn(null)
    setCheckOut(null)
    setBlockedRanges([])
    setAvailabilityLoading(true)
    fetch(`/api/bookings/availability?apartmentId=${selectedApartmentId}`)
      .then((r) => r.json())
      .then((d) => setBlockedRanges(d.blockedRanges ?? []))
      .catch(() => {})
      .finally(() => setAvailabilityLoading(false))
  }, [selectedApartmentId])

  // Calendar navigation
  const canGoPrev = viewYear > today.getFullYear()
    || (viewYear === today.getFullYear() && viewMonth > today.getMonth())

  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  const goPrev = () => {
    if (!canGoPrev) return
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }

  // Helpers
  const isDateBlocked = useCallback((date: Date) =>
    blockedRanges.some((r) => date >= new Date(r.checkIn) && date < new Date(r.checkOut)),
    [blockedRanges],
  )

  const rangeContainsBlocked = useCallback((from: Date, to: Date) =>
    blockedRanges.some((r) => from < new Date(r.checkOut) && to > new Date(r.checkIn)),
    [blockedRanges],
  )

  // Date click
  const handleDateClick = useCallback((date: Date) => {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date)
      setCheckOut(null)
    } else if (date <= checkIn) {
      setCheckIn(date)
      setCheckOut(null)
    } else if (rangeContainsBlocked(checkIn, date)) {
      setCheckIn(date)
      setCheckOut(null)
    } else {
      setCheckOut(date)
      setHoverDate(null)
    }
  }, [checkIn, checkOut, rangeContainsBlocked])

  // Calendar grid
  const calendarDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const last = new Date(viewYear, viewMonth + 1, 0)
    const pad = (first.getDay() + 6) % 7
    const days: (Date | null)[] = Array(pad).fill(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(viewYear, viewMonth, d))
    return days
  }, [viewYear, viewMonth])

  // Price calculation
  const { priceBreakdown, accommodationTotal } = useMemo(() => {
    if (!checkIn || !checkOut) return { priceBreakdown: [] as PriceBreakdownItem[], accommodationTotal: 0 }
    const breakdown: PriceBreakdownItem[] = []
    let total = 0
    const cur = new Date(checkIn)
    while (cur < checkOut) {
      const dow = cur.getDay()
      const ds = toDateString(cur)
      const price = datePriceMap.get(ds) ?? pricingMap.get(dow) ?? 0
      breakdown.push({ date: toDateString(cur), dayOfWeek: dow, price })
      total += price
      cur.setDate(cur.getDate() + 1)
    }
    return { priceBreakdown: breakdown, accommodationTotal: total }
  }, [checkIn, checkOut, pricingMap])

  const cleanerFee = selectedApartment?.cleanerFee ?? 0
  const totalPrice = accommodationTotal + cleanerFee
  const nightCount = priceBreakdown.length

  // Guest form
  const prevGuestNameRef = useRef('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [adults, setAdults] = useState(1)
  const [visitors, setVisitors] = useState<Visitor[]>([{ name: '', birthdate: '' }])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Sync visitor rows when adult count changes
  const handleAdultsChange = (n: number) => {
    setAdults(n)
    setVisitors((prev) => {
      if (n > prev.length) {
        return [...prev, ...Array(n - prev.length).fill({ name: '', birthdate: '' })]
      }
      return prev.slice(0, n)
    })
  }

  const updateVisitor = (idx: number, field: keyof Visitor, value: string) => {
    setVisitors((prev) => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v))
  }

  const handleGuestNameChange = (value: string) => {
    setGuestName(value)
    // Auto-fill visitor 0 name only if it's still in sync with the booking name
    setVisitors((prev) => {
      if (prev[0].name === '' || prev[0].name === prevGuestNameRef.current) {
        const updated = [...prev]
        updated[0] = { ...updated[0], name: value }
        return updated
      }
      return prev
    })
    prevGuestNameRef.current = value
  }

  const visitorsComplete = visitors.every((v) => v.name.trim().length >= 2 && v.birthdate)
  const canSubmit = !!(checkIn && checkOut && guestName && guestEmail && visitorsComplete && !submitting)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !checkIn || !checkOut) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentId: selectedApartmentId,
          guestName, guestEmail,
          guestPhone: guestPhone || null,
          checkIn: toDateString(checkIn),
          checkOut: toDateString(checkOut),
          adults,
          notes: notes || null,
          visitors,
        }),
      })
      const data = await res.json()
      if (res.ok) setSubmitSuccess(true)
      else setSubmitError(data.error || 'Something went wrong.')
    } catch {
      setSubmitError('Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!apartments.length) return null

  // --- Render cell ---
  const renderCell = (date: Date | null, idx: number) => {
    if (!date) return <div key={`pad-${idx}`} />

    const isPast = date < today
    const isBlocked = isDateBlocked(date)
    const disabled = isPast || isBlocked

    const isStart = !!(checkIn && isSameDay(date, checkIn))
    const isEnd = !!(checkOut && isSameDay(date, checkOut))

    const previewEnd = !checkOut && checkIn && hoverDate && hoverDate > checkIn ? hoverDate : null
    const effectiveEnd = checkOut ?? previewEnd
    const isInRange = !!(checkIn && effectiveEnd && date > checkIn && date < effectiveEnd && !isStart && !isEnd)

    const dateStr = toDateString(date)
    const hasDateOverride = datePriceMap.has(dateStr)
    const price = hasDateOverride ? datePriceMap.get(dateStr)! : pricingMap.get(date.getDay())
    const showPrice = hasPricing && !disabled && price !== undefined && price > 0

    return (
      <div
        key={toDateString(date)}
        onClick={() => !disabled && handleDateClick(date)}
        onMouseEnter={() => { if (!disabled && checkIn && !checkOut) setHoverDate(date) }}
        onMouseLeave={() => setHoverDate(null)}
        className={[
          'relative flex flex-col items-center justify-center h-12 rounded-lg transition-colors select-none text-sm',
          disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
          isStart || isEnd ? 'bg-red-500 text-white font-semibold z-10' : '',
          isInRange && !isStart && !isEnd ? 'bg-red-100 rounded-none' : '',
          !disabled && !isStart && !isEnd && !isInRange ? 'hover:bg-gray-100' : '',
          !isStart && !isEnd && !isInRange ? 'text-gray-800' : '',
        ].filter(Boolean).join(' ')}
      >
        <span className="leading-none">{date.getDate()}</span>
        {showPrice && (
          <span className={`text-[10px] leading-none mt-0.5 ${
            isStart || isEnd ? 'text-red-200' : hasDateOverride ? 'text-amber-500 font-medium' : 'text-gray-400'
          }`}>
            {formatEuro(price)}
          </span>
        )}
        {isBlocked && !isPast && (
          <span className="absolute inset-x-1.5 top-1/2 border-t border-gray-300 pointer-events-none" />
        )}
      </div>
    )
  }

  const selectionLabel = checkIn && checkOut
    ? `${formatShort(checkIn)} → ${formatShort(checkOut)}  ·  ${nightCount} night${nightCount !== 1 ? 's' : ''}`
    : checkIn
      ? 'Now select check-out date'
      : 'Select check-in date'

  return (
    <section id="booking" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Book Your Stay</h2>
          <p className="text-gray-500">
            {minPrice ? `From ${formatEuro(minPrice)}/night · ` : ''}
            Select your dates to see availability and pricing
          </p>
        </div>

        {submitSuccess ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking Request Sent!</h3>
            <p className="text-gray-500 mb-1">
              Thank you, <strong>{guestName}</strong>.
            </p>
            <p className="text-gray-500 mb-1">
              {checkIn && checkOut && <>{formatShort(checkIn)} → {formatShort(checkOut)}</>}
            </p>
            <p className="text-gray-400 text-sm mt-3">We&apos;ll review and confirm your booking by email shortly.</p>
            <button
              onClick={() => {
                setSubmitSuccess(false)
                setCheckIn(null); setCheckOut(null)
                setGuestName(''); setGuestEmail(''); setGuestPhone(''); setNotes('')
                setAdults(1); setVisitors([{ name: '', birthdate: '' }])
                prevGuestNameRef.current = ''
              }}
              className="mt-6 text-sm text-red-500 hover:underline"
            >
              Make another booking
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Apartment selector (only if multiple) */}
            {apartments.length > 1 && (
              <div className="px-6 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Apartment</label>
                <select
                  value={selectedApartmentId}
                  onChange={(e) => setSelectedApartmentId(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {apartments.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

              {/* ── LEFT: Calendar ── */}
              <div className="p-6">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-5">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={!canGoPrev}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="font-semibold text-gray-900">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </span>
                  <button
                    type="button"
                    onClick={goNext}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-1">
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="text-center text-xs font-medium text-gray-400 py-1.5">
                      {w}
                    </div>
                  ))}
                </div>

                {/* Date cells */}
                {availabilityLoading ? (
                  <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                    Loading availability...
                  </div>
                ) : (
                  <div className="grid grid-cols-7">
                    {calendarDays.map((date, idx) => renderCell(date, idx))}
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-5 text-xs text-gray-400 border-t pt-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-red-500 inline-block flex-shrink-0" />
                    Selected
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-red-100 inline-block flex-shrink-0" />
                    In range
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-gray-200 inline-block flex-shrink-0 opacity-50" />
                    Unavailable
                  </span>
                  {hasPricing && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-white border border-gray-200 inline-block flex-shrink-0" />
                      Price shown per night
                    </span>
                  )}
                </div>
              </div>

              {/* ── RIGHT: Summary + Form ── */}
              <div className="p-6 space-y-5">
                {/* Selection status */}
                <div className={[
                  'text-sm px-4 py-3 rounded-lg font-medium',
                  checkIn && checkOut ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-500',
                ].join(' ')}>
                  {selectionLabel}
                </div>

                {/* Price breakdown */}
                {checkIn && checkOut && hasPricing && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden text-sm">
                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price Breakdown</span>
                    </div>
                    <div className="px-4 py-3 space-y-1.5 max-h-44 overflow-y-auto">
                      {groupBreakdown(priceBreakdown).map((g, i) => (
                        <div key={i} className="flex justify-between text-gray-600">
                          <span>
                            {formatGroupLabel(g.startDate, g.endDate)}
                            {g.nights > 1 && (
                              <span className="text-gray-400 ml-1.5 text-xs">{g.nights} nights · {formatEuro(g.pricePerNight)}/night</span>
                            )}
                          </span>
                          <span>{formatEuro(g.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2.5 border-t border-gray-200 space-y-1">
                      {cleanerFee > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Accommodation ({nightCount} night{nightCount !== 1 ? 's' : ''})</span>
                          <span>{formatEuro(accommodationTotal)}</span>
                        </div>
                      )}
                      {cleanerFee > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Cleaning fee</span>
                          <span>{formatEuro(cleanerFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
                        <span>Total</span>
                        <span>{formatEuro(totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {checkIn && checkOut && !hasPricing && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                    Pricing will be confirmed upon booking.
                  </div>
                )}

                {/* Guest details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Full name *</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => handleGuestNameChange(e.target.value)}
                      placeholder="John Smith"
                      required
                      className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                      className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+372 555 1234"
                      className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Visitors (max 4)</label>
                    <select
                      value={adults}
                      onChange={(e) => handleAdultsChange(Number(e.target.value))}
                      className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? 'visitor' : 'visitors'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Per-visitor fields */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Visitor details *
                  </label>
                  {visitors.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="col-span-2">
                        <span className="text-xs text-gray-400">Guest {idx + 1}</span>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => updateVisitor(idx, 'name', e.target.value)}
                          placeholder="Full name"
                          required
                          minLength={2}
                          className="w-full h-9 rounded-md border border-gray-300 px-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          value={v.birthdate}
                          onChange={(e) => updateVisitor(idx, 'birthdate', e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          required
                          title="Date of birth"
                          className="w-full h-9 rounded-md border border-gray-300 px-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Message to host</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or questions..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                </div>

                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full h-12 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  {submitting
                    ? 'Sending request...'
                    : checkIn && checkOut && totalPrice > 0
                      ? `Request Booking · ${formatEuro(totalPrice)}`
                      : 'Request Booking'}
                </button>

                <p className="text-xs text-center text-gray-400">
                  Your request will be reviewed and confirmed by the host.
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
