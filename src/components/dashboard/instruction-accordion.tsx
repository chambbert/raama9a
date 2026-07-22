'use client'

import { useState } from 'react'
import { ChevronDown, PlayCircle, X } from 'lucide-react'
import Image from 'next/image'
import { AnimatedCard } from './animated-card'

interface Instruction {
  id: string
  title: string
  content: string
  category: string
  imageUrl?: string | null
  isTutorial?: boolean
}

interface InstructionAccordionProps {
  categories: string[]
  grouped: Record<string, Instruction[]>
  categoryIcons: Record<string, React.ElementType>
  defaultIcon: React.ElementType
  highlight?: string
  onPlayTutorial?: (instructionId: string) => void
}

export function InstructionAccordion({
  categories,
  grouped,
  categoryIcons,
  defaultIcon: DefaultIcon,
  highlight,
  onPlayTutorial,
}: InstructionAccordionProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(categories.length > 0 ? [categories[0]] : [])
  )
  const [zoomedImage, setZoomedImage] = useState<{ url: string; alt: string } | null>(null)

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      next.has(category) ? next.delete(category) : next.add(category)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {categories.map((category, catIndex) => {
        const Icon = categoryIcons[category.toLowerCase()] || DefaultIcon
        const isOpen = openCategories.has(category)
        const instructions = grouped[category]

        return (
          <AnimatedCard key={category} index={catIndex}>
            <div className="border border-stone-100 bg-white/80 backdrop-blur-sm overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center justify-between w-full px-5 py-4 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-sky-600 flex-shrink-0" />
                  <span className="text-xs tracking-widest uppercase text-stone-700 capitalize">
                    {category}
                  </span>
                  <span className="text-xs text-stone-400">({instructions.length})</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-stone-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-stone-50 animate-collapse-open">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {instructions.map((instruction, index) => {
                      const isMatch = highlight
                        ? instruction.title.toLowerCase().includes(highlight.toLowerCase()) ||
                          instruction.content.toLowerCase().includes(highlight.toLowerCase())
                        : false
                      return (
                        <AnimatedCard key={instruction.id} index={index}>
                          <div
                            id={instruction.id}
                            onClick={instruction.isTutorial && onPlayTutorial ? () => onPlayTutorial(instruction.id) : undefined}
                            className={`border overflow-hidden backdrop-blur-sm transition-colors ${
                              instruction.isTutorial && onPlayTutorial
                                ? 'cursor-pointer hover:border-sky-300 hover:bg-sky-50/50'
                                : ''
                            } ${isMatch ? 'border-amber-300 bg-amber-50/80' : 'border-stone-100 bg-white/80'}`}
                          >
                            {instruction.imageUrl && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setZoomedImage({ url: instruction.imageUrl!, alt: instruction.title })
                                }}
                                className="relative block w-full h-40 cursor-zoom-in"
                                aria-label={`View ${instruction.title} image full size`}
                              >
                                <Image
                                  src={instruction.imageUrl}
                                  alt={instruction.title}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                  className="object-cover"
                                />
                              </button>
                            )}
                            <div className="p-5">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-sm font-medium text-stone-800">{instruction.title}</p>
                                {instruction.isTutorial && onPlayTutorial && (
                                  <PlayCircle className="h-5 w-5 flex-shrink-0 text-sky-400" />
                                )}
                              </div>
                              <div className="text-sm text-stone-500 leading-relaxed whitespace-pre-wrap">
                                {instruction.content}
                              </div>
                            </div>
                          </div>
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

      {zoomedImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 z-10 p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-7 w-7" />
          </button>
          <div className="relative w-full h-[85vh] mx-4">
            <Image
              src={zoomedImage.url}
              alt={zoomedImage.alt}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
