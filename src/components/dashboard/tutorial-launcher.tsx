'use client'

import { useState, useEffect } from 'react'
import { TutorialOverlay, type TutorialStep } from './tutorial-overlay'

interface TutorialLauncherProps {
  steps: TutorialStep[]
  autoShow: boolean
}

export function TutorialLauncher({ steps, autoShow }: TutorialLauncherProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (autoShow && steps.length > 0) {
      const timer = setTimeout(() => setIsOpen(true), 600)
      return () => clearTimeout(timer)
    }
  }, [autoShow, steps.length])

  const handleComplete = async () => {
    await fetch('/api/tutorial', { method: 'POST', credentials: 'include' })
  }

  if (steps.length === 0) return null

  return (
    <TutorialOverlay
      steps={steps}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onComplete={handleComplete}
    />
  )
}
