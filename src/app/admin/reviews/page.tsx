'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { Check, X, Trash2, Star, MessageSquare, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Review } from '@/types'

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')

  // Add review modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' })
  const [addError, setAddError] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews?all=true', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews)
      } else {
        setError('Failed to load reviews')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews/${id}`, { credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })
      if (res.ok) {
        fetchReviews()
      }
    } catch {
      alert('Failed to approve review')
    }
  }

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews/${id}`, { credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false }),
      })
      if (res.ok) {
        fetchReviews()
      }
    } catch {
      alert('Failed to reject review')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return

    try {
      const res = await fetch(`/api/reviews/${id}`, { credentials: 'include', method: 'DELETE' })
      if (res.ok) {
        fetchReviews()
      }
    } catch {
      alert('Failed to delete review')
    }
  }

  const openAddModal = () => {
    setNewReview({ name: '', rating: 5, comment: '' })
    setAddError('')
    setIsAddModalOpen(true)
  }

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    setAddSubmitting(true)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newReview.name,
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      })

      if (res.ok) {
        fetchReviews()
        setIsAddModalOpen(false)
      } else {
        const data = await res.json()
        setAddError(data.error || 'Failed to add review')
      }
    } catch {
      setAddError('An error occurred')
    } finally {
      setAddSubmitting(false)
    }
  }

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'pending') return !review.approved
    if (filter === 'approved') return review.approved
    return true
  })

  const pendingCount = reviews.filter((r) => !r.approved).length

  if (loading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-500">Moderate guest reviews</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
              {pendingCount} pending
            </span>
          )}
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Review
          </Button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Reviews
              </h3>
              <p className="text-gray-500">
                {filter === 'pending'
                  ? 'No reviews pending approval'
                  : filter === 'approved'
                  ? 'No approved reviews yet'
                  : 'No reviews submitted yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card
              key={review.id}
              className={!review.approved ? 'border-yellow-200 bg-yellow-50/50' : ''}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{review.name}</CardTitle>
                      {!review.approved && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-500 ml-2">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!review.approved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(review.id)}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    {review.approved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(review.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Unpublish
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(review.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {review.imageUrl && (
                  <div className="relative w-40 h-28 mb-3">
                    <Image src={review.imageUrl} alt="" fill className="object-cover rounded-md" />
                  </div>
                )}
                <p className="text-gray-600">{review.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Review Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Review"
      >
        <form onSubmit={handleAddReview} className="space-y-4">
          {addError && <Alert variant="error">{addError}</Alert>}

          <Input
            id="review-name"
            label="Name"
            value={newReview.name}
            onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= newReview.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700">
              Comment
            </label>
            <textarea
              id="review-comment"
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              required
              rows={4}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={addSubmitting} className="flex-1">
              Add Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
