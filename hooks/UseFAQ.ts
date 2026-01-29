// hooks/useFAQ.ts
'use client'

import { useState, useEffect } from 'react'

interface FAQItem {
  id: number
  question: string
  answer: string
  tags: string[]
  views_count: number
  helpful_count: number
  display_order: number
  category_id: number
  category_title: string
  category_icon: string
}

interface UseFAQOptions {
  categoryId?: number
  search?: string
  popular?: boolean
  limit?: number
}

interface UseFAQResult {
  items: FAQItem[]
  loading: boolean
  error: string | null
  refetch: () => void
  searchFAQ: (query: string) => Promise<void>
  markHelpful: (id: number, helpful: boolean, feedback?: string) => Promise<void>
}

export function useFAQ(options: UseFAQOptions = {}): UseFAQResult {
  const [items, setItems] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFAQ = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (options.categoryId) params.append('category_id', options.categoryId.toString())
      if (options.search) params.append('search', options.search)
      if (options.popular) params.append('popular', 'true')
      if (options.limit) params.append('limit', options.limit.toString())
      
      const url = `/api/faq?${params.toString()}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setItems(data.data)
      } else {
        setError(data.error || 'Failed to fetch FAQ items')
      }
    } catch (err) {
      setError('An error occurred while fetching FAQ items')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const searchFAQ = async (query: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/faq/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setItems(data.data)
      } else {
        setError(data.error || 'Failed to search FAQs')
      }
    } catch (err) {
      setError('An error occurred while searching')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const markHelpful = async (id: number, helpful: boolean, feedback?: string) => {
    try {
      const response = await fetch(`/api/faq/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful, feedback_text: feedback })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        console.error('Failed to submit feedback')
      }
    } catch (err) {
      console.error('Error submitting feedback:', err)
    }
  }

  useEffect(() => {
    fetchFAQ()
  }, [options.categoryId, options.search, options.popular, options.limit])

  return {
    items,
    loading,
    error,
    refetch: fetchFAQ,
    searchFAQ,
    markHelpful
  }
}