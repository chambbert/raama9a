'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Calendar, Check, X, Trash2, User, Mail, Phone, Users, Pencil, Eye, EyeOff, Copy, Check as CheckIcon, Send } from 'lucide-react'
import type { Booking, BookingStatus, PriceBreakdownItem, Visitor, User as ClientUser } from '@/types'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://raama9a.ee'

function loginInfoMailto(account: ClientUser, guestName: string): string {
  const subject = encodeURIComponent('Your login details')
  const body = encodeURIComponent(
    `Hi ${guestName},\n\n` +
    `Here's how to log in and see your check-in instructions, key codes and more:\n\n` +
    `${SITE_URL}/login\n` +
    `Email: ${account.email}\n` +
    `Password: ${account.generatedPassword}\n\n` +
    `See you soon!`
  )
  return `mailto:${account.email}?subject=${subject}&body=${body}`
}

function formatEuro(amount: number) {
  return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(amount)
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function statusBadge(status: BookingStatus) {
  const styles: Record<BookingStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

type ActionModal = {
  booking: Booking
  action: 'confirm' | 'reject'
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [actionModal, setActionModal] = useState<ActionModal | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [detailModal, setDetailModal] = useState<Booking | null>(null)
  const [priceModal, setPriceModal] = useState<Booking | null>(null)
  const [priceInput, setPriceInput] = useState('')
  const [priceError, setPriceError] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)
  const [clients, setClients] = useState<ClientUser[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/admin/bookings', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings)
        setPendingCount(data.pendingCount)
      } else {
        setError('Failed to load bookings')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
    fetch('/api/users', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.users) setClients(d.users) })
      .catch(() => {})
  }, [])

  const filteredBookings = bookings.filter((b) =>
    statusFilter === 'all' ? true : b.status === statusFilter
  )

  const openAction = (booking: Booking, action: 'confirm' | 'reject') => {
    setActionModal({ booking, action })
    setAdminNotes('')
    setActionError('')
  }

  const handleAction = async () => {
    if (!actionModal) return
    setSubmitting(true)
    setActionError('')

    const status: BookingStatus = actionModal.action === 'confirm' ? 'CONFIRMED' : 'REJECTED'

    try {
      const res = await fetch(`/api/admin/bookings/${actionModal.booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: adminNotes || null }),
        credentials: 'include',
      })

      if (res.ok) {
        setActionModal(null)
        fetchBookings()
      } else {
        const data = await res.json()
        setActionError(data.error || 'Failed to update booking')
      }
    } catch {
      setActionError('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this booking request?')) return
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) fetchBookings()
      else alert('Failed to delete booking')
    } catch {
      alert('An error occurred')
    }
  }

  const openPriceEdit = (booking: Booking) => {
    setPriceModal(booking)
    setPriceInput(String(booking.totalPrice))
    setPriceError('')
  }

  const handlePriceSave = async () => {
    if (!priceModal) return
    const totalPrice = Number(priceInput)
    if (!Number.isFinite(totalPrice) || totalPrice < 0) {
      setPriceError('Enter a valid amount')
      return
    }

    setSavingPrice(true)
    setPriceError('')

    try {
      const res = await fetch(`/api/admin/bookings/${priceModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalPrice }),
        credentials: 'include',
      })

      if (res.ok) {
        setPriceModal(null)
        fetchBookings()
      } else {
        const data = await res.json()
        setPriceError(data.error || 'Failed to update price')
      }
    } catch {
      setPriceError('An error occurred')
    } finally {
      setSavingPrice(false)
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Booking Requests
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-gray-500">Review and confirm guest bookings</p>
        </div>

        <div className="flex gap-2">
          {(['all', 'PENDING', 'CONFIRMED', 'REJECTED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              {s === 'PENDING' && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-xs">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings</h3>
              <p className="text-gray-500">
                {statusFilter === 'all' ? 'No booking requests yet.' : `No ${statusFilter.toLowerCase()} bookings.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Guest</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Apartment</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Dates</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Received</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setDetailModal(booking); setShowPassword(false); setCopiedPassword(false) }}
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-sm">{booking.guestName}</p>
                        <p className="text-xs text-gray-500">{booking.guestEmail}</p>
                      </td>
                      <td className="py-3 px-4 text-sm">{booking.apartment?.name}</td>
                      <td className="py-3 px-4 text-sm">
                        <span>{formatDate(booking.checkIn)}</span>
                        <span className="text-gray-400 mx-1">→</span>
                        <span>{formatDate(booking.checkOut)}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{booking.totalPrice > 0 ? formatEuro(booking.totalPrice) : '—'}</span>
                          <button
                            onClick={() => openPriceEdit(booking)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Edit price"
                          >
                            <Pencil className="h-3.5 w-3.5 text-gray-400" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">{statusBadge(booking.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(booking.createdAt)}
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          {booking.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => openAction(booking, 'confirm')}
                                className="p-1.5 hover:bg-green-50 rounded-lg"
                                title="Confirm"
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </button>
                              <button
                                onClick={() => openAction(booking, 'reject')}
                                className="p-1.5 hover:bg-red-50 rounded-lg"
                                title="Reject"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm / Reject modal */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal?.action === 'confirm' ? 'Confirm Booking' : 'Reject Booking'}
      >
        {actionModal && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg text-sm space-y-1">
              <p><span className="text-gray-500">Guest:</span> <strong>{actionModal.booking.guestName}</strong></p>
              <p><span className="text-gray-500">Dates:</span> {formatDate(actionModal.booking.checkIn)} → {formatDate(actionModal.booking.checkOut)}</p>
              <p><span className="text-gray-500">Apartment:</span> {actionModal.booking.apartment?.name}</p>
              {actionModal.booking.totalPrice > 0 && (
                <p><span className="text-gray-500">Total:</span> {formatEuro(actionModal.booking.totalPrice)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {actionModal.action === 'reject' ? 'Reason for rejection (optional)' : 'Note for guest (optional)'}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder={actionModal.action === 'reject' ? 'e.g. Apartment not available on those dates' : 'e.g. Looking forward to your stay!'}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {actionError && <Alert variant="error">{actionError}</Alert>}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setActionModal(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                loading={submitting}
                className={`flex-1 ${actionModal.action === 'reject' ? 'bg-red-500 hover:bg-red-600' : ''}`}
              >
                {actionModal.action === 'confirm' ? 'Confirm Booking' : 'Reject Booking'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Detail modal */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Booking Details"
      >
        {detailModal && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              {statusBadge(detailModal.status)}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Total price</span>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">{formatEuro(detailModal.totalPrice)}</span>
                <button
                  onClick={() => openPriceEdit(detailModal)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Edit price"
                >
                  <Pencil className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">{detailModal.guestName}</p>
                  <p className="text-gray-500">{detailModal.adults} {detailModal.adults === 1 ? 'adult' : 'adults'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">{formatDate(detailModal.checkIn)}</p>
                  <p className="text-gray-500">→ {formatDate(detailModal.checkOut)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                <a href={`mailto:${detailModal.guestEmail}`} className="text-red-500 hover:underline">
                  {detailModal.guestEmail}
                </a>
              </div>
              {detailModal.guestPhone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                  <a href={`tel:${detailModal.guestPhone}`} className="text-red-500 hover:underline">
                    {detailModal.guestPhone}
                  </a>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                <span>{detailModal.apartment?.name}</span>
              </div>
            </div>

            {/* Client login info */}
            {(() => {
              const account = clients.find((c) => c.email === detailModal.guestEmail)
              if (!account) return null
              return (
                <div className="border rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Client login</span>
                    {account.generatedPassword && (
                      <a
                        href={loginInfoMailto(account, detailModal.guestName)}
                        className="text-xs text-red-500 hover:underline flex items-center gap-1"
                      >
                        <Send className="h-3 w-3" /> Email login info
                      </a>
                    )}
                  </div>
                  <div className="px-3 py-2 text-xs space-y-1.5">
                    <div className="text-gray-600">Email: {account.email}</div>
                    {account.generatedPassword ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-600">Password:</span>
                        <span className="font-mono text-gray-800 select-all">
                          {showPassword ? account.generatedPassword : '••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(account.generatedPassword!)
                            setCopiedPassword(true)
                            setTimeout(() => setCopiedPassword(false), 2000)
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Copy password"
                        >
                          {copiedPassword ? <CheckIcon className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-400">Password already changed by the client.</p>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Visitor list */}
            {detailModal.visitors && detailModal.visitors.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Visitors</span>
                </div>
                <div className="divide-y">
                  {(detailModal.visitors as Visitor[]).map((v, i) => (
                    <div key={i} className="px-3 py-2 flex justify-between text-sm">
                      <span className="font-medium">{v.name}</span>
                      <span className="text-gray-500">
                        {new Date(v.birthdate + 'T00:00:00').toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailModal.notes && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-xs mb-1">Guest message</p>
                <p>{detailModal.notes}</p>
              </div>
            )}

            {detailModal.priceBreakdown && detailModal.priceBreakdown.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Price Breakdown</span>
                </div>
                <div className="px-3 py-2 space-y-1.5">
                  {groupBreakdown(detailModal.priceBreakdown).map((g, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600">
                      <span>
                        {formatGroupLabel(g.startDate, g.endDate)}
                        {g.nights > 1 && (
                          <span className="text-gray-400 ml-1.5">{g.nights} nights · {formatEuro(g.pricePerNight)}/night</span>
                        )}
                      </span>
                      <span>{formatEuro(g.subtotal)}</span>
                    </div>
                  ))}
                  {detailModal.cleanerFee > 0 && (
                    <div className="flex justify-between text-xs text-gray-600 pt-1 border-t">
                      <span>Cleaning fee</span>
                      <span>{formatEuro(detailModal.cleanerFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                    <span>Total</span>
                    <span>{formatEuro(detailModal.totalPrice)}</span>
                  </div>
                </div>
              </div>
            )}

            {detailModal.adminNotes && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-gray-500 text-xs mb-1">Admin note</p>
                <p>{detailModal.adminNotes}</p>
              </div>
            )}

            {detailModal.status === 'PENDING' && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => { setDetailModal(null); openAction(detailModal, 'reject') }}
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => { setDetailModal(null); openAction(detailModal, 'confirm') }}
                  className="flex-1"
                >
                  Confirm
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit price modal */}
      <Modal
        isOpen={!!priceModal}
        onClose={() => setPriceModal(null)}
        title="Edit Price"
      >
        {priceModal && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg text-sm space-y-1">
              <p><span className="text-gray-500">Guest:</span> <strong>{priceModal.guestName}</strong></p>
              <p><span className="text-gray-500">Dates:</span> {formatDate(priceModal.checkIn)} → {formatDate(priceModal.checkOut)}</p>
            </div>

            <Input
              id="totalPrice"
              type="number"
              label="Total price (€)"
              min={0}
              step="0.01"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-gray-500 -mt-2">
              Overrides the calculated total. The per-night breakdown won&apos;t be shown for this booking anymore.
            </p>

            {priceError && <Alert variant="error">{priceError}</Alert>}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setPriceModal(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handlePriceSave} loading={savingPrice} className="flex-1">
                Save Price
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
