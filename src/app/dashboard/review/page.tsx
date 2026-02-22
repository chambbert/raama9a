'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { Star, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ratingDescriptions: Record<number, string> = {
  1: "We're sorry to hear that — we'll do better!",
  2: 'Thanks for the honesty — we appreciate your input',
  3: 'Solid stay! Any tips on how we can improve?',
  4: 'Wonderful — glad you had a great time!',
  5: 'Amazing! You made our day!',
}

export default function ReviewPage() {
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

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (comment.length < 10) {
      setError('Please write at least 10 characters')
      return
    }

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
      <div className="max-w-2xl mx-auto">
        <Card className="animate-scale-in">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Thank You!
              </h2>
              <p className="text-gray-600">
                Your review has been submitted and is pending approval.
                We appreciate your feedback!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leave a Review</h1>
        <p className="text-gray-500">Share your experience with us</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How was your stay?</CardTitle>
          <CardDescription>
            Your feedback helps us improve and helps future guests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <Alert variant="error">{error}</Alert>}

            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = (hoveredRating || rating) >= star
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition-transform duration-200 hover:scale-125"
                    >
                      <Star
                        className={cn(
                          'h-10 w-10 transition-all duration-200',
                          isActive
                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]'
                            : 'text-gray-300'
                        )}
                      />
                    </button>
                  )
                })}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-2 animate-fade-in">
                  {ratingDescriptions[rating]}
                </p>
              )}
            </div>

            <Input
              id="name"
              label="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />

            <Textarea
              id="comment"
              label="Your Review"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={5}
              required
            />

            <Button type="submit" className="w-full" loading={loading}>
              Submit Review
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
