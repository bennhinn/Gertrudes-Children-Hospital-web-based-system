// hooks/useHelpContent.ts
'use client'

import { useState, useEffect } from 'react'

interface HelpItem {
  id: number
  title: string
  icon: string
  description: string
  display_order: number
}

interface UseHelpContentResult {
  items: HelpItem[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useHelpContent(section?: string): UseHelpContentResult {
  const [items, setItems] = useState<HelpItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = section 
        ? `/api/help?section=${section}`
        : '/api/help'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setItems(data.data)
      } else {
        setError(data.error || 'Failed to fetch content')
      }
    } catch (err) {
      setError('An error occurred while fetching content')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContent()
  }, [section])

  return {
    items,
    loading,
    error,
    refetch: fetchContent
  }
}