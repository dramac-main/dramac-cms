"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { searchDomains } from "@/lib/actions/domains";
import type { DomainSearchResult } from "@/types/domain";

interface UseDomainSearchOptions {
  debounceMs?: number;
  tlds?: string[];
}

interface UseDomainSearchReturn {
  keyword: string;
  results: DomainSearchResult[];
  isSearching: boolean;
  error: string | null;
  setKeyword: (keyword: string) => void;
  search: (keyword: string, tlds?: string[]) => Promise<void>;
  clearResults: () => void;
}

export function useDomainSearch(options: UseDomainSearchOptions = {}): UseDomainSearchReturn {
  const { debounceMs = 500, tlds } = options;
  
  const [keyword, setKeywordState] = useState("");
  const [results, setResults] = useState<DomainSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);
  
  const search = useCallback(async (searchKeyword: string, searchTlds?: string[]) => {
    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    
    // Clear results for short keywords
    if (!searchKeyword || searchKeyword.length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    
    abortController.current = new AbortController();
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await searchDomains(searchKeyword, searchTlds || tlds);
      
      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setError(response.error || 'Search failed');
        setResults([]);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('An error occurred during search');
        setResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, [tlds]);
  
  const setKeyword = useCallback((value: string) => {
    // Clean the keyword
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setKeywordState(cleaned);
    
    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set new debounce timer
    debounceTimer.current = setTimeout(() => {
      search(cleaned);
    }, debounceMs);
  }, [search, debounceMs]);
  
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);
  
  return {
    keyword,
    results,
    isSearching,
    error,
    setKeyword,
    search,
    clearResults,
  };
}
