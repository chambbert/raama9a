'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Loader2, Book, MapPin, Key } from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  id: string
  type: 'instruction' | 'sightseeing' | 'keycode'
  title: string
  snippet: string
  category: string
  href: string
}

const typeConfig = {
  instruction: { label: 'Instructions', icon: Book },
  sightseeing: { label: 'Sightseeing', icon: MapPin },
  keycode: { label: 'Key Codes', icon: Key },
} as const

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) { setResults([]); setIsOpen(false); setIsLoading(false); return }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) { const data = await res.json(); setResults(data.results); setIsOpen(true) }
    } catch { setResults([]) }
    finally { setIsLoading(false) }
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) { setResults([]); setIsOpen(false); setIsLoading(false); return }
    setIsLoading(true)
    debounceRef.current = setTimeout(() => fetchResults(value.trim()), 300)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const grouped = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = []
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search instructions, places, key codes…"
          className="w-full pl-10 pr-10 py-3 bg-white border border-stone-100 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-sky-300 transition-colors"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300 animate-spin" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-100 shadow-lg max-h-80 overflow-y-auto">
          {results.length === 0 && !isLoading ? (
            <div className="px-4 py-4 text-xs text-stone-400 tracking-wide">No results found</div>
          ) : (
            Object.entries(grouped).map(([type, items]) => {
              const config = typeConfig[type as keyof typeof typeConfig]
              const Icon = config.icon
              return (
                <div key={type}>
                  <div className="px-4 py-2 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
                    <Icon className="h-3 w-3 text-sky-600" />
                    <span className="text-xs tracking-widest uppercase text-stone-400">{config.label}</span>
                  </div>
                  {items.map((result) => (
                    <Link
                      key={result.id}
                      href={result.href}
                      onClick={() => { setIsOpen(false); setQuery('') }}
                      className="block px-4 py-3 hover:bg-stone-50 border-b border-stone-50 last:border-b-0"
                    >
                      <p className="text-sm text-stone-700">{result.title}</p>
                      <p className="text-xs text-stone-400 truncate mt-0.5">{result.snippet}</p>
                    </Link>
                  ))}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
