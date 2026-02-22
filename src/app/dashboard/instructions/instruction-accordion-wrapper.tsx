'use client'

import {
  WashingMachine,
  Utensils,
  Sparkles,
  Wifi,
  Tv,
  Thermometer,
  ShowerHead,
  Coffee,
  Book,
} from 'lucide-react'
import { InstructionAccordion } from '@/components/dashboard/instruction-accordion'

const categoryIcons: Record<string, React.ElementType> = {
  appliances: WashingMachine,
  kitchen: Utensils,
  cleaning: Sparkles,
  wifi: Wifi,
  entertainment: Tv,
  heating: Thermometer,
  bathroom: ShowerHead,
  coffee: Coffee,
}

interface Props {
  categories: string[]
  grouped: Record<string, { id: string; title: string; content: string; category: string; imageUrl?: string | null }[]>
  highlight?: string
}

export function InstructionAccordionWrapper({ categories, grouped, highlight }: Props) {
  return (
    <InstructionAccordion
      categories={categories}
      grouped={grouped}
      categoryIcons={categoryIcons}
      defaultIcon={Book}
      highlight={highlight}
    />
  )
}
