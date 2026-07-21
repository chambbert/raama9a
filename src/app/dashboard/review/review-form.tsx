'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { Alert } from '@/components/ui/alert'
import { Star, CheckCircle, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (rating === 0) { setError('Please select a rating'); return }
    if (comment.length < 10) { setError('Please write at least 10 characters'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rating, comment }),
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
