'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HeroImage } from '@/types'

interface HeroCarouselProps {
  images: HeroImage[]
  siteName: string
}

export function HeroCarousel({ images, siteName }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [images.length])

  const goToPrevious = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % images.length)

  if (images.length === 0) {
    return (
      <section className="relative h-[70vh] md:h-screen bg-stone-100 flex items-center justify-center pt-16">
        <div className="text-center px-4">
          <p className="text-xs tracking-widest uppercase text-stone-400 mb-4">Pärnu · Estonia</p>
          <h1 className="font-serif-display text-5xl md:text-7xl font-light text-stone-800 tracking-wide mb-4">
            {siteName}
          </h1>
          <p className="text-sm tracking-widest uppercase text-stone-400">Riverside Apartment</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative h-[70vh] md:h-screen overflow-hidden pt-16">
      {images.map((image, index) => (
        <div
          key={image.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-1500',
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          )}
        >
          {image.mediaType === 'VIDEO' ? (
            <video
              src={image.mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image
              src={image.mediaUrl}
              alt={image.title || 'Rääma 9a – Riverside Apartment Pärnu'}
              fill
              className="object-cover"
              priority={index === 0}
            />
          )}
          <div className="absolute inset-0 bg-black/25" />
        </div>
      ))}

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <p className="text-xs tracking-widest uppercase text-white/70 mb-6">Pärnu · Estonia</p>
          <h1 className="font-serif-display text-5xl md:text-8xl font-light tracking-wide drop-shadow-sm mb-4">
            Rääma 9a-8
          </h1>
          <div className="w-12 h-px bg-white/50 mx-auto mb-4" />
          <p className="text-xs tracking-widest uppercase text-white/70">
            Riverside Apartment
          </p>
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'w-1 h-1 rounded-full transition-all duration-300',
                  index === currentIndex ? 'bg-white w-6' : 'bg-white/40'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
