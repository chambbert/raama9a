'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { Plus, Edit, Trash2, Building, MapPin, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Apartment } from '@/types'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
// Mon-Sun order for display; indices match JS getDay() (0=Sun…6=Sat)
const DOW_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DOW_LABELS: Record<number, string> = { 0: 'Su', 1: 'Mo', 2: 'Tu', 3: 'We', 4: 'Th', 5: 'Fr', 6: 'Sa' }

const defaultPricing = Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, pricePerNight: 0 }))

function toDateStr(d: Date): string {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Apartment | null>(null)

  const [formData, setFormData] = useState({ name: '', address: '', description: '' })
  const [pricing, setPricing] = useState(defaultPricing)
  const [cleanerFee, setCleanerFee] = useState(0)
  const [datePrices, setDatePrices] = useState<Record<string, number>>({})

  // Calendar state
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  }, [])
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const cellInputRef = useRef<HTMLInputElement>(null)

  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchApartments = async () => {
    try {
      const res = await fetch('/api/apartments', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setApartments(data.apartments)
      } else {
        setError('Failed to load apartments')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchApartments() }, [])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({ name: '', address: '', description: '' })
    setPricing(defaultPricing)
    setCleanerFee(0)
    setDatePrices({})
    setCalYear(today.getFullYear())
    setCalMonth(today.getMonth())
    setEditingDate(null)
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (item: Apartment) => {
    setEditingItem(item)
    setFormData({ name: item.name, address: item.address, description: item.description || '' })

    const merged = defaultPricing.map((d) => {
      const existing = item.pricing?.find((p) => p.dayOfWeek === d.dayOfWeek)
      return existing ? { dayOfWeek: d.dayOfWeek, pricePerNight: existing.pricePerNight } : d
    })
    setPricing(merged)
    setCleanerFee(item.cleanerFee ?? 0)

    const dateMap: Record<string, number> = {}
    item.datePrices?.forEach((dp) => { dateMap[dp.date] = dp.price })
    setDatePrices(dateMap)

    setCalYear(today.getFullYear())
    setCalMonth(today.getMonth())
    setEditingDate(null)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Save any in-progress cell edit before submitting
    if (editingDate) commitCellEdit()
    setFormError('')
    setSubmitting(true)

    try {
      const url = editingItem ? `/api/apartments/${editingItem.id}` : '/api/apartments'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      })

      if (!res.ok) {
        const data = await res.json()
        setFormError(data.error || 'Failed to save')
        return
      }

      const { apartment } = await res.json()

      const datePricesArray = Object.entries(datePrices).map(([date, price]) => ({ date, price }))
      const pricingRes = await fetch(`/api/apartments/${apartment.id}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricing, cleanerFee, datePrices: datePricesArray }),
        credentials: 'include',
      })

      if (!pricingRes.ok) {
        const data = await pricingRes.json()
        setFormError(data.error || 'Failed to save pricing')
        return
      }

      setIsModalOpen(false)
      fetchApartments()
    } catch {
      setFormError('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this apartment? This will also delete all associated visits and key codes.')) return
    try {
      const res = await fetch(`/api/apartments/${id}`, { credentials: 'include', method: 'DELETE' })
      if (res.ok) fetchApartments()
      else alert('Failed to delete apartment')
    } catch {
      alert('An error occurred')
    }
  }

  // ── Calendar helpers ──────────────────────────────────────
  const pricingMap = useMemo(
    () => new Map(pricing.map((p) => [p.dayOfWeek, p.pricePerNight])),
    [pricing],
  )

  const calendarDays = useMemo(() => {
    const first = new Date(calYear, calMonth, 1)
    const last = new Date(calYear, calMonth + 1, 0)
    const pad = (first.getDay() + 6) % 7
    const days: (Date | null)[] = Array(pad).fill(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(calYear, calMonth, d))
    return days
  }, [calYear, calMonth])

  const canGoPrev = calYear > today.getFullYear()
    || (calYear === today.getFullYear() && calMonth > today.getMonth())

  const goNext = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1) }
    else setCalMonth((m) => m + 1)
  }
  const goPrev = () => {
    if (!canGoPrev) return
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1) }
    else setCalMonth((m) => m - 1)
  }

  const commitCellEdit = () => {
    if (!editingDate) return
    const val = parseFloat(editingValue)
    if (!isNaN(val) && editingValue.trim() !== '') {
      setDatePrices((prev) => ({ ...prev, [editingDate]: val }))
    } else {
      setDatePrices((prev) => { const u = { ...prev }; delete u[editingDate]; return u })
    }
    setEditingDate(null)
  }

  const startCellEdit = (date: Date) => {
    const ds = toDateStr(date)
    setEditingDate(ds)
    setEditingValue(datePrices[ds] !== undefined ? String(datePrices[ds]) : '')
    setTimeout(() => cellInputRef.current?.focus(), 0)
  }

  const clearOverride = (ds: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDatePrices((prev) => { const u = { ...prev }; delete u[ds]; return u })
  }

  const overrideCount = Object.keys(datePrices).length

  if (loading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apartments</h1>
          <p className="text-gray-500">Manage your properties</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Apartment
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {apartments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Apartments Yet</h3>
              <p className="text-gray-500 mb-4">Add your first property</p>
              <Button onClick={openCreateModal}><Plus className="h-4 w-4 mr-2" />Add Apartment</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apartments.map((apartment) => (
            <Card key={apartment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Building className="h-5 w-5 text-purple-500" />
                    </div>
                    <CardTitle className="text-lg">{apartment.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(apartment)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(apartment.id)} className="p-2 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{apartment.address}</span>
                </div>
                {apartment.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{apartment.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Apartment' : 'Add Apartment'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {formError && <Alert variant="error">{formError}</Alert>}

          <Input
            id="name" label="Name" value={formData.name} required
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Beach House"
          />
          <Input
            id="address" label="Address" value={formData.address} required
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Main St, City"
          />
          <Textarea
            id="description" label="Description (Optional)" value={formData.description} rows={2}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          {/* ── Pricing ────────────────────────────────── */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Pricing</h3>

            {/* Default prices — compact 7-column row */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Default price per night (by weekday)</p>
              <div className="grid grid-cols-7 gap-1">
                {DOW_DISPLAY_ORDER.map((dow) => {
                  const idx = pricing.findIndex((p) => p.dayOfWeek === dow)
                  const p = pricing[idx]
                  return (
                    <div key={dow} className="flex flex-col items-center gap-1">
                      <span className="text-[11px] text-gray-400 font-medium">{DOW_LABELS[dow]}</span>
                      <div className="relative w-full">
                        <input
                          type="number"
                          value={p.pricePerNight || ''}
                          onChange={(e) => {
                            const updated = [...pricing]
                            updated[idx] = { ...updated[idx], pricePerNight: parseFloat(e.target.value) || 0 }
                            setPricing(updated)
                          }}
                          placeholder="0"
                          min="0"
                          step="1"
                          className="w-full h-9 text-center text-sm rounded-md border border-gray-300 pr-4 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">€</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cleaning fee */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-24 flex-shrink-0">Cleaning fee</span>
              <div className="relative flex-1">
                <input
                  type="number"
                  value={cleanerFee || ''}
                  onChange={(e) => setCleanerFee(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="w-full h-9 rounded-md border border-gray-300 pl-3 pr-7 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">€</span>
              </div>
            </div>

            {/* Date override calendar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">
                  Click a date to set a custom price.{' '}
                  <span className="text-amber-600 font-medium">Amber = override</span>
                  {overrideCount > 0 && <> · {overrideCount} override{overrideCount !== 1 ? 's' : ''}</>}
                </p>
                {overrideCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setDatePrices({})}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Month navigation */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={!canGoPrev}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {MONTH_NAMES[calMonth]} {calYear}
                </span>
                <button
                  type="button"
                  onClick={goNext}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-0.5">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="text-center text-[11px] text-gray-400 py-1">{w}</div>
                ))}
              </div>

              {/* Date cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((date, idx) => {
                  if (!date) return <div key={`pad-${idx}`} />

                  const ds = toDateStr(date)
                  const isPast = date < today
                  const hasOverride = datePrices[ds] !== undefined
                  const isEditing = editingDate === ds
                  const effectivePrice = hasOverride
                    ? datePrices[ds]
                    : (pricingMap.get(date.getDay()) ?? 0)

                  return (
                    <div
                      key={ds}
                      onClick={() => !isPast && !isEditing && startCellEdit(date)}
                      className={cn(
                        'relative h-11 flex flex-col items-center justify-center rounded-lg text-xs transition-colors select-none',
                        isPast ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer',
                        isEditing ? 'bg-blue-50 border border-blue-300 z-10' : '',
                        hasOverride && !isEditing ? 'bg-amber-50 border border-amber-300' : '',
                        !isPast && !isEditing && !hasOverride ? 'hover:bg-gray-50 border border-transparent' : '',
                      )}
                    >
                      {isEditing ? (
                        <input
                          ref={cellInputRef}
                          type="number"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={commitCellEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); commitCellEdit() }
                            if (e.key === 'Escape') setEditingDate(null)
                          }}
                          placeholder={String(pricingMap.get(date.getDay()) || 0)}
                          min="0"
                          className="w-full h-full text-center bg-transparent border-none outline-none text-xs font-medium text-blue-700"
                        />
                      ) : (
                        <>
                          <span className={cn(
                            'font-medium leading-none',
                            hasOverride ? 'text-amber-700' : 'text-gray-700',
                          )}>
                            {date.getDate()}
                          </span>
                          {effectivePrice > 0 && (
                            <span className={cn(
                              'text-[10px] leading-none mt-0.5',
                              hasOverride ? 'text-amber-600 font-semibold' : 'text-gray-400',
                            )}>
                              €{effectivePrice}
                            </span>
                          )}
                          {hasOverride && (
                            <button
                              type="button"
                              onClick={(e) => clearOverride(ds, e)}
                              className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 z-20"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={submitting} className="flex-1">
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
