'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <AnimatedCard index={index}>
      <Card
        id={id}
        className={`overflow-hidden${isHighlighted ? ' ring-2 ring-yellow-400 bg-yellow-50' : ''}`}
      >
        <div className="h-2 bg-red-500" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Key className="h-5 w-5 text-red-500" />
              </div>
              <CardTitle className="text-lg">{description}</CardTitle>
            </div>
            <button
              onClick={() => setIsRevealed(!isRevealed)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={isRevealed ? 'Hide code' : 'Reveal code'}
            >
              {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <button
            onClick={handleCopy}
            className={`w-full bg-gray-50 rounded-lg p-4 text-center cursor-pointer transition-all hover:bg-gray-100 relative group ${copied ? 'animate-copy-pulse' : ''}`}
            aria-label="Copy code to clipboard"
          >
            <p className={`text-3xl font-mono font-bold tracking-wider text-gray-900 ${isRevealed ? 'code-revealed' : 'code-blurred'}`}>
              {code}
            </p>
            <div className={`absolute inset-0 flex items-center justify-center rounded-lg transition-opacity duration-200 ${copied ? 'opacity-100 bg-green-50' : 'opacity-0 group-hover:opacity-100 bg-gray-100/60'}`}>
              {copied ? (
                <span className="flex items-center gap-2 text-green-600 font-medium">
                  <Check className="h-5 w-5" />
                  Copied
                </span>
              ) : (
                <span className="flex items-center gap-2 text-gray-500 text-sm">
                  <Copy className="h-4 w-4" />
                  Click to copy
                </span>
              )}
            </div>
          </button>
          {apartmentName && (
            <p className="text-sm text-gray-500 mt-3">
              For: {apartmentName}
            </p>
          )}
        </CardContent>
      </Card>
    </AnimatedCard>
  )
}
