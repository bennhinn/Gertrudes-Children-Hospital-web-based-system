/**
 * Core Types for Generic Search System
 * These types work with ANY data structure across all dashboards
 */

// ============================================================================
// SEARCHABLE FIELD CONFIGURATION
// ============================================================================

/**
 * Defines a field that can be searched
 * Supports nested object paths (e.g., "user.profile.name")
 */
export interface SearchableField<T = any> {
  /** 
   * Path to the field (supports dot notation for nested fields)
   * Examples: "name", "user.email", "child.full_name"
   */
  key: string
  
  /**
   * Display label for the field
   */
  label: string
  
  /**
   * Search weight (higher = more important)
   * Range: 1-10, where 10 is most important
   */
  weight?: number
  
  /**
   * Custom search function for complex matching logic
   */
  customMatcher?: (value: any, query: string) => boolean
  
  /**
   * Transform value before searching (e.g., toLowerCase, trim)
   */
  transformer?: (value: any) => string
}

// ============================================================================
// FILTER CONFIGURATION
// ============================================================================

export type FilterType = 
  | 'select'        // Dropdown selection
  | 'multiselect'   // Multiple selections
  | 'date'          // Single date
  | 'daterange'     // Date range
  | 'boolean'       // Toggle/checkbox
  | 'number'        // Number input
  | 'range'         // Number range (min/max)
  | 'search'        // Additional search field
  | 'custom'        // Custom filter component

export interface FilterOption {
  label: string
  value: string | number | boolean
  icon?: string | React.ReactNode
  count?: number  // Show count of items for this option
}

export interface BaseFilter {
  /** Unique identifier for the filter */
  id: string
  
  /** Display label */
  label: string
  
  /** Field to filter on (supports dot notation) */
  field: string
  
  /** Filter type */
  type: FilterType
  
  /** Default value */
  defaultValue?: any
  
  /** Whether filter is visible by default */
  visible?: boolean
  
  /** Custom filter function */
  customFilter?: (item: any, filterValue: any) => boolean
}

export interface SelectFilter extends BaseFilter {
  type: 'select' | 'multiselect'
  options: FilterOption[]
  placeholder?: string
}

export interface DateFilter extends BaseFilter {
  type: 'date' | 'daterange'
  minDate?: Date
  maxDate?: Date
  placeholder?: string
}

export interface BooleanFilter extends BaseFilter {
  type: 'boolean'
  trueLabel?: string
  falseLabel?: string
}

export interface NumberFilter extends BaseFilter {
  type: 'number' | 'range'
  min?: number
  max?: number
  step?: number
  placeholder?: string
}

export interface CustomFilter extends BaseFilter {
  type: 'custom'
  component: React.ComponentType<any>
}

export type Filter = 
  | SelectFilter 
  | DateFilter 
  | BooleanFilter 
  | NumberFilter 
  | CustomFilter

// ============================================================================
// SEARCH CONFIGURATION
// ============================================================================

export interface SearchConfig<T = any> {
  /** Unique identifier for this search configuration */
  id: string
  
  /** Display name (e.g., "Appointments", "Patients") */
  entityName: string
  
  /** Plural form (e.g., "appointments", "patients") */
  entityNamePlural: string
  
  /** Fields that can be searched */
  searchableFields: SearchableField<T>[]
  
  /** Available filters */
  filters?: Filter[]
  
  /** Sort options */
  sortOptions?: SortOption<T>[]
  
  /** Default sort */
  defaultSort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  
  /** Placeholder text for search input */
  searchPlaceholder?: string
  
  /** Minimum characters before search triggers */
  minSearchLength?: number
  
  /** Debounce delay in milliseconds */
  debounceMs?: number
  
  /** Maximum results to show */
  maxResults?: number
  
  /** Enable fuzzy search */
  fuzzySearch?: boolean
  
  /** Case sensitive search */
  caseSensitive?: boolean
  
  /** Highlight matching text in results */
  highlightMatches?: boolean
}

// ============================================================================
// SORT CONFIGURATION
// ============================================================================

export interface SortOption<T = any> {
  id: string
  label: string
  field: string
  direction?: 'asc' | 'desc'
  customSort?: (a: T, b: T) => number
}

// ============================================================================
// SEARCH STATE
// ============================================================================

export interface SearchState {
  /** Current search query */
  query: string
  
  /** Active filters */
  filters: Record<string, any>
  
  /** Current sort */
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  
  /** Whether filters panel is expanded */
  filtersExpanded: boolean
  
  /** Loading state */
  isLoading: boolean
  
  /** Error state */
  error?: string
}

// ============================================================================
// SEARCH RESULT
// ============================================================================

export interface SearchResult<T = any> {
  /** The matched item */
  item: T
  
  /** Relevance score (0-100) */
  score: number
  
  /** Fields that matched the query */
  matchedFields: string[]
  
  /** Highlighted text snippets */
  highlights?: Record<string, string>
}

export interface SearchResults<T = any> {
  /** Array of search results */
  results: SearchResult<T>[]
  
  /** Total count before pagination */
  total: number
  
  /** Number of results filtered out */
  filteredCount: number
  
  /** Search metadata */
  metadata: {
    query: string
    filters: Record<string, any>
    executionTime: number
    hasMore: boolean
  }
}

// ============================================================================
// DISPLAY CONFIGURATION
// ============================================================================

export interface DisplayConfig {
  /** Show search statistics */
  showStats?: boolean
  
  /** Show clear all button */
  showClearAll?: boolean
  
  /** Show filter count badge */
  showFilterCount?: boolean
  
  /** Enable search history */
  enableHistory?: boolean
  
  /** Maximum history items to store */
  maxHistoryItems?: number
  
  /** Empty state message */
  emptyStateMessage?: string
  
  /** No results message */
  noResultsMessage?: string
  
  /** Loading message */
  loadingMessage?: string
}

// ============================================================================
// SEARCH EVENTS
// ============================================================================

export interface SearchEvents<T = any> {
  /** Called when search query changes */
  onSearch?: (query: string) => void
  
  /** Called when filters change */
  onFilterChange?: (filters: Record<string, any>) => void
  
  /** Called when sort changes */
  onSortChange?: (sort: { field: string; direction: 'asc' | 'desc' }) => void
  
  /** Called when results are updated */
  onResultsChange?: (results: SearchResults<T>) => void
  
  /** Called when search is cleared */
  onClear?: () => void
  
  /** Called when item is selected from results */
  onItemSelect?: (item: T) => void
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Get nested property value by dot notation path
 */
export type NestedKeyOf<T> = {
  [K in keyof T & (string | number)]: T[K] extends object
    ? `${K}` | `${K}.${NestedKeyOf<T[K]>}`
    : `${K}`
}[keyof T & (string | number)]

/**
 * Extract type from array
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : T

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}