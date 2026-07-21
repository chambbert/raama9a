'use client'

import { useState } from 'react'
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
import { TutorialOverlay, type TutorialStep } from '@/components/dashboard/tutorial-overlay'

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

interface Instruction {
  id: string
  title: string
  content: string
  category: string
  imageUrl?: string | null
  isTutorial?: boolean
}

interface Props {
  categories: string[]
  grouped: Record<string, Instruction[]>
  highlight?: string
  tutorialSteps: TutorialStep[]
}

export function InstructionAccordionWrapper({ categories, grouped, highlight, tutorialSteps }: Props) {
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [tutorialInitialStep, setTutorialInitialStep] = useState(0)

  const handlePlayTutorial = (instructionId: string) => {
    const stepIndex = tutorialSteps.findIndex((s) => s.id === instructionId)
    setTutorialInitialStep(stepIndex >= 0 ? stepIndex : 0)
    setTutorialOpen(true)
  }

  return (
    <>
      <InstructionAccordion
        categories={categories}
        grouped={grouped}
        categoryIcons={categoryIcons}
        defaultIcon={Book}
        highlight={highlight}
        onPlayTutorial={tutorialSteps.length > 0 ? handlePlayTutorial : undefined}
      />
      <TutorialOverlay
        steps={tutorialSteps}
        isOpen={tutorialOpen}
        initialStep={tutorialInitialStep}
        onClose={() => setTutorialOpen(false)}
      />
    </>
  )
}
