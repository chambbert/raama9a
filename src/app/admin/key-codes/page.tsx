'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { Plus, Edit, Trash2, Key } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { KeyCode, Apartment } from '@/types'

type KeyCodeWithApartment = KeyCode & { apartment: Apartment }

export default function KeyCodesPage() {
  const [keyCodes, setKeyCodes] = useState<KeyCodeWithApartment[]>([])
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KeyCodeWithApartment | null>(null)
  const [formData, setFormData] = useState({
    apartmentId: '',
    code: '',
    description: '',
    validFrom: '',
    validTo: '',
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const [keyCodesRes, apartmentsRes] = await Promise.all([
        fetch('/api/key-codes', { credentials: 'include' }),
        fetch('/api/apartments', { credentials: 'include' }),
      ])

      if (keyCodesRes.ok) {
        const data = await keyCodesRes.json()
        setKeyCodes(data.keyCodes)
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
      apartmentId: apartments[0]?.id || '',
      code: '',
      description: '',
      validFrom: '',
      validTo: '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (item: KeyCodeWithApartment) => {
    setEditingItem(item)
    setFormData({
      apartmentId: item.apartmentId,
      code: item.code,
      description: item.description,
      validFrom: item.validFrom ? new Date(item.validFrom).toISOString().split('T')[0] : '',
      validTo: item.validTo ? new Date(item.validTo).toISOString().split('T')[0] : '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      const url = editingItem ? `/api/key-codes/${editingItem.id}` : '/api/key-codes'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          validFrom: formData.validFrom || null,
          validTo: formData.validTo || null,
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
    if (!confirm('Delete this key code?')) return

    try {
      const res = await fetch(`/api/key-codes/${id}`, { credentials: 'include', method: 'DELETE' })
      if (res.ok) {
        fetchData()
      } else {
        alert('Failed to delete key code')
      }
    } catch {
      alert('An error occurred')
    }
  }

  if (loading) return <LoadingScreen />

  // Group by apartment
  const grouped = keyCodes.reduce((acc, code) => {
    const aptName = code.apartment?.name || 'Unknown'
    if (!acc[aptName]) acc[aptName] = []
    acc[aptName].push(code)
    return acc
  }, {} as Record<string, KeyCodeWithApartment[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Key Codes</h1>
          <p className="text-gray-500">Manage access codes for apartments</p>
        </div>
        <Button onClick={openCreateModal} disabled={!apartments.length}>
          <Plus className="h-4 w-4 mr-2" />
          Add Key Code
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {!apartments.length && (
        <Alert variant="warning">
          Add an apartment first before creating key codes.
        </Alert>
      )}

      {keyCodes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Key Codes Yet
              </h3>
              <p className="text-gray-500">Add access codes for your apartments</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([apartmentName, codes]) => (
            <div key={apartmentName}>
              <h2 className="text-lg font-semibold mb-3">{apartmentName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {codes.map((code) => (
                  <Card key={code.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Key className="h-5 w-5 text-blue-500" />
                          </div>
                          <CardTitle className="text-lg">{code.description}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditModal(code)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(code.id)}
                            className="p-2 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 rounded-lg p-3 text-center mb-3">
                        <p className="text-2xl font-mono font-bold tracking-wider">
                          {code.code}
                        </p>
                      </div>
                      {(code.validFrom || code.validTo) && (
                        <p className="text-xs text-gray-500">
                          Valid: {code.validFrom ? formatDate(code.validFrom) : 'Always'}
                          {' - '}
                          {code.validTo ? formatDate(code.validTo) : 'No expiry'}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Key Code' : 'Add Key Code'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

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

          <Input
            id="code"
            label="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., 1234"
            required
          />

          <Input
            id="description"
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., Front Door"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="validFrom"
              type="date"
              label="Valid From (Optional)"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
            />
            <Input
              id="validTo"
              type="date"
              label="Valid To (Optional)"
              value={formData.validTo}
              onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
            />
          </div>

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
