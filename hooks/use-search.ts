'use client'

/**
 * useSearch Hook
 * Core hook for managing search state and operations
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { 
  SearchConfig, 
  SearchState, 
  SearchResult,
  SearchResults,
  SearchEvents 
} from 'types/search.types'
import { 
  searchItems, 
  applyFilters, 
  sortItems,
  calculateSearchStats,
  debounce 
} from 'utils/search.utils'

interface UseSearchOptions<T> {
  /** Search configuration */
  config: SearchConfig<T>
  
  /** Data to search through */
  data: T[]
  
  /** Event handlers */
  events?: SearchEvents<T>
  
  /** Initial search query */
  initialQuery?: string
  
  /** Initial filters */
  initialFilters?: Record<string, any>
  
  /** Enable URL state persistence */
  persistToUrl?: boolean
  
  /** Enable localStorage persistence */
  persistToStorage?: boolean
  
  /** Storage key for persistence */
  storageKey?: string
}

interface UseSearchReturn<T> {
  // State
  state: SearchState
  results: SearchResults<T>
  
  // Actions
  setQuery: (query: string) => void
  setFilter: (filterId: string, value: any) => void
  setFilters: (filters: Record<string, any>) => void
  clearFilter: (filterId: string) => void
  clearAllFilters: () => void
  setSort: (field: string, direction: 'asc' | 'desc') => void
  toggleFiltersExpanded: () => void
  reset: () => void
  
  // Computed
  hasActiveFilters: boolean
  hasQuery: boolean
  isEmpty: boolean
  stats: {
    total: number
    filtered: number
    displayed: number
    filteredOut: number
  }
}

