'use client'

import Image from 'next/image'
import { Star } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Review } from '@/types'

interface ReviewsSectionProps {
  reviews: Review[]
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  if (reviews.length === 0) return null

  return (
    <section className="py-24 bg-stone-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-widest uppercase text-sky-600 mb-3">Guest experiences</p>
          <h2 className="font-serif-display text-4xl md:text-5xl font-light text-stone-800 tracking-wide">
            Reviews
          </h2>
          <div className="w-8 h-px bg-stone-300 mx-auto mt-5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-stone-100 p-8 flex flex-col"
            >
              {review.imageUrl && (
                <div className="relative w-full h-40 mb-5 -mt-2">
                  <Image src={review.imageUrl} alt={`Photo from ${review.name}`} fill className="object-cover" />
                </div>
              )}
              <div className="flex items-center gap-0.5 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < review.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-stone-200 fill-stone-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-stone-600 text-sm leading-relaxed italic flex-1 mb-6">
                &ldquo;{review.comment}&rdquo;
              </p>
              <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                <span className="text-xs tracking-wider uppercase text-stone-800 font-medium">
                  {review.name}
                </span>
                <span className="text-xs text-stone-400">{formatDate(review.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
