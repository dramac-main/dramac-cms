/**
 * useStorefrontSearch - Search hook
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Provides debounced product search with recent searches.
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getPublicProducts } from '../actions/public-ecommerce-actions'
import type { 
  Product, 
  StorefrontSearchResult 
} from '../types/ecommerce-types'

const RECENT_SEARCHES_KEY = 'ecom_recent_searches'
const MAX_RECENT_SEARCHES = 5
const DEBOUNCE_MS = 300
const MIN_SEARCH_LENGTH = 2

function getRecentSearches(siteId: string): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(`${RECENT_SEARCHES_KEY}_${siteId}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addRecentSearch(siteId: string, query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return
  
  try {
    const recent = getRecentSearches(siteId)
    const filtered = recent.filter(s => s.toLowerCase() !== query.toLowerCase())
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES)
    localStorage.setItem(`${RECENT_SEARCHES_KEY}_${siteId}`, JSON.stringify(updated))
  } catch (err) {
    console.error('Error saving recent search:', err)
  }
}

function clearRecentSearchesStorage(siteId: string): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(`${RECENT_SEARCHES_KEY}_${siteId}`)
  } catch (err) {
    console.error('Error clearing recent searches:', err)
  }
}

export function useStorefrontSearch(siteId: string): StorefrontSearchResult {
  const [query, setQueryState] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Load recent searches
  useEffect(() => {
    if (siteId) {
      setRecentSearches(getRecentSearches(siteId))
    }
  }, [siteId])

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!siteId || searchQuery.length < MIN_SEARCH_LENGTH) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const response = await getPublicProducts(siteId, {
        search: searchQuery,
        status: 'active'
      }, 1, 10)

      setResults(response.data)
      
      // Save to recent searches
      addRecentSearch(siteId, searchQuery)
      setRecentSearches(getRecentSearches(siteId))
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [siteId])

  // Debounced query setter
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery)

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (!newQuery.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    if (newQuery.length >= MIN_SEARCH_LENGTH) {
      setIsSearching(true)
      debounceTimer.current = setTimeout(() => {
        performSearch(newQuery)
      }, DEBOUNCE_MS)
    }
  }, [performSearch])

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    clearRecentSearchesStorage(siteId)
    setRecentSearches([])
  }, [siteId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    recentSearches,
    clearRecentSearches
  }
}
