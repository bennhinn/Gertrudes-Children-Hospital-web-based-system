/**
 * Universal Search System - Phase 1
 * Main export file for easy imports
 */

// Components
export { UniversalSearch } from './universal-search'
export { SearchInput, SearchInputWithSuggestions } from './search-input'
export { SearchFilters } from './search-filters'
export { HighlightText, MultiHighlightText } from './hightlight-text'

// Hooks
export { useSearch, useSearchHistory } from '@/hooks/use-search'

// Types
export type {
  SearchConfig,
  SearchableField,
  Filter,
  SelectFilter,
  DateFilter,
  BooleanFilter,
  NumberFilter,
  CustomFilter,
  FilterOption,
  FilterType,
  SortOption,
  SearchState,
  SearchResult,
  SearchResults,
  SearchEvents,
  DisplayConfig,
  NestedKeyOf,
  ArrayElement,
  DeepPartial
} from 'types/search.types'

// Utilities
export {
  getNestedValue,
  setNestedValue,
  normalizeText,
  matchesQuery,
  fuzzyMatch,
  calculateRelevanceScore,
  searchItems,
  applyFilters,
  sortItems,
  highlightText,
  debounce,
  calculateSearchStats
} from 'utils/search.utils'