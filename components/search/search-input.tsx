'use client'

/**
 * SearchInput Component
 * Reusable search input with clear and filter toggle
 */

import React from 'react'
import { Search, X, Filter } from 'lucide-react'

interface SearchInputProps {
    /** Current search value */
    value: string

    /** Change handler */
    onChange: (value: string) => void

    /** Placeholder text */
    placeholder?: string

    /** Show filter toggle button */
    showFilterToggle?: boolean

    /** Filter toggle state */
    filtersExpanded?: boolean

    /** Filter toggle handler */
    onFilterToggle?: () => void

    /** Show clear button */
    showClear?: boolean

    /** Clear handler */
    onClear?: () => void

    /** Has active filters (shows badge) */
    hasActiveFilters?: boolean

    /** Number of active filters */
    filterCount?: number

    /** Disabled state */
    disabled?: boolean

    /** Loading state */
    loading?: boolean

    /** Auto focus on mount */
    autoFocus?: boolean

    /** Custom className */
    className?: string

    /** ARIA label */
    ariaLabel?: string

    /** Key down handler */
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}

export function SearchInput({
    value,
    onChange,
    placeholder = 'Search...',
    showFilterToggle = true,
    filtersExpanded = false,
    onFilterToggle,
    showClear = true,
    onClear,
    hasActiveFilters = false,
    filterCount = 0,
    disabled = false,
    loading = false,
    autoFocus = false,
    className = '',
    ariaLabel = 'Search',
    onKeyDown
}: SearchInputProps) {

    const handleClear = () => {
        onChange('')
        onClear?.()
    }

    const showClearButton = showClear && value.length > 0

    return (
        <div className={`relative ${className}`}>
            {/* Search Icon */}
            <Search
                className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none"
                aria-hidden="true"
            />

            {/* Input */}
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                className={`
          h-12 w-full rounded-xl border border-slate-200 bg-white 
          pl-11 pr-24 text-sm shadow-sm
          transition-all duration-200
          placeholder:text-slate-400
          hover:border-slate-300
          focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${loading ? 'animate-pulse' : ''}
        `}
                aria-label={ariaLabel}
                role="searchbox"
                aria-busy={loading}
            />

            {/* Action Buttons */}
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {/* Clear Button */}
                {showClearButton && (
                    <button
                        onClick={handleClear}
                        disabled={disabled}
                        className="
              flex h-8 items-center gap-1 rounded-lg px-2 
              text-xs font-medium text-slate-600 
              transition-colors
              hover:bg-slate-100 hover:text-slate-900
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
              disabled:opacity-50 disabled:cursor-not-allowed
            "
                        aria-label="Clear search"
                        type="button"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}

                {/* Filter Toggle Button */}
                {showFilterToggle && onFilterToggle && (
                    <button
                        onClick={onFilterToggle}
                        disabled={disabled}
                        className={`
              flex h-8 items-center gap-1.5 rounded-lg px-3 
              text-xs font-medium
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
              disabled:opacity-50 disabled:cursor-not-allowed
              ${filtersExpanded
                                ? 'bg-slate-100 text-slate-900'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }
            `}
                        aria-label={filtersExpanded ? 'Hide filters' : 'Show filters'}
                        aria-expanded={filtersExpanded}
                        type="button"
                    >
                        <div className="relative">
                            <Filter className="h-3.5 w-3.5" />

                            {/* Filter Count Badge */}
                            {hasActiveFilters && filterCount > 0 && (
                                <span
                                    className="
                    absolute -right-1.5 -top-1.5 
                    flex h-3.5 w-3.5 items-center justify-center 
                    rounded-full bg-blue-500 
                    text-[9px] font-bold text-white
                  "
                                    aria-label={`${filterCount} active filters`}
                                >
                                    {filterCount}
                                </span>
                            )}
                        </div>
                        <span>Filters</span>
                    </button>
                )}
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    role="status"
                    aria-label="Loading search results"
                >
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
                </div>
            )}
        </div>
    )
}

// ============================================================================
// SEARCH INPUT WITH SUGGESTIONS
// ============================================================================

interface SearchInputWithSuggestionsProps extends SearchInputProps {
    /** Search suggestions/history */
    suggestions?: string[]

    /** Suggestion select handler */
    onSuggestionSelect?: (suggestion: string) => void

    /** Show suggestions */
    showSuggestions?: boolean
}

export function SearchInputWithSuggestions({
    suggestions = [],
    onSuggestionSelect,
    showSuggestions = true,
    ...props
}: SearchInputWithSuggestionsProps) {
    const [isFocused, setIsFocused] = React.useState(false)
    const [selectedIndex, setSelectedIndex] = React.useState(-1)

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev =>
                prev < suggestions.length - 1 ? prev + 1 : prev
            )
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault()
            onSuggestionSelect?.(suggestions[selectedIndex])
            setIsFocused(false)
        } else if (e.key === 'Escape') {
            setIsFocused(false)
        }
    }

    const filteredSuggestions = React.useMemo(() => {
        if (!props.value) return suggestions
        return suggestions.filter(s =>
            s.toLowerCase().includes(props.value.toLowerCase())
        )
    }, [suggestions, props.value])

    const showDropdown = isFocused && showSuggestions && filteredSuggestions.length > 0

    return (
        <div className="relative">
            <div onFocus={() => setIsFocused(true)}>
                <SearchInput {...props} onKeyDown={handleKeyDown as any} />
            </div>

            {/* Suggestions Dropdown */}
            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsFocused(false)}
                    />

                    {/* Suggestions List */}
                    <div
                        className="
              absolute left-0 right-0 top-full z-20 mt-2
              max-h-64 overflow-y-auto
              rounded-xl border border-slate-200 bg-white shadow-lg
            "
                        role="listbox"
                    >
                        {filteredSuggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    onSuggestionSelect?.(suggestion)
                                    setIsFocused(false)
                                }}
                                className={`
                  w-full px-4 py-2.5 text-left text-sm
                  transition-colors
                  hover:bg-slate-50
                  focus:bg-slate-50 focus:outline-none
                  ${index === selectedIndex ? 'bg-slate-50' : ''}
                `}
                                role="option"
                                aria-selected={index === selectedIndex}
                            >
                                <div className="flex items-center gap-2">
                                    <Search className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-slate-700">{suggestion}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}