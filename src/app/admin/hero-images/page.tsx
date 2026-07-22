'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { Plus, Trash2, Upload, Image as ImageIcon, ChevronUp, ChevronDown } from 'lucide-react'
import type { HeroImage } from '@/types'

export default function HeroImagesPage() {
  const [images, setImages] = useState<HeroImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [title, setTitle] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchImages = async () => {
    try {
      const res = await fetch('/api/hero-images', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setImages(data.heroImages)
      } else {
        setError('Failed to load images')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= images.length) return

    const a = images[index]
    const b = images[targetIndex]

    await Promise.all([
      fetch(`/api/hero-images/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: b.order }),
        credentials: 'include',
      }),
      fetch(`/api/hero-images/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: a.order }),
        credentials: 'include',
      }),
    ])
    fetchImages()
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]

    if (!file) {
      setUploadError('Please select a file')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('order', images.length.toString())

      const res = await fetch('/api/hero-images', {
        credentials: 'include',
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        setIsModalOpen(false)
        setTitle('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        fetchImages()
      } else {
        const data = await res.json()
        setUploadError(data.error || 'Failed to upload image')
      }
    } catch {
      setUploadError('An error occurred')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const res = await fetch(`/api/hero-images/${id}`, { credentials: 'include', method: 'DELETE' })
      if (res.ok) {
        fetchImages()
      } else {
        alert('Failed to delete image')
      }
    } catch {
      alert('An error occurred')
    }
  }

  const toggleActive = async (image: HeroImage) => {
    try {
      await fetch(`/api/hero-images/${image.id}`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !image.active }),
      })
      fetchImages()
    } catch {
      alert('Failed to update image')
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Images</h1>
          <p className="text-gray-500">Manage landing page carousel images</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Image
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {images.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Images Yet</h3>
              <p className="text-gray-500 mb-4">Upload hero images for your landing page</p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <Card key={image.id} className={`overflow-hidden ${!image.active ? 'opacity-50' : ''}`}>
              <div className="relative h-48">
                {image.mediaType === 'VIDEO' ? (
                  <video src={image.mediaUrl} muted className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <Image
                    src={image.mediaUrl}
                    alt={image.title || `Hero image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  #{index + 1}
                </div>
                {image.mediaType === 'VIDEO' && (
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    ▶ Video
                  </div>
                )}
                {!image.active && (
                  <div className="absolute top-2 right-14 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    Hidden
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="h-6 w-6 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === images.length - 1}
                    className="h-6 w-6 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{image.title || 'Untitled'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(image)}
                    >
                      {image.active ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Hero Image or Video"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          {uploadError && <Alert variant="error">{uploadError}</Alert>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image or Video File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Images: max 5MB (JPEG, PNG, WebP, GIF). Videos: max 50MB (MP4, WebM, MOV)
            </p>
          </div>

          <Input
            id="title"
            label="Title (Optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Welcome to Our Apartment"
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
            <Button type="submit" loading={uploading} className="flex-1">
              Upload
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
