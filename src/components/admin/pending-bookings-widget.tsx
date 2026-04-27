'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Booking } from '@/types'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatEuro(n: number) {
  return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(n)
}

type InlineAction = {
  bookingId: string
  action: 'confirm' | 'reject'
  notes: string
}

export function PendingBookingsWidget() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [inlineAction, setInlineAction] = useState<InlineAction | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    fetch('/api/admin/bookings?status=PENDING', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.bookings) setBookings(d.bookings) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const startAction = (bookingId: string, action: 'confirm' | 'reject') => {
    setInlineAction({ bookingId, action, notes: '' })
  }

  const cancel = () => setInlineAction(null)

  const submit = async () => {
    if (!inlineAction) return
    setSubmitting(true)
    const status = inlineAction.action === 'confirm' ? 'CONFIRMED' : 'REJECTED'
    try {
      await fetch(`/api/admin/bookings/${inlineAction.bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: inlineAction.notes || null }),
        credentials: 'include',
      })
      setInlineAction(null)
      load()
    } catch {
      // fail silently on dashboard widget
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || bookings.length === 0) return null

  return (
    <Card className="border-amber-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Pending Requests
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
              {bookings.length}
            </span>
          </CardTitle>
          <Link
            href="/admin/bookings"
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y divide-gray-100">
          {bookings.map((b) => {
            const isActing = inlineAction?.bookingId === b.id
            const nights = Math.round(
              (new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) /
                (1000 * 60 * 60 * 24)
            )

            return (
              <div key={b.id} className="py-3">
                {/* Main row */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="font-medium text-sm text-gray-900 truncate">{b.guestName}</p>
                      <p className="text-xs text-gray-400 flex-shrink-0">
                        {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {nights}n
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500 truncate">{b.guestEmail}</p>
                      {b.apartment && (
                        <span className="text-xs text-gray-400 flex-shrink-0">· {b.apartment.name}</span>
                      )}
                      {b.totalPrice > 0 && (
                        <span className="text-xs font-medium text-gray-700 flex-shrink-0 ml-auto">
                          {formatEuro(b.totalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isActing && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => startAction(b.id, 'confirm')}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Confirm
                      </button>
                      <button
                        onClick={() => startAction(b.id, 'reject')}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline action form */}
                {isActing && (
                  <div className="mt-2.5 pl-0">
                    {inlineAction.action === 'reject' && (
                      <textarea
                        autoFocus
                        rows={2}
                        value={inlineAction.notes}
                        onChange={(e) =>
                          setInlineAction({ ...inlineAction, notes: e.target.value })
                        }
                        placeholder="Reason for rejection (optional)"
                        className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={submit}
                        disabled={submitting}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors disabled:opacity-60 ${
                          inlineAction.action === 'confirm'
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : 'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        {submitting
                          ? 'Saving…'
                          : inlineAction.action === 'confirm'
                          ? 'Confirm booking'
                          : 'Reject booking'}
                      </button>
                      <button
                        onClick={cancel}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      {inlineAction.action === 'confirm' && (
                        <span className="text-xs text-gray-400 ml-1">
                          A user account will be created for this guest
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
