'use client'

/**
 * UniversalSearch Component
 * Main search component that combines all pieces
 */

import React from 'react'
import { useSearch } from 'hooks/use-search'
import { SearchInput } from './search-input'
import { SearchFilters } from './search-filters'
import type { SearchConfig, SearchEvents, DisplayConfig } from'types/search.types'

interface UniversalSearchProps<T> {
  /** Search configuration */
  config: SearchConfig<T>
  
  /** Data to search through */
  data: T[]
  
  /** Render function for each result */
  renderItem: (item: T, index: number, searchQuery: string) => React.ReactNode
  
  /** Event handlers */
  events?: SearchEvents<T>
  
  /** Display configuration */
  display?: DisplayConfig
  
  /** Custom empty state component */
  emptyState?: React.ReactNode
  
  /** Custom no results component */
  noResults?: React.ReactNode
  
  /** Custom loading component */
  loading?: React.ReactNode
  
  /** Show loading state */
  isLoading?: boolean
  
  /** Custom className for container */
  className?: string
  
  /** Custom className for results */
  resultsClassName?: string
  
  /** Enable URL persistence */
  persistToUrl?: boolean
  
  /** Enable localStorage persistence */
  persistToStorage?: boolean
  
  /** Storage key */
  storageKey?: string
}

export function UniversalSearch<T = any>({
  config,
  data,
  renderItem,
  events,
  display = {},
  emptyState,
  noResults,
  loading,
  isLoading = false,
  className = '',
  resultsClassName = '',
  persistToUrl = false,
  persistToStorage = false,
  storageKey = `search-${config.id}`
}: UniversalSearchProps<T>) {
  
  // Use the search hook
  const search = useSearch({
    config,
    data,
    events,
    persistToUrl,
    persistToStorage,
    storageKey
  })
  
  // Count active filters
  const activeFilterCount = Object.keys(search.state.filters).filter(key => {
    const value = search.state.filters[key]
    return value !== null && value !== undefined && value !== ''
  }).length
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <SearchInput
        value={search.state.query}
        onChange={search.setQuery}
        placeholder={config.searchPlaceholder}
        showFilterToggle={config.filters && config.filters.length > 0}
        filtersExpanded={search.state.filtersExpanded}
        onFilterToggle={search.toggleFiltersExpanded}
        showClear={display.showClearAll !== false}
        onClear={search.reset}
        hasActiveFilters={search.hasActiveFilters}
        filterCount={display.showFilterCount !== false ? activeFilterCount : undefined}
        disabled={isLoading}
        loading={isLoading}
        ariaLabel={`Search ${config.entityNamePlural}`}
      />
      
      {/* Filters Panel */}
      {config.filters && config.filters.length > 0 && (
        <SearchFilters
          filters={config.filters}
          values={search.state.filters}
          onChange={search.setFilter}
          onClear={search.clearFilter}
          onClearAll={search.clearAllFilters}
          isExpanded={search.state.filtersExpanded}
        />
      )}
      
      {/* Search Statistics */}
      {display.showStats !== false && (search.hasQuery || search.hasActiveFilters) && (
        <SearchStats
          stats={search.stats}
          hasQuery={search.hasQuery}
          hasFilters={search.hasActiveFilters}
          onClear={search.reset}
        />
      )}
      
      {/* Loading State */}
      {isLoading && loading}
      
      {/* Empty State (no data at all) */}
      {!isLoading && data.length === 0 && (
        emptyState || (
          <DefaultEmptyState 
            message={display.emptyStateMessage || `No ${config.entityNamePlural} yet`}
          />
        )
      )}
      
      {/* No Results State (data exists but no matches) */}
      {!isLoading && data.length > 0 && search.isEmpty && (
        noResults || (
          <DefaultNoResults
            message={display.noResultsMessage || `No ${config.entityNamePlural} found`}
            hasQuery={search.hasQuery}
            hasFilters={search.hasActiveFilters}
            onClear={search.reset}
          />
        )
      )}
      
      {/* Results */}
      {!isLoading && !search.isEmpty && (
        <div 
          className={`space-y-3 ${resultsClassName}`}
          role="list"
          aria-label={`Search results for ${config.entityNamePlural}`}
        >
          {search.results.results.map((result, index) => (
            <div key={index} role="listitem">
              {renderItem(result.item, index, search.state.query)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function SearchStats({
  stats,
  hasQuery,
  hasFilters,
  onClear
}: {
  stats: any
  hasQuery: boolean
  hasFilters: boolean
  onClear: () => void
}) {
  return (
    <div 
      className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 text-sm"
      role="status"
      aria-live="polite"
    >
      <span className="text-slate-700">
        <strong className="font-semibold text-blue-700">{stats.displayed}</strong>
        {' '}result{stats.displayed !== 1 ? 's' : ''} found
        {stats.filteredOut > 0 && (
          <span className="text-slate-600">
            {' '}({stats.filteredOut} filtered out)
          </span>
        )}
      </span>
      {(hasQuery || hasFilters) && (
        <button
          onClick={onClear}
          className="
            rounded-md px-3 py-1 text-xs font-medium 
            text-blue-700 transition-colors
            hover:bg-blue-100
          "
        >
          Clear
        </button>
      )}
    </div>
  )
}

function DefaultEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 p-12 text-center">
      <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-3xl shadow-sm ring-1 ring-slate-900/5">
        📋
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{message}</h3>
      <p className="text-sm text-slate-600">
        Get started by adding your first item
      </p>
    </div>
  )
}

function DefaultNoResults({
  message,
  hasQuery,
  hasFilters,
  onClear
}: {
  message: string
  hasQuery: boolean
  hasFilters: boolean
  onClear: () => void
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-12 text-center" role="status">
      <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
        🔍
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{message}</h3>
      <p className="mb-4 text-sm text-slate-600">
        {hasQuery || hasFilters 
          ? 'Try adjusting your search or filters'
          : 'Start searching to find what you need'
        }
      </p>
      {(hasQuery || hasFilters) && (
        <button
          onClick={onClear}
          className="
            rounded-lg border border-slate-200 bg-white 
            px-4 py-2 text-sm font-medium text-slate-700
            shadow-sm transition-all
            hover:bg-slate-50 hover:shadow
          "
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}