'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export interface TutorialStep {
  id: string
  title: string
  content: string
  imageUrl: string | null
  imageUrls: string[] | null
  tutorialOrder: number
}

interface TutorialOverlayProps {
  steps: TutorialStep[]
  isOpen: boolean
  initialStep?: number
  onClose: () => void
  onComplete?: () => void
}

function StepImages({ step }: { step: TutorialStep }) {
  const images = step.imageUrls && step.imageUrls.length > 0
    ? step.imageUrls
    : step.imageUrl
    ? [step.imageUrl]
    : []

  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => setImgIndex(0), [step.id])

  if (images.length === 0) return <div className="h-1.5 bg-sky-600 w-full" />

  return (
    <div className="relative h-56 w-full bg-stone-100 group">
      <Image src={images[imgIndex]} alt={step.title} fill className="object-cover" />

      {images.length > 1 && (
        <>
          <button
            onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setImgIndex((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === imgIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function TutorialOverlay({
  steps,
  isOpen,
  initialStep = 0,
  onClose,
  onComplete,
}: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)

  useEffect(() => {
    if (isOpen) setCurrentStep(initialStep)
  }, [initialStep, isOpen])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen || steps.length === 0) return null

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1
  const isFirst = currentStep === 0

  const handleNext = () => {
    if (isLast) {
      onComplete?.()
      onClose()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleSkip = () => {
    onComplete?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleSkip} />

      <div className="relative z-10 w-full max-w-lg bg-white shadow-2xl overflow-hidden">
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 z-20 flex items-center gap-1 px-3 py-1.5 text-xs tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors"
        >
          Skip <X className="h-3 w-3" />
        </button>

        <StepImages step={step} />

        <div className="p-8 pt-6">
          <p className="text-xs tracking-widest uppercase text-sky-600 mb-3">
            Step {currentStep + 1} of {steps.length}
          </p>

          <h2 className="font-serif-display text-2xl font-light text-stone-800 tracking-wide mb-4">
            {step.title}
          </h2>

          <p className="text-sm text-stone-500 leading-relaxed whitespace-pre-wrap min-h-[4rem]">
            {step.content}
          </p>

          <div className="flex justify-center gap-2 mt-8 mb-6">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-sky-600' : 'w-1.5 bg-stone-200 hover:bg-stone-300'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!isFirst && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-300 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm bg-stone-900 text-white hover:bg-stone-800 transition-colors"
            >
              {isLast ? 'Done' : (
                <>Next <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
