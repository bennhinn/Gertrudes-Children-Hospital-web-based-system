// components/faq-search.tsx
'use client'

import { useState, useEffect, useRef } from 'react'

interface FAQSearchProps {
  onSearch: (query: string) => void
}

export default function FAQSearch({ onSearch }: FAQSearchProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Common search terms for suggestions
  const commonSearches = [
    'how to book appointment',
    'insurance accepted',
    'emergency care',
    'visiting hours',
    'vaccine schedule',
    'lab test results',
    'payment methods',
    'parking information',
    'registration documents',
    'online portal access'
  ]

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Update suggestions based on query
    if (query.trim().length > 2) {
      const filtered = commonSearches.filter(search =>
        search.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    onSearch(searchQuery)
    setShowSuggestions(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  return (
    <div ref={searchRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length > 2 && setShowSuggestions(true)}
            placeholder="Search for answers... (e.g., 'how to book', 'insurance')"
            className="w-full rounded-lg border-2 border-white/20 bg-white/10 px-6 py-4 pr-12 text-white placeholder-blue-200 backdrop-blur-sm transition-colors focus:border-white/40 focus:bg-white/20 focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </form>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-lg bg-white shadow-lg">
          <ul className="max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  onClick={() => handleSearch(suggestion)}
                  className="w-full px-4 py-3 text-left text-slate-700 transition-colors hover:bg-blue-50"
                >
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>{suggestion}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Popular Searches */}
      {!query && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-blue-200">Popular searches:</p>
          <div className="flex flex-wrap gap-2">
            {commonSearches.slice(0, 5).map((search, index) => (
              <button
                key={index}
                onClick={() => handleSearch(search)}
                className="rounded-full bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}