export function useSearch<T = any>(
  options: UseSearchOptions<T>
): UseSearchReturn<T> {
  const { config, data, events, initialQuery = '', initialFilters = {} } = options
  
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [state, setState] = useState<SearchState>({
    query: initialQuery,
    filters: initialFilters,
    sort: config.defaultSort,
    filtersExpanded: false,
    isLoading: false,
    error: undefined
  })
  
  // ============================================================================
  // SEARCH & FILTER LOGIC
  // ============================================================================
  
  const results = useMemo(() => {
    const startTime = performance.now()
    
    try {
      // Step 1: Apply text search
      let rawSearchResults: SearchResult<T>[] = []
      
      if (state.query && state.query.length >= (config.minSearchLength || 0)) {
        rawSearchResults = searchItems(data, state.query, config)
      } else {
        // No search query - return all items with 0 score
        rawSearchResults = data.map(item => ({
          item,
          score: 0,
          matchedFields: []
        }))
      }
      
      // Step 2: Apply filters
      const filteredResults = applyFilters(
        rawSearchResults.map(r => r.item),
        state.filters,
        config.filters || []
      )
      
      // Reconstruct search results for filtered items
      const filteredSearchResults = rawSearchResults.filter(r => 
        filteredResults.includes(r.item)
      )
      
      // Step 3: Apply sorting
      let sortedResults = filteredSearchResults
      if (state.sort) {
        const sorted = sortItems(
          filteredSearchResults.map(r => r.item),
          state.sort.field,
          state.sort.direction
        )
        
        // Maintain SearchResult structure after sorting
        sortedResults = sorted.map(item => {
          const result = filteredSearchResults.find(r => r.item === item)!
          return result
        })
      } else if (state.query) {
        // If no explicit sort, sort by relevance score
        sortedResults = [...filteredSearchResults].sort((a, b) => b.score - a.score)
      }
      
      const executionTime = performance.now() - startTime
      
      const finalSearchResults: SearchResults<T> = {
        results: sortedResults,
        total: sortedResults.length,
        filteredCount: data.length - sortedResults.length,
        metadata: {
          query: state.query,
          filters: state.filters,
          executionTime,
          hasMore: false
        }
      }
      
      return finalSearchResults
    } catch (error) {
      console.error('Search error:', error)
      setState(prev => ({ ...prev, error: 'Search failed' }))
      
      return {
        results: [],
        total: 0,
        filteredCount: 0,
        metadata: {
          query: state.query,
          filters: state.filters,
          executionTime: 0,
          hasMore: false
        }
      }
    }
  }, [data, state.query, state.filters, state.sort, config])
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  // Notify parent component of results changes
  useEffect(() => {
    events?.onResultsChange?.(results)
  }, [results, events])
  
  // Debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      events?.onSearch?.(query)
    }, config.debounceMs || 300),
    [config.debounceMs, events]
  )
  
  // ============================================================================
  // ACTIONS
  // ============================================================================
  
  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }))
    debouncedSearch(query)
  }, [debouncedSearch])
  
  const setFilter = useCallback((filterId: string, value: any) => {
    setState(prev => {
      const newFilters = { ...prev.filters, [filterId]: value }
      events?.onFilterChange?.(newFilters)
      return { ...prev, filters: newFilters }
    })
  }, [events])
  
  const setFilters = useCallback((filters: Record<string, any>) => {
    setState(prev => ({ ...prev, filters }))
    events?.onFilterChange?.(filters)
  }, [events])
  
  const clearFilter = useCallback((filterId: string) => {
    setState(prev => {
      const newFilters = { ...prev.filters }
      delete newFilters[filterId]
      events?.onFilterChange?.(newFilters)
      return { ...prev, filters: newFilters }
    })
  }, [events])
  
  const clearAllFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: {} }))
    events?.onFilterChange?.({})
  }, [events])
  
  const setSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    const sort = { field, direction }
    setState(prev => ({ ...prev, sort }))
    events?.onSortChange?.(sort)
  }, [events])
  
  const toggleFiltersExpanded = useCallback(() => {
    setState(prev => ({ ...prev, filtersExpanded: !prev.filtersExpanded }))
  }, [])
  
  const reset = useCallback(() => {
    setState({
      query: '',
      filters: {},
      sort: config.defaultSort,
      filtersExpanded: false,
      isLoading: false,
      error: undefined
    })
    events?.onClear?.()
  }, [config.defaultSort, events])
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const hasActiveFilters = useMemo(() => {
    return Object.keys(state.filters).some(key => {
      const value = state.filters[key]
      return value !== null && value !== undefined && value !== ''
    })
  }, [state.filters])
  
  const hasQuery = useMemo(() => {
    return state.query.trim().length > 0
  }, [state.query])
  
  const isEmpty = useMemo(() => {
    return results.results.length === 0
  }, [results])
  
  const stats = useMemo(() => {
    return calculateSearchStats(
      data.length,
      results.results.length,
      results.results
    )
  }, [data.length, results])
  
  // ============================================================================
  // PERSISTENCE
  // ============================================================================
  
  // Persist to localStorage
  useEffect(() => {
    if (options.persistToStorage && options.storageKey) {
      const stateToSave = {
        query: state.query,
        filters: state.filters,
        sort: state.sort
      }
      localStorage.setItem(options.storageKey, JSON.stringify(stateToSave))
    }
  }, [state.query, state.filters, state.sort, options.persistToStorage, options.storageKey])
  
  // Load from localStorage on mount
  useEffect(() => {
    if (options.persistToStorage && options.storageKey) {
      const saved = localStorage.getItem(options.storageKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setState(prev => ({
            ...prev,
            query: parsed.query || '',
            filters: parsed.filters || {},
            sort: parsed.sort || config.defaultSort
          }))
        } catch (error) {
          console.error('Failed to load saved search state:', error)
        }
      }
    }
  }, []) // Only run on mount
  
  // Persist to URL (optional)
  useEffect(() => {
    if (options.persistToUrl && typeof window !== 'undefined') {
      const params = new URLSearchParams()
      
      if (state.query) {
        params.set('q', state.query)
      }
      
      if (hasActiveFilters) {
        params.set('filters', JSON.stringify(state.filters))
      }
      
      if (state.sort) {
        params.set('sort', `${state.sort.field}:${state.sort.direction}`)
      }
      
      const newUrl = params.toString() 
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname
        
      window.history.replaceState({}, '', newUrl)
    }
  }, [state.query, state.filters, state.sort, hasActiveFilters, options.persistToUrl])
  
  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    state,
    results,
    setQuery,
    setFilter,
    setFilters,
    clearFilter,
    clearAllFilters,
    setSort,
    toggleFiltersExpanded,
    reset,
    hasActiveFilters,
    hasQuery,
    isEmpty,
    stats
  }
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook for search history management
 */
export function useSearchHistory(maxItems: number = 10) {
  const [history, setHistory] = useState<string[]>([])
  
  useEffect(() => {
    const saved = localStorage.getItem('search-history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load search history:', error)
      }
    }
  }, [])
  
  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return
    
    setHistory(prev => {
      const updated = [query, ...prev.filter(q => q !== query)].slice(0, maxItems)
      localStorage.setItem('search-history', JSON.stringify(updated))
      return updated
    })
  }, [maxItems])
  
  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem('search-history')
  }, [])
  
  return { history, addToHistory, clearHistory }
}