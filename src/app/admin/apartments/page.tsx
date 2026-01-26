'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { Plus, Edit, Trash2, Building, MapPin } from 'lucide-react'
import type { Apartment } from '@/types'

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Apartment | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
  })
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

  useEffect(() => {
    fetchApartments()
  }, [])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({ name: '', address: '', description: '' })
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (item: Apartment) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      address: item.address,
      description: item.description || '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      const url = editingItem
        ? `/api/apartments/${editingItem.id}`
        : '/api/apartments'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchApartments()
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
    if (!confirm('Delete this apartment? This will also delete all associated visits and key codes.')) return

    try {
      const res = await fetch(`/api/apartments/${id}`, { credentials: 'include', method: 'DELETE' })
      if (res.ok) {
        fetchApartments()
      } else {
        alert('Failed to delete apartment')
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Apartments Yet
              </h3>
              <p className="text-gray-500 mb-4">Add your first property</p>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Add Apartment
              </Button>
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
                    <button
                      onClick={() => openEditModal(apartment)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(apartment.id)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
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
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {apartment.description}
                  </p>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <Input
            id="name"
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Beach House"
            required
          />

          <Input
            id="address"
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Main St, City"
            required
          />

          <Textarea
            id="description"
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
