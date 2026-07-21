'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { Plus, Edit, Trash2, Book, X, ImageIcon, ChevronUp, ChevronDown } from 'lucide-react'
import Image from 'next/image'
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
    isTutorial: false,
    tutorialOrder: 0,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  // Tutorial carousel images
  const [tutorialImages, setTutorialImages] = useState<{ preview: string; file?: File; existingUrl?: string }[]>([])
  const [removedTutorialUrls, setRemovedTutorialUrls] = useState<string[]>([])
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tutorialImagesRef = useRef<HTMLInputElement>(null)

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

  const moveItem = async (categoryItems: Instruction[], index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= categoryItems.length) return

    const a = categoryItems[index]
    const b = categoryItems[targetIndex]

    const toFormData = (item: Instruction, newOrder: number) => {
      const fd = new FormData()
      fd.append('category', item.category)
      fd.append('title', item.title)
      fd.append('content', item.content)
      fd.append('order', newOrder.toString())
      return fd
    }

    await Promise.all([
      fetch(`/api/instructions/${a.id}`, {
        method: 'PUT',
        body: toFormData(a, b.order),
        credentials: 'include',
      }),
      fetch(`/api/instructions/${b.id}`, {
        method: 'PUT',
        body: toFormData(b, a.order),
        credentials: 'include',
      }),
    ])
    fetchInstructions()
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({ category: defaultCategories[0], title: '', content: '', order: 0, isTutorial: false, tutorialOrder: 0 })
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(false)
    setTutorialImages([])
    setRemovedTutorialUrls([])
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
      isTutorial: item.isTutorial ?? false,
      tutorialOrder: item.tutorialOrder ?? 0,
    })
    setImageFile(null)
    setImagePreview(item.imageUrl || null)
    setRemoveImage(false)
    setTutorialImages(
      (item.imageUrls ?? []).map((url) => ({ preview: url, existingUrl: url }))
    )
    setRemovedTutorialUrls([])
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

  const handleTutorialImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    for (const f of files) {
      if (!allowedTypes.includes(f.type)) { setFormError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF'); return }
      if (f.size > 5 * 1024 * 1024) { setFormError('File size must be less than 5MB'); return }
    }
    setFormError('')
    const newItems = files.map((file) => {
      const preview = URL.createObjectURL(file)
      return { preview, file }
    })
    setTutorialImages((prev) => [...prev, ...newItems])
    if (tutorialImagesRef.current) tutorialImagesRef.current.value = ''
  }

  const handleRemoveTutorialImage = (index: number) => {
    const item = tutorialImages[index]
    if (item.existingUrl) setRemovedTutorialUrls((prev) => [...prev, item.existingUrl!])
    setTutorialImages((prev) => prev.filter((_, i) => i !== index))
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

      const body = new FormData()
      body.append('category', formData.category)
      body.append('title', formData.title)
      body.append('content', formData.content)
      body.append('order', formData.order.toString())
      body.append('isTutorial', formData.isTutorial.toString())
      body.append('tutorialOrder', formData.tutorialOrder.toString())

      if (imageFile) {
        body.append('file', imageFile)
      }

      if (removeImage) {
        body.append('removeImage', 'true')
      }

      for (const item of tutorialImages) {
        if (item.file) body.append('tutorialImages', item.file)
      }

      if (removedTutorialUrls.length > 0) {
        body.append('removeTutorialImages', JSON.stringify(removedTutorialUrls))
      }

      const res = await fetch(url, {
        method,
        body,
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
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-3 capitalize">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryItems.map((item, index) => (
                  <Card key={item.id} className="overflow-hidden">
                    {item.imageUrl && (
                      <div className="relative h-40">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          {item.isTutorial && (
                            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-full">
                              Tutorial #{item.tutorialOrder}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => moveItem(categoryItems, index, 'up')}
                              disabled={index === 0}
                              className="h-6 w-6 flex items-center justify-center hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => moveItem(categoryItems, index, 'down')}
                              disabled={index === categoryItems.length - 1}
                              className="h-6 w-6 flex items-center justify-center hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
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
                      <div className="prose prose-sm max-w-none text-gray-600 line-clamp-3 whitespace-pre-wrap">
                        {item.content}
                      </div>
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
            <input
              type="text"
              list="instruction-categories"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-10 rounded-md border border-gray-300 px-3"
              placeholder="Select or type a category"
              required
            />
            <datalist id="instruction-categories">
              {defaultCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
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

          {/* Tutorial settings */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isTutorial}
                onChange={(e) => setFormData({ ...formData, isTutorial: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Show in tutorial</p>
                <p className="text-xs text-gray-400">New guests will see this as a tutorial step on first login</p>
              </div>
            </label>

            {formData.isTutorial && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tutorial order</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.tutorialOrder}
                    onChange={(e) => setFormData({ ...formData, tutorialOrder: parseInt(e.target.value) || 0 })}
                    className="w-24 h-9 rounded-md border border-gray-300 px-3 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Tutorial images
                    <span className="text-gray-400 font-normal ml-1">— shown as carousel in the tutorial step</span>
                  </label>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {tutorialImages.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-200 group">
                        <Image src={img.preview} alt="" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveTutorialImage(i)}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-5 w-5 text-white" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => tutorialImagesRef.current?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center gap-1 hover:border-gray-400 transition-colors text-gray-400"
                    >
                      <ImageIcon className="h-5 w-5" />
                      <span className="text-xs">Add</span>
                    </button>
                  </div>

                  <input
                    ref={tutorialImagesRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleTutorialImagesChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hero Image (Optional)
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
