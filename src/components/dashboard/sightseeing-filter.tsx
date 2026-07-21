'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import Image from 'next/image'
import { AnimatedCard } from './animated-card'

interface SightseeingItem {
  id: string
  name: string
  description: string
  category: string
  address?: string | null
  imageUrl?: string | null
}

interface SightseeingFilterProps {
  categories: string[]
  allItems: SightseeingItem[]
  highlight?: string
}

export function SightseeingFilter({ categories, allItems, highlight }: SightseeingFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredItems = activeCategory
    ? allItems.filter((item) => item.category === activeCategory)
    : allItems

  return (
    <div className="space-y-6">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-1.5 text-xs tracking-widest uppercase transition-colors border ${
            activeCategory === null
              ? 'bg-stone-900 text-white border-stone-900'
              : 'border-stone-200 text-stone-500 hover:border-stone-400'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(activeCategory === category ? null : category)}
            className={`px-4 py-1.5 text-xs tracking-widest uppercase capitalize transition-colors border ${
              activeCategory === category
                ? 'bg-stone-900 text-white border-stone-900'
                : 'border-stone-200 text-stone-500 hover:border-stone-400'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item, index) => {
          const isMatch = highlight
            ? item.name.toLowerCase().includes(highlight.toLowerCase()) ||
              item.description.toLowerCase().includes(highlight.toLowerCase()) ||
              (item.address?.toLowerCase().includes(highlight.toLowerCase()) ?? false)
            : false
          return (
            <AnimatedCard key={item.id} index={index}>
              <div
                id={item.id}
                className={`backdrop-blur-sm border overflow-hidden h-full ${isMatch ? 'border-amber-300 bg-amber-50/80' : 'bg-white/80 border-stone-100'}`}
              >
                {item.imageUrl && (
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-sm font-medium text-stone-800 mb-2">{item.name}</p>
                  <p className="text-xs text-stone-500 leading-relaxed mb-3">{item.description}</p>
                  {item.address && (
                    <div className="flex items-start gap-1.5 text-xs text-stone-400">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      <span>{item.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </AnimatedCard>
          )
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xs tracking-widest uppercase text-stone-400">No places in this category</p>
        </div>
      )}
    </div>
  )
}
