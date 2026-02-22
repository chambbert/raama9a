'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { AnimatedCard } from './animated-card'

interface Instruction {
  id: string
  title: string
  content: string
  category: string
  imageUrl?: string | null
}

interface InstructionAccordionProps {
  categories: string[]
  grouped: Record<string, Instruction[]>
  categoryIcons: Record<string, React.ElementType>
  defaultIcon: React.ElementType
  highlight?: string
}

export function InstructionAccordion({
  categories,
  grouped,
  categoryIcons,
  defaultIcon: DefaultIcon,
  highlight,
}: InstructionAccordionProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(categories.length > 0 ? [categories[0]] : [])
  )

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {categories.map((category, catIndex) => {
        const Icon = categoryIcons[category.toLowerCase()] || DefaultIcon
        const isOpen = openCategories.has(category)
        const instructions = grouped[category]

        return (
          <AnimatedCard key={category} index={catIndex}>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Icon className="h-5 w-5 text-red-500" />
                  </div>
                  <h2 className="text-lg font-semibold capitalize">{category}</h2>
                  <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-2 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                    {instructions.length}
                  </span>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 animate-collapse-open">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {instructions.map((instruction, index) => {
                      const isMatch = highlight
                        ? instruction.title.toLowerCase().includes(highlight.toLowerCase()) ||
                          instruction.content.toLowerCase().includes(highlight.toLowerCase())
                        : false
                      return (
                        <AnimatedCard key={instruction.id} index={index}>
                          <Card
                            id={instruction.id}
                            className={`overflow-hidden${isMatch ? ' ring-2 ring-yellow-400 bg-yellow-50' : ''}`}
                          >
                            {instruction.imageUrl && (
                              <div className="relative h-40">
                                <Image
                                  src={instruction.imageUrl}
                                  alt={instruction.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <CardHeader>
                              <CardTitle className="text-lg">{instruction.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div
                                className="prose prose-sm max-w-none text-gray-600"
                                dangerouslySetInnerHTML={{ __html: instruction.content }}
                              />
                            </CardContent>
                          </Card>
                        </AnimatedCard>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </AnimatedCard>
        )
      })}
    </div>
  )
}
