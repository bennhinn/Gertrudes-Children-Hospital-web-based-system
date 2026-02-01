/**
 * Search Utility Functions
 * Core utilities for searching, filtering, sorting, and highlighting
 */

import type { SearchableField, Filter, SearchResult, SearchConfig } from '../types/search.types'

// ============================================================================
// NESTED OBJECT ACCESS
// ============================================================================

/**
 * Get value from nested object using dot notation
 * Example: getNestedValue({ user: { name: 'John' } }, 'user.name') => 'John'
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined
  
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current === null || current === undefined) return undefined
    
    // Handle array notation (e.g., 'items[0].name')
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/)
    if (arrayMatch) {
      current = current[arrayMatch[1]]?.[parseInt(arrayMatch[2])]
    } else {
      current = current[key]
    }
  }
  
  return current
}

/**
 * Set value in nested object using dot notation
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  
  let current = obj
  for (const key of keys) {
    if (!(key in current)) {
      current[key] = {}
    }
    current = current[key]
  }
  
  current[lastKey] = value
}

// ============================================================================
// TEXT SEARCH
// ============================================================================

/**
 * Normalize text for searching (lowercase, trim, remove special chars)
 */
export function normalizeText(text: string, caseSensitive = false): string {
  if (!text) return ''
  
  let normalized = String(text).trim()
  
  if (!caseSensitive) {
    normalized = normalized.toLowerCase()
  }
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ')
  
  return normalized
}

/**
 * Check if a string matches a query
 */
export function matchesQuery(
  text: string,
  query: string,
  options: {
    caseSensitive?: boolean
    fuzzy?: boolean
    exact?: boolean
  } = {}
): boolean {
  if (!text || !query) return false
  
  const normalizedText = normalizeText(text, options.caseSensitive)
  const normalizedQuery = normalizeText(query, options.caseSensitive)
  
  if (options.exact) {
    return normalizedText === normalizedQuery
  }
  
  if (options.fuzzy) {
    return fuzzyMatch(normalizedText, normalizedQuery)
  }
  
  return normalizedText.includes(normalizedQuery)
}

/**
 * Fuzzy matching algorithm
 * Returns true if query letters appear in order in text
 */
export function fuzzyMatch(text: string, query: string): boolean {
  const textNorm = normalizeText(text)
  const queryNorm = normalizeText(query)
  
  let queryIndex = 0
  let textIndex = 0
  
  while (queryIndex < queryNorm.length && textIndex < textNorm.length) {
    if (queryNorm[queryIndex] === textNorm[textIndex]) {
      queryIndex++
    }
    textIndex++
  }
  
  return queryIndex === queryNorm.length
}

/**
 * Calculate relevance score for a match (0-100)
 */
export function calculateRelevanceScore(
  text: string,
  query: string,
  weight: number = 1
): number {
  if (!text || !query) return 0
  
  const textNorm = normalizeText(text)
  const queryNorm = normalizeText(query)
  
  let score = 0
  
  // Exact match (highest score)
  if (textNorm === queryNorm) {
    score = 100
  }
  // Starts with query (high score)
  else if (textNorm.startsWith(queryNorm)) {
    score = 80
  }
  // Contains whole query (medium score)
  else if (textNorm.includes(queryNorm)) {
    // Closer to start = higher score
    const position = textNorm.indexOf(queryNorm)
    const positionScore = Math.max(0, 70 - (position / textNorm.length) * 20)
    score = positionScore
  }
  // Fuzzy match (lower score)
  else if (fuzzyMatch(textNorm, queryNorm)) {
    score = 40
  }
  // Partial word matches
  else {
    const queryWords = queryNorm.split(' ')
    const matchCount = queryWords.filter(word => textNorm.includes(word)).length
    score = (matchCount / queryWords.length) * 30
  }
  
  // Apply field weight
  return Math.min(100, score * weight)
}

// ============================================================================
// SEARCH ENGINE
// ============================================================================

/**
 * Search through items using configuration
 */
