'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeCategory === null
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() =>
              setActiveCategory(activeCategory === category ? null : category)
            }
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
              activeCategory === category
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item, index) => {
          const isMatch = highlight
            ? item.name.toLowerCase().includes(highlight.toLowerCase()) ||
              item.description.toLowerCase().includes(highlight.toLowerCase()) ||
              (item.address?.toLowerCase().includes(highlight.toLowerCase()) ?? false)
            : false
          return (
            <AnimatedCard key={item.id} index={index}>
              <Card
                id={item.id}
                className={`overflow-hidden h-full${isMatch ? ' ring-2 ring-yellow-400 bg-yellow-50' : ''}`}
              >
                {item.imageUrl && (
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-3">
                    {item.description}
                  </p>
                  {item.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{item.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </AnimatedCard>
          )
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No places found in this category.
        </div>
      )}
    </div>
  )
}
