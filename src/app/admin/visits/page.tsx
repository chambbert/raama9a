'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { Plus, Edit, Trash2, Calendar, X } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Visit, User, Apartment } from '@/types'

type LineItem = {
  id?: string
  type: 'revenue' | 'cost'
  description: string
  amount: number
}

type VisitWithRelations = Visit & {
  user: Pick<User, 'id' | 'name' | 'email'>
  apartment: Apartment
  lineItems?: LineItem[]
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<VisitWithRelations[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<VisitWithRelations | null>(null)
  const [formData, setFormData] = useState({
    userId: '',
    apartmentId: '',
    checkIn: '',
    checkOut: '',
    notes: '',
  })
  const [revenueItems, setRevenueItems] = useState<LineItem[]>([])
  const [costItems, setCostItems] = useState<LineItem[]>([])
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const [visitsRes, usersRes, apartmentsRes] = await Promise.all([
        fetch('/api/visits', { credentials: 'include' }),
        fetch('/api/users', { credentials: 'include' }),
        fetch('/api/apartments', { credentials: 'include' }),
      ])

      if (visitsRes.ok) {
        const data = await visitsRes.json()
        setVisits(data.visits)
      }
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users.filter((u: User) => u.role === 'CLIENT'))
      }
      if (apartmentsRes.ok) {
        const data = await apartmentsRes.json()
        setApartments(data.apartments)
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({
      userId: users[0]?.id || '',
      apartmentId: apartments[0]?.id || '',
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: '',
      notes: '',
    })
    setRevenueItems([{ type: 'revenue', description: '', amount: 0 }])
    setCostItems([{ type: 'cost', description: '', amount: 0 }])
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (item: VisitWithRelations) => {
    setEditingItem(item)
    setFormData({
      userId: item.userId,
      apartmentId: item.apartmentId,
      checkIn: new Date(item.checkIn).toISOString().split('T')[0],
      checkOut: item.checkOut ? new Date(item.checkOut).toISOString().split('T')[0] : '',
      notes: item.notes || '',
    })

    const revenues = item.lineItems?.filter(li => li.type === 'revenue') || []
    const costs = item.lineItems?.filter(li => li.type === 'cost') || []

    setRevenueItems(revenues.length > 0 ? revenues : [{ type: 'revenue', description: '', amount: 0 }])
    setCostItems(costs.length > 0 ? costs : [{ type: 'cost', description: '', amount: 0 }])
    setFormError('')
    setIsModalOpen(true)
  }

  const addRevenueItem = () => {
    setRevenueItems([...revenueItems, { type: 'revenue', description: '', amount: 0 }])
  }

  const addCostItem = () => {
    setCostItems([...costItems, { type: 'cost', description: '', amount: 0 }])
  }

  const updateRevenueItem = (index: number, field: 'description' | 'amount', value: string | number) => {
    const updated = [...revenueItems]
    updated[index] = { ...updated[index], [field]: value }
    setRevenueItems(updated)
  }

  const updateCostItem = (index: number, field: 'description' | 'amount', value: string | number) => {
    const updated = [...costItems]
    updated[index] = { ...updated[index], [field]: value }
    setCostItems(updated)
  }

  const removeRevenueItem = (index: number) => {
    if (revenueItems.length > 1) {
      setRevenueItems(revenueItems.filter((_, i) => i !== index))
    }
  }

  const removeCostItem = (index: number) => {
    if (costItems.length > 1) {
      setCostItems(costItems.filter((_, i) => i !== index))
    }
  }

  const totalRevenue = revenueItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const totalCosts = costItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      const url = editingItem ? `/api/visits/${editingItem.id}` : '/api/visits'
      const method = editingItem ? 'PUT' : 'POST'

      // Filter out empty line items
      const validRevenueItems = revenueItems.filter(item => item.description && item.amount > 0)
      const validCostItems = costItems.filter(item => item.description && item.amount > 0)

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          checkOut: formData.checkOut || null,
          revenue: totalRevenue,
          costs: totalCosts,
          lineItems: [...validRevenueItems, ...validCostItems],
        }),
        credentials: 'include',
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchData()
      } else {
        const data = await res.json()
        setFormError(data.error || 'Failed to save')
      }
    } catch {
      setFormError('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this visit?')) return

    try {
      const res = await fetch(`/api/visits/${id}`, { credentials: 'include', method: 'DELETE' })
      if (res.ok) {
        fetchData()
      } else {
        alert('Failed to delete visit')
      }
    } catch {
      alert('An error occurred')
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visits</h1>
          <p className="text-gray-500">Track guest stays and financials</p>
        </div>
        <Button onClick={openCreateModal} disabled={!users.length || !apartments.length}>
          <Plus className="h-4 w-4 mr-2" />
          Add Visit
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {!apartments.length && (
        <Alert variant="warning">
          Add an apartment first before creating visits.
        </Alert>
      )}

      {!users.length && (
        <Alert variant="warning">
          Add a client user first before creating visits.
        </Alert>
      )}

      {visits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Visits Yet
              </h3>
              <p className="text-gray-500">Track guest stays here</p>
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check In</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check Out</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Costs</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Profit</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((visit) => {
                    const profit = visit.revenue - visit.costs
                    return (
                      <tr key={visit.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium">{visit.user.name}</p>
                          <p className="text-xs text-gray-500">{visit.user.email}</p>
                        </td>
                        <td className="py-3 px-4">{visit.apartment.name}</td>
                        <td className="py-3 px-4">{formatDate(visit.checkIn)}</td>
                        <td className="py-3 px-4">
                          {visit.checkOut ? formatDate(visit.checkOut) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600">
                          {formatCurrency(visit.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">
                          {formatCurrency(visit.costs)}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(profit)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => openEditModal(visit)}
                              className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit className="h-4 w-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleDelete(visit.id)}
                              className="p-2 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Visit' : 'Add Visit'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          {formError && <Alert variant="error">{formError}</Alert>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guest</label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full h-10 rounded-md border border-gray-300 px-3"
              required
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apartment</label>
            <select
              value={formData.apartmentId}
              onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
              className="w-full h-10 rounded-md border border-gray-300 px-3"
              required
            >
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.id}>{apt.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="checkIn"
              type="date"
              label="Check In"
              value={formData.checkIn}
              onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
              required
            />
            <Input
              id="checkOut"
              type="date"
              label="Check Out (Optional)"
              value={formData.checkOut}
              onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
            />
          </div>

          {/* Revenue Items */}
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-green-800">Revenue Items</h3>
              <Button type="button" variant="outline" onClick={addRevenueItem} className="h-8 text-sm">
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {revenueItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Description (e.g., Booking)"
                    value={item.description}
                    onChange={(e) => updateRevenueItem(index, 'description', e.target.value)}
                    className="flex-1 h-9 rounded-md border border-gray-300 px-3 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={item.amount || ''}
                    onChange={(e) => updateRevenueItem(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-24 h-9 rounded-md border border-gray-300 px-3 text-sm"
                    min="0"
                    step="0.01"
                  />
                  <button
                    type="button"
                    onClick={() => removeRevenueItem(index)}
                    className="p-2 hover:bg-red-100 rounded-lg"
                    disabled={revenueItems.length === 1}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 text-right text-sm font-medium text-green-700">
              Total: {formatCurrency(totalRevenue)}
            </div>
          </div>

          {/* Cost Items */}
          <div className="border rounded-lg p-4 bg-red-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-red-800">Cost Items</h3>
              <Button type="button" variant="outline" onClick={addCostItem} className="h-8 text-sm">
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {costItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Description (e.g., Cleaning)"
                    value={item.description}
                    onChange={(e) => updateCostItem(index, 'description', e.target.value)}
                    className="flex-1 h-9 rounded-md border border-gray-300 px-3 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={item.amount || ''}
                    onChange={(e) => updateCostItem(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-24 h-9 rounded-md border border-gray-300 px-3 text-sm"
                    min="0"
                    step="0.01"
                  />
                  <button
                    type="button"
                    onClick={() => removeCostItem(index)}
                    className="p-2 hover:bg-red-100 rounded-lg"
                    disabled={costItems.length === 1}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 text-right text-sm font-medium text-red-700">
              Total: {formatCurrency(totalCosts)}
            </div>
          </div>

          {/* Profit Summary */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="font-medium">Net Profit</span>
              <span className={`text-lg font-bold ${totalRevenue - totalCosts >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(totalRevenue - totalCosts)}
              </span>
            </div>
          </div>

          <Textarea
            id="notes"
            label="Notes (Optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
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
