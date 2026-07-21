'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/components/providers/auth-provider'
import { Alert } from '@/components/ui/alert'
import { Star, CheckCircle, Calendar, ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

interface Visit {
  id: string
  checkIn: string
  checkOut: string | null
  apartment: { name: string }
}

interface ReviewFormProps {
  visits: Visit[]
}

const ratingDescriptions: Record<number, string> = {
  1: "We're sorry to hear that — we'll do better.",
  2: 'Thanks for the honesty — we appreciate your input.',
  3: 'Solid stay! Any tips on how we can improve?',
  4: 'Wonderful — glad you had a great time!',
  5: 'Amazing! You made our day!',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ReviewForm({ visits }: ReviewFormProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [name, setName] = useState(user?.name || '')
  const [comment, setComment] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('File size must be less than 5MB')
      return
    }

    setError('')
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (rating === 0) { setError('Please select a rating'); return }
    if (comment.length < 10) { setError('Please write at least 10 characters'); return }
    setLoading(true)
    try {
      const body = new FormData()
      body.append('name', name)
      body.append('rating', rating.toString())
      body.append('comment', comment)
      if (imageFile) body.append('file', imageFile)

      const res = await fetch('/api/reviews', {
        method: 'POST',
        body,
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit review')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg">
        <div className="bg-white/80 backdrop-blur-sm border border-stone-100 p-12 text-center">
          <CheckCircle className="h-10 w-10 text-sky-600 mx-auto mb-5" />
          <h2 className="font-serif-display text-2xl font-light text-stone-800 mb-2">Thank you</h2>
          <p className="text-sm text-stone-400">
            Your review has been submitted and is pending approval.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <p className="text-xs tracking-widest uppercase text-sky-600 mb-1">Share your experience</p>
        <h1 className="font-serif-display text-3xl font-light text-stone-800 tracking-wide">
          Leave a Review
        </h1>
      </div>

      {/* Visit history */}
      {visits.length > 0 && (
        <div className="space-y-2">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="flex items-start gap-3 bg-white/80 backdrop-blur-sm border border-stone-100 px-5 py-4"
            >
              <Calendar className="h-4 w-4 text-sky-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-stone-700">{visit.apartment.name}</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {formatDate(visit.checkIn)}
                  {visit.checkOut && ` – ${formatDate(visit.checkOut)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-sm border border-stone-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Stars */}
          <div>
            <p className="text-xs tracking-widest uppercase text-stone-400 mb-4">Rating</p>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hoveredRating || rating) >= star
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        'h-8 w-8 transition-colors',
                        isActive ? 'text-amber-400 fill-amber-400' : 'text-stone-200'
                      )}
                    />
                  </button>
                )
              })}
            </div>
            {rating > 0 && (
              <p className="text-xs text-stone-500 mt-2 animate-fade-in">
                {ratingDescriptions[rating]}
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-xs tracking-widest uppercase text-stone-400 mb-2">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              className="w-full border-0 border-b border-stone-200 focus:border-sky-600 focus:outline-none py-2 text-sm text-stone-800 placeholder:text-stone-300 bg-transparent transition-colors"
            />
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-xs tracking-widest uppercase text-stone-400 mb-2">
              Your Review
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={5}
              placeholder="Tell us about your experience..."
              className="w-full border-0 border-b border-stone-200 focus:border-sky-600 focus:outline-none py-2 text-sm text-stone-800 placeholder:text-stone-300 bg-transparent transition-colors resize-none"
            />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-xs tracking-widest uppercase text-stone-400 mb-2">
              Add a Photo (Optional)
            </label>
            {imagePreview ? (
              <div className="relative w-32 h-32">
                <Image src={imagePreview} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-stone-900 text-white rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-xs tracking-wider uppercase text-stone-500 border border-dashed border-stone-300 px-4 py-3 hover:border-sky-600 hover:text-sky-600 transition-colors"
              >
                <ImagePlus className="h-4 w-4" />
                Upload Photo
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xs tracking-widest uppercase bg-stone-900 text-white hover:bg-sky-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  )
}
