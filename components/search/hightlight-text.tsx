'use client'

/**
 * HighlightText Component
 * Highlights matching text in search results
 */

import React from 'react'
import { JSX } from 'react/jsx-runtime'

interface HighlightTextProps {
  /** Text to display */
  text: string
  
  /** Search query to highlight */
  query: string
  
  /** Custom highlight className */
  highlightClassName?: string
  
  /** Case sensitive matching */
  caseSensitive?: boolean
  
  /** Custom wrapper component */
  as?: keyof JSX.IntrinsicElements
  
  /** Additional props for wrapper */
  [key: string]: any
}

/**
 * Highlights text that matches the search query
 */
export function HighlightText({
  text,
  query,
  highlightClassName = 'bg-yellow-200 font-medium text-slate-900 rounded px-0.5',
  caseSensitive = false,
  as: Component = 'span',
  ...props
}: HighlightTextProps) {
  // If no query, return plain text
  if (!query || !query.trim()) {
    return <Component {...props}>{text}</Component>
  }
  
  // If text is empty, return empty
  if (!text) {
    return <Component {...props} />
  }
  
  try {
    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // Create regex with optional case sensitivity
    const regex = new RegExp(
      `(${escapedQuery})`,
      caseSensitive ? 'g' : 'gi'
    )
    
    // Split text by matches
    const parts = text.split(regex)
    
    return (
      <Component {...props}>
        {parts.map((part, index) => {
          // Check if this part matches the query
          const isMatch = caseSensitive
            ? part === query
            : part.toLowerCase() === query.toLowerCase()
          
          if (isMatch) {
            return (
              <mark key={index} className={highlightClassName}>
                {part}
              </mark>
            )
          }
          
          return <React.Fragment key={index}>{part}</React.Fragment>
        })}
      </Component>
    )
  } catch (error) {
    // If regex fails, return plain text
    console.error('HighlightText error:', error)
    return <Component {...props}>{text}</Component>
  }
}

/**
 * Highlights multiple queries in different colors
 */
export function MultiHighlightText({
  text,
  queries,
  highlightClassNames = ['bg-yellow-200', 'bg-blue-200', 'bg-green-200'],
  as: Component = 'span',
  ...props
}: {
  text: string
  queries: string[]
  highlightClassNames?: string[]
  as?: keyof JSX.IntrinsicElements
  [key: string]: any
}) {
  if (!queries.length || !text) {
    return <Component {...props}>{text}</Component>
  }
  
  // Sort queries by length (longest first) to avoid partial matches
  const sortedQueries = [...queries].sort((a, b) => b.length - a.length)
  
  let result: React.ReactNode = text
  
  sortedQueries.forEach((query, index) => {
    const className = highlightClassNames[index % highlightClassNames.length]
    result = (
      <HighlightText
        text={String(result)}
        query={query}
        highlightClassName={className}
        as="span"
      />
    )
  })
  
  return <Component {...props}>{result}</Component>
}