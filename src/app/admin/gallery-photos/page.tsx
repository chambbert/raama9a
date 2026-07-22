'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { Plus, Trash2, Upload, Images, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GalleryPhoto } from '@/types'

export default function GalleryPhotosPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [caption, setCaption] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragFrom = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const fetchPhotos = async () => {
    try {
      const res = await fetch('/api/gallery-photos', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setPhotos(data.galleryPhotos)
      } else {
        setError('Failed to load photos')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
  }, [])

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= photos.length) return

    const a = photos[index]
    const b = photos[targetIndex]

    await Promise.all([
      fetch(`/api/gallery-photos/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: b.order }),
        credentials: 'include',
      }),
      fetch(`/api/gallery-photos/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: a.order }),
        credentials: 'include',
      }),
    ])
    fetchPhotos()
  }

  const handleDrop = async (to: number) => {
    const from = dragFrom.current
    dragFrom.current = null
    setDragOver(null)
    if (from === null || from === to) return

    const reordered = [...photos]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    setPhotos(reordered)

    try {
      await Promise.all(
        reordered.map((p, i) =>
          p.order === i
            ? null
            : fetch(`/api/gallery-photos/${p.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order: i }),
                credentials: 'include',
              })
        )
      )
    } catch (err) {
      console.error('[gallery-photos] reorder failed', err)
    }
    fetchPhotos()
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const files = fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : []

    if (files.length === 0) {
      setUploadError('Please select a file')
      return
    }

    setUploading(true)
    setUploadError('')

    const failures: string[] = []
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData()
      formData.append('file', files[i])
      formData.append('caption', caption)
      formData.append('order', (photos.length + i).toString())

      try {
        const res = await fetch('/api/gallery-photos', {
          credentials: 'include',
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          const data = await res.json()
          failures.push(`${files[i].name}: ${data.error || 'upload failed'}`)
        }
      } catch {
        failures.push(`${files[i].name}: upload failed`)
      }
    }

    if (failures.length === 0) {
      setIsModalOpen(false)
      setCaption('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } else {
      setUploadError(failures.join('; '))
    }
    fetchPhotos()
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      const res = await fetch(`/api/gallery-photos/${id}`, { credentials: 'include', method: 'DELETE' })
      if (res.ok) {
        fetchPhotos()
      } else {
        alert('Failed to delete photo')
      }
    } catch {
      alert('An error occurred')
    }
  }

  const toggleActive = async (photo: GalleryPhoto) => {
    try {
      await fetch(`/api/gallery-photos/${photo.id}`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !photo.active }),
      })
      fetchPhotos()
    } catch {
      alert('Failed to update photo')
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery Photos</h1>
          <p className="text-gray-500">Photos guests can browse in the landing page gallery</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Photo
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {photos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Images className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Photos Yet</h3>
              <p className="text-gray-500 mb-4">Upload photos for guests to browse</p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => {
                dragFrom.current = index
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(index)
              }}
              onDragLeave={() => setDragOver((d) => (d === index ? null : d))}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => {
                dragFrom.current = null
                setDragOver(null)
              }}
              className={cn(
                'cursor-grab active:cursor-grabbing rounded-lg',
                dragOver === index && 'ring-2 ring-red-400'
              )}
            >
            <Card className={`overflow-hidden ${!photo.active ? 'opacity-50' : ''}`}>
              <div className="relative h-48">
                <Image
                  src={photo.imageUrl}
                  alt={photo.caption || `Gallery photo ${index + 1}`}
                  fill
                  draggable={false}
                  className="object-cover"
                />
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  #{index + 1}
                </div>
                {!photo.active && (
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
                    disabled={index === photos.length - 1}
                    className="h-6 w-6 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{photo.caption || 'Untitled'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(photo)}
                    >
                      {photo.active ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(photo.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Gallery Photos"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          {uploadError && <Alert variant="error">{uploadError}</Alert>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Files
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
              multiple
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Select one or more. Max 5MB each (larger images are auto-resized). Supported: JPEG, PNG, WebP, GIF, HEIC
            </p>
          </div>

          <Input
            id="caption"
            label="Caption (Optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g., Living room view (applied to all selected photos)"
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
