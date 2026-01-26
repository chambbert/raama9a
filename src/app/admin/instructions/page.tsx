'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { Plus, Edit, Trash2, Book } from 'lucide-react'
import type { Instruction } from '@/types'

const defaultCategories = [
  'Appliances',
  'Kitchen',
  'Cleaning',
  'WiFi',
  'Entertainment',
  'Heating',
  'Bathroom',
  'General',
]

export default function InstructionsPage() {
  const [instructions, setInstructions] = useState<Instruction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Instruction | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    content: '',
    order: 0,
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchInstructions = async () => {
    try {
      const res = await fetch('/api/instructions', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setInstructions(data.instructions)
      } else {
        setError('Failed to load instructions')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstructions()
  }, [])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({ category: defaultCategories[0], title: '', content: '', order: 0 })
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (item: Instruction) => {
    setEditingItem(item)
    setFormData({
      category: item.category,
      title: item.title,
      content: item.content,
      order: item.order,
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
        ? `/api/instructions/${editingItem.id}`
        : '/api/instructions'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchInstructions()
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
    if (!confirm('Delete this instruction?')) return

    try {
      const res = await fetch(`/api/instructions/${id}`, { credentials: 'include', method: 'DELETE' })
      if (res.ok) {
        fetchInstructions()
      } else {
        alert('Failed to delete')
      }
    } catch {
      alert('An error occurred')
    }
  }

  // Group by category
  const grouped = instructions.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, Instruction[]>)

  if (loading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructions</h1>
          <p className="text-gray-500">Manage guides for guests</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Instruction
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {instructions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Instructions Yet
              </h3>
              <p className="text-gray-500 mb-4">Add guides for your guests</p>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Add Instruction
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-3 capitalize">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{item.title}</CardTitle>
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
                      <div
                        className="prose prose-sm max-w-none text-gray-600 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
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
        title={editingItem ? 'Edit Instruction' : 'Add Instruction'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

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

          <Input
            id="title"
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Textarea
            id="content"
            label="Content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={6}
            required
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
