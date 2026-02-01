'use client'

/**
 * SearchFilters Component
 * Dynamic filter panel that renders different filter types
 */

import React from 'react'
import type { Filter, SelectFilter, DateFilter, BooleanFilter, NumberFilter } from 'types/search.types'

interface SearchFiltersProps {
  /** Filter configurations */
  filters: Filter[]
  
  /** Current filter values */
  values: Record<string, any>
  
  /** Change handler */
  onChange: (filterId: string, value: any) => void
  
  /** Clear handler */
  onClear?: (filterId: string) => void
  
  /** Clear all handler */
  onClearAll?: () => void
  
  /** Whether filters are visible */
  isExpanded?: boolean
  
  /** Custom className */
  className?: string
}

export function SearchFilters({
  filters,
  values,
  onChange,
  onClear,
  onClearAll,
  isExpanded = true,
  className = ''
}: SearchFiltersProps) {
  
  if (!isExpanded || filters.length === 0) return null
  
  const hasActiveFilters = Object.keys(values).some(key => {
    const value = values[key]
    return value !== null && value !== undefined && value !== ''
  })
  
  return (
    <div 
      className={`
        grid gap-4 rounded-xl bg-slate-50 p-5 
        ring-1 ring-slate-900/5
        sm:grid-cols-2 lg:grid-cols-3
        ${className}
      `}
      role="region"
      aria-label="Search filters"
    >
      {filters.map(filter => (
        <FilterField
          key={filter.id}
          filter={filter}
          value={values[filter.id]}
          onChange={(value) => onChange(filter.id, value)}
          onClear={onClear ? () => onClear(filter.id) : undefined}
        />
      ))}
      
      {/* Clear All Button */}
      {hasActiveFilters && onClearAll && (
        <div className="flex items-end sm:col-span-2 lg:col-span-3">
          <button
            onClick={onClearAll}
            className="
              rounded-lg border border-slate-200 bg-white 
              px-4 py-2 text-sm font-medium text-slate-700
              shadow-sm transition-all
              hover:bg-slate-50 hover:shadow
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
            "
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// INDIVIDUAL FILTER FIELD
// ============================================================================

interface FilterFieldProps {
  filter: Filter
  value: any
  onChange: (value: any) => void
  onClear?: () => void
}

function FilterField({ filter, value, onChange, onClear }: FilterFieldProps) {
  switch (filter.type) {
    case 'select':
    case 'multiselect':
      return <SelectFilterField filter={filter as SelectFilter} value={value} onChange={onChange} />
    
    case 'date':
    case 'daterange':
      return <DateFilterField filter={filter as DateFilter} value={value} onChange={onChange} />
    
    case 'boolean':
      return <BooleanFilterField filter={filter as BooleanFilter} value={value} onChange={onChange} />
    
    case 'number':
    case 'range':
      return <NumberFilterField filter={filter as NumberFilter} value={value} onChange={onChange} />
    
    case 'custom':
      const CustomComponent = (filter as any).component
      return <CustomComponent filter={filter} value={value} onChange={onChange} />
    
    default:
      return null
  }
}

// ============================================================================
// SELECT FILTER
// ============================================================================

function SelectFilterField({ 
  filter, 
  value, 
  onChange 
}: { 
  filter: SelectFilter
  value: any
  onChange: (value: any) => void 
}) {
  return (
    <div className="space-y-2">
      <label 
        htmlFor={filter.id} 
        className="block text-xs font-medium text-slate-700"
      >
        {filter.label}
      </label>
      
      {filter.type === 'select' ? (
        <select
          id={filter.id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="
            h-10 w-full rounded-lg border border-slate-200 bg-white 
            px-3 text-sm shadow-sm
            transition-all
            hover:border-slate-300
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
          "
        >
          <option value="">
            {filter.placeholder || `All ${filter.label}`}
          </option>
          {filter.options.map(option => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
              {option.count !== undefined && ` (${option.count})`}
            </option>
          ))}
        </select>
      ) : (
        <div className="space-y-2">
          {filter.options.map(option => (
            <label 
              key={String(option.value)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(option.value)}
                onChange={(e) => {
                  const currentValues = Array.isArray(value) ? value : []
                  if (e.target.checked) {
                    onChange([...currentValues, option.value])
                  } else {
                    onChange(currentValues.filter(v => v !== option.value))
                  }
                }}
                className="
                  h-4 w-4 rounded border-slate-300 
                  text-blue-600 
                  focus:ring-2 focus:ring-blue-500/20
                "
              />
              <span className="text-sm text-slate-700">
                {option.label}
                {option.count !== undefined && (
                  <span className="ml-1 text-slate-500">({option.count})</span>
                )}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// DATE FILTER
// ============================================================================

function DateFilterField({ 
  filter, 
  value, 
  onChange 
}: { 
  filter: DateFilter
  value: any
  onChange: (value: any) => void 
}) {
  if (filter.type === 'date') {
    return (
      <div className="space-y-2">
        <label 
          htmlFor={filter.id} 
          className="block text-xs font-medium text-slate-700"
        >
          {filter.label}
        </label>
        <input
          id={filter.id}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          min={filter.minDate?.toISOString().split('T')[0]}
          max={filter.maxDate?.toISOString().split('T')[0]}
          className="
            h-10 w-full rounded-lg border border-slate-200 bg-white 
            px-3 text-sm shadow-sm
            transition-all
            hover:border-slate-300
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
          "
        />
      </div>
    )
  }
  
  // Date range
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-700">
        {filter.label}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={value?.start || ''}
          onChange={(e) => onChange({ ...value, start: e.target.value || null })}
          placeholder="Start date"
          className="
            h-10 w-full rounded-lg border border-slate-200 bg-white 
            px-3 text-sm shadow-sm
            transition-all
            hover:border-slate-300
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
          "
        />
        <input
          type="date"
          value={value?.end || ''}
          onChange={(e) => onChange({ ...value, end: e.target.value || null })}
          placeholder="End date"
          className="
            h-10 w-full rounded-lg border border-slate-200 bg-white 
            px-3 text-sm shadow-sm
            transition-all
            hover:border-slate-300
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
          "
        />
      </div>
    </div>
  )
}

// ============================================================================
// BOOLEAN FILTER
// ============================================================================

function BooleanFilterField({ 
  filter, 
  value, 
  onChange 
}: { 
  filter: BooleanFilter
  value: any
  onChange: (value: any) => void 
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="
            h-4 w-4 rounded border-slate-300 
            text-blue-600 
            focus:ring-2 focus:ring-blue-500/20
          "
        />
        <span className="text-sm font-medium text-slate-700">
          {filter.label}
        </span>
      </label>
    </div>
  )
}

// ============================================================================
// NUMBER FILTER
// ============================================================================

function NumberFilterField({ 
  filter, 
  value, 
  onChange 
}: { 
  filter: NumberFilter
  value: any
  onChange: (value: any) => void 
}) {
  if (filter.type === 'number') {
    return (
      <div className="space-y-2">
        <label 
          htmlFor={filter.id} 
          className="block text-xs font-medium text-slate-700"
        >
          {filter.label}
        </label>
        <input
          id={filter.id}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          min={filter.min}
          max={filter.max}
          step={filter.step}
          placeholder={filter.placeholder}
          className="
            h-10 w-full rounded-lg border border-slate-200 bg-white 
            px-3 text-sm shadow-sm
            transition-all
            hover:border-slate-300
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
          "
        />
      </div>
    )
  }
  
  // Number range
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-700">
        {filter.label}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={value?.min || ''}
          onChange={(e) => onChange({ 
            ...value, 
            min: e.target.value ? Number(e.target.value) : null 
          })}
          min={filter.min}
          max={filter.max}
          step={filter.step}
          placeholder="Min"
          className="
            h-10 w-full rounded-lg border border-slate-200 bg-white 
            px-3 text-sm shadow-sm
            transition-all
            hover:border-slate-300
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
          "
        />
        <input
          type="number"
          value={value?.max || ''}
          onChange={(e) => onChange({ 
            ...value, 
            max: e.target.value ? Number(e.target.value) : null 
          })}
          min={filter.min}
          max={filter.max}
          step={filter.step}
          placeholder="Max"
          className="
            h-10 w-full rounded-lg border border-slate-200 bg-white 
            px-3 text-sm shadow-sm
            transition-all
            hover:border-slate-300
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
          "
        />
      </div>
    </div>
  )
}