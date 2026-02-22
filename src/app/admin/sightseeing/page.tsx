'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { Plus, Edit, Trash2, MapPin, X, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import type { Sightseeing } from '@/types'

const defaultCategories = [
  'Restaurants',
  'Attractions',
  'Nature',
  'Shopping',
  'Nightlife',
  'Parks',
  'Museums',
  'Other',
]

export default function SightseeingPage() {
  const [items, setItems] = useState<Sightseeing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Sightseeing | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    category: '',
    order: 0,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/sightseeing', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setItems(data.sightseeing)
      } else {
        setError('Failed to load items')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      address: '',
      category: defaultCategories[0],
      order: 0,
    })
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(false)
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (item: Sightseeing) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      address: item.address || '',
      category: item.category,
      order: item.order,
    })
    setImageFile(null)
    setImagePreview(item.imageUrl || null)
    setRemoveImage(false)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setFormError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('File size must be less than 5MB')
      return
    }

    setImageFile(file)
    setRemoveImage(false)
    setFormError('')

    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      const url = editingItem
        ? `/api/sightseeing/${editingItem.id}`
        : '/api/sightseeing'
      const method = editingItem ? 'PUT' : 'POST'

      const body = new FormData()
      body.append('name', formData.name)
      body.append('description', formData.description)
      body.append('address', formData.address)
      body.append('category', formData.category)
      body.append('order', formData.order.toString())

      if (imageFile) {
        body.append('file', imageFile)
      }

      if (removeImage) {
        body.append('removeImage', 'true')
      }

      const res = await fetch(url, {
        method,
        body,
        credentials: 'include',
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchItems()
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
    if (!confirm('Delete this item?')) return

    try {
      const res = await fetch(`/api/sightseeing/${id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        fetchItems()
      } else {
        alert('Failed to delete')
      }
    } catch {
      alert('An error occurred')
    }
  }

  // Group by category
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, Sightseeing[]>)

  if (loading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sightseeing</h1>
          <p className="text-gray-500">Manage local recommendations</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Place
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {items.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Places Yet
              </h3>
              <p className="text-gray-500 mb-4">Add local recommendations</p>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Add Place
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-3 capitalize">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    {item.imageUrl && (
                      <div className="relative h-32">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.description}
                      </p>
                      {item.address && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {item.address}
                        </div>
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
        title={editingItem ? 'Edit Place' : 'Add Place'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <Input
            id="name"
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-10 rounded-md border border-gray-300 px-3"
              required
            >
              {defaultCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <Textarea
            id="description"
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            required
          />

          <Input
            id="address"
            label="Address (Optional)"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image (Optional)
            </label>

            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <div className="relative h-40">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Click to upload an image</p>
                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP or GIF (max 5MB)</p>
                  </div>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
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
