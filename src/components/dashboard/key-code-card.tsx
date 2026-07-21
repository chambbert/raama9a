'use client'

import { useState } from 'react'
import { Key, Eye, EyeOff, Check, Copy } from 'lucide-react'
import { AnimatedCard } from './animated-card'

interface KeyCodeCardProps {
  id: string
  description: string
  code: string
  apartmentName?: string
  isHighlighted?: boolean
  index: number
}

export function KeyCodeCard({ id, description, code, apartmentName, isHighlighted, index }: KeyCodeCardProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const el = document.createElement('textarea')
      el.value = code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatedCard index={index}>
      <div
        id={id}
        className={`border p-6 backdrop-blur-sm ${isHighlighted ? 'border-amber-300 bg-amber-50/80' : 'bg-white/80 border-stone-100'}`}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Key className="h-4 w-4 text-sky-600" />
            <p className="text-sm font-medium text-stone-700">{description}</p>
          </div>
          <button
            onClick={() => setIsRevealed(!isRevealed)}
            className="text-stone-300 hover:text-stone-600 transition-colors p-1"
            aria-label={isRevealed ? 'Hide code' : 'Reveal code'}
          >
            {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <button
          onClick={handleCopy}
          className="w-full bg-stone-50 border border-stone-100 hover:border-sky-200 hover:bg-sky-50 transition-colors p-5 text-center relative group"
          aria-label="Copy code to clipboard"
        >
          <p className={`text-3xl font-mono font-bold tracking-[0.25em] text-stone-800 ${isRevealed ? 'code-revealed' : 'code-blurred'}`}>
            {code}
          </p>
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${copied ? 'opacity-100 bg-sky-50' : 'opacity-0 group-hover:opacity-100 bg-stone-50/80'}`}>
            {copied ? (
              <span className="flex items-center gap-2 text-sky-600 text-sm">
                <Check className="h-4 w-4" /> Copied
              </span>
            ) : (
              <span className="flex items-center gap-2 text-stone-400 text-xs">
                <Copy className="h-3.5 w-3.5" /> Tap to copy
              </span>
            )}
          </div>
        </button>

        {apartmentName && (
          <p className="text-xs text-stone-400 mt-3">{apartmentName}</p>
        )}
      </div>
    </AnimatedCard>
  )
}
