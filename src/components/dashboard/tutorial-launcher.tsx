'use client'

import { useState, useEffect } from 'react'
import { PlayCircle } from 'lucide-react'
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
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs tracking-widest uppercase text-sky-600 hover:text-sky-700 border border-sky-200 hover:border-sky-300 transition-colors"
      >
        <PlayCircle className="h-3.5 w-3.5" />
        Rewatch tutorial
      </button>
      <TutorialOverlay
        steps={steps}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onComplete={handleComplete}
      />
    </>
  )
}