export function searchItems<T>(
  items: T[],
  query: string,
  config: SearchConfig<T>
): SearchResult<T>[] {
  if (!query || query.length < (config.minSearchLength || 0)) {
    return items.map(item => ({
      item,
      score: 0,
      matchedFields: []
    }))
  }
  
  const results: SearchResult<T>[] = []
  
  for (const item of items) {
    let totalScore = 0
    const matchedFields: string[] = []
    const highlights: Record<string, string> = {}
    
    // Search each configured field
    for (const field of config.searchableFields) {
      const value = getNestedValue(item, field.key)
      
      if (value === null || value === undefined) continue
      
      // Handle arrays (e.g., search in prescriptions array)
      if (Array.isArray(value)) {
        for (const arrayItem of value) {
          if (typeof arrayItem === 'object') {
            // Search in object properties
            for (const key in arrayItem) {
              const subValue = arrayItem[key]
              if (matchesSearchValue(subValue, query, config)) {
                const score = calculateRelevanceScore(
                  String(subValue),
                  query,
                  field.weight || 1
                )
                totalScore += score
                matchedFields.push(`${field.key}.${key}`)
              }
            }
          } else if (matchesSearchValue(arrayItem, query, config)) {
            const score = calculateRelevanceScore(
              String(arrayItem),
              query,
              field.weight || 1
            )
            totalScore += score
            matchedFields.push(field.key)
          }
        }
      }
      // Handle regular values
      else if (matchesSearchValue(value, query, config)) {
        const score = calculateRelevanceScore(
          String(value),
          query,
          field.weight || 1
        )
        totalScore += score
        matchedFields.push(field.key)
        
        // Generate highlight if enabled
        if (config.highlightMatches) {
          highlights[field.key] = highlightText(String(value), query)
        }
      }
      
      // Use custom matcher if provided
      if (field.customMatcher && field.customMatcher(value, query)) {
        totalScore += (field.weight || 1) * 50
        matchedFields.push(field.key)
      }
    }
    
    // Only include items with matches
    if (matchedFields.length > 0) {
      results.push({
        item,
        score: Math.min(100, totalScore),
        matchedFields,
        highlights: Object.keys(highlights).length > 0 ? highlights : undefined
      })
    }
  }
  
  // Sort by relevance score
  results.sort((a, b) => b.score - a.score)
  
  // Apply max results limit
  if (config.maxResults) {
    return results.slice(0, config.maxResults)
  }
  
  return results
}

/**
 * Helper to check if a value matches the search query
 */
function matchesSearchValue(
  value: any,
  query: string,
  config: SearchConfig
): boolean {
  if (value === null || value === undefined) return false
  
  return matchesQuery(String(value), query, {
    caseSensitive: config.caseSensitive,
    fuzzy: config.fuzzySearch
  })
}

// ============================================================================
// FILTERING
// ============================================================================

/**
 * Apply filters to items
 */
export function applyFilters<T>(
  items: T[],
  filters: Record<string, any>,
  filterConfigs: Filter[]
): T[] {
  if (!filters || Object.keys(filters).length === 0) {
    return items
  }
  
  return items.filter(item => {
    for (const [filterId, filterValue] of Object.entries(filters)) {
      // Skip empty/null filters
      if (filterValue === null || filterValue === undefined || filterValue === '') {
        continue
      }
      
      const filterConfig = filterConfigs.find(f => f.id === filterId)
      if (!filterConfig) continue
      
      // Use custom filter function if provided
      if (filterConfig.customFilter) {
        if (!filterConfig.customFilter(item, filterValue)) {
          return false
        }
        continue
      }
      
      // Apply filter based on type
      const itemValue = getNestedValue(item, filterConfig.field)
      
      if (!matchesFilter(itemValue, filterValue, filterConfig.type)) {
        return false
      }
    }
    
    return true
  })
}

/**
 * Check if a value matches a filter
 */
function matchesFilter(itemValue: any, filterValue: any, filterType: string): boolean {
  if (itemValue === null || itemValue === undefined) return false
  
  switch (filterType) {
    case 'select':
      return String(itemValue) === String(filterValue)
    
    case 'multiselect':
      return Array.isArray(filterValue) 
        ? filterValue.includes(itemValue)
        : String(itemValue) === String(filterValue)
    
    case 'boolean':
      return Boolean(itemValue) === Boolean(filterValue)
    
    case 'number':
      return Number(itemValue) === Number(filterValue)
    
    case 'range':
      const num = Number(itemValue)
      return num >= filterValue.min && num <= filterValue.max
    
    case 'date':
      const itemDate = new Date(itemValue).getTime()
      const filterDate = new Date(filterValue).getTime()
      return itemDate === filterDate
    
    case 'daterange':
      const date = new Date(itemValue).getTime()
      const start = filterValue.start ? new Date(filterValue.start).getTime() : -Infinity
      const end = filterValue.end ? new Date(filterValue.end).getTime() : Infinity
      return date >= start && date <= end
    
    default:
      return true
  }
}

// ============================================================================
// SORTING
// ============================================================================

/**
 * Sort items by field
 */
export function sortItems<T>(
  items: T[],
  field: string,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aValue = getNestedValue(a, field)
    const bValue = getNestedValue(b, field)
    
    // Handle null/undefined
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1
    
    // Compare values
    let comparison = 0
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue)
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime()
    } else {
      comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    }
    
    return direction === 'asc' ? comparison : -comparison
  })
}

// ============================================================================
// TEXT HIGHLIGHTING
// ============================================================================

/**
 * Generate highlighted HTML for matched text
 * Returns HTML-safe string with <mark> tags
 */
export function highlightText(text: string, query: string): string {
  if (!text || !query) return text
  
  const normalizedQuery = normalizeText(query)
  const regex = new RegExp(`(${escapeRegex(normalizedQuery)})`, 'gi')
  
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ============================================================================
// DEBOUNCING
// ============================================================================

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  
  return function(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(...args)
    }, waitMs)
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Calculate search statistics
 */
export function calculateSearchStats<T>(
  originalCount: number,
  filteredCount: number,
  results: SearchResult<T>[]
) {
  return {
    total: originalCount,
    filtered: filteredCount,
    displayed: results.length,
    filteredOut: originalCount - filteredCount,
    averageScore: results.length > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length
      : 0
  }
}