'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { GalleryPhoto } from '@/types'

interface GallerySectionProps {
  photos: GalleryPhoto[]
}

export function GallerySection({ photos }: GallerySectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  if (photos.length === 0) return null

  const showPrevious = () => setOpenIndex((prev) => (prev === null ? null : (prev - 1 + photos.length) % photos.length))
  const showNext = () => setOpenIndex((prev) => (prev === null ? null : (prev + 1) % photos.length))

  return (
    <section className="py-24 bg-stone-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-widest uppercase text-sky-600 mb-3">Browse the space</p>
          <h2 className="font-serif-display text-4xl md:text-5xl font-light text-stone-800 tracking-wide">
            Gallery
          </h2>
          <div className="w-8 h-px bg-stone-300 mx-auto mt-5" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setOpenIndex(index)}
              className="relative aspect-square overflow-hidden group"
            >
              <Image
                src={photo.imageUrl}
                alt={photo.caption || `Gallery photo ${index + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
          onClick={() => setOpenIndex(null)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current
            touchStartX.current = null
            if (start === null) return
            const dx = e.changedTouches[0].clientX - start
            if (Math.abs(dx) > 50) {
              if (dx > 0) showPrevious()
              else showNext()
            }
          }}
        >
          <button
            onClick={() => setOpenIndex(null)}
            className="absolute top-6 right-6 z-10 p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-7 w-7" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); showPrevious() }}
                className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-10 p-3 text-white/70 hover:text-white transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); showNext() }}
                className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-10 p-3 text-white/70 hover:text-white transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <div
            className="relative w-full max-w-4xl h-[70vh] mx-6"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[openIndex].imageUrl}
              alt={photos[openIndex].caption || `Gallery photo ${openIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>

          {photos[openIndex].caption && (
            <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-sm tracking-wide">
              {photos[openIndex].caption}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
