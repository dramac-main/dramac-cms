/**
 * @dramac/sdk - UI Hooks
 * 
 * Common React hooks for module development
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { PaginatedResult } from '../types/database';

/**
 * Hook for paginated data fetching with automatic refresh
 */
export function usePaginatedData<T>(
  fetcher: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  options: {
    pageSize?: number;
    initialPage?: number;
    autoRefresh?: number; // Refresh interval in ms
  } = {}
) {
  const { pageSize = 20, initialPage = 1, autoRefresh } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  
  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const result = await fetcherRef.current(page, pageSize);
      setData(result.data);
      setTotal(result.total);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [page, pageSize]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchData(false);
    }, autoRefresh);
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);
  
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    error,
    isRefreshing,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    setPage,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    previousPage: () => setPage((p) => Math.max(p - 1, 1)),
    refresh: () => fetchData(false),
  };
}

/**
 * Hook for form state management with validation
 */
export function useModuleForm<T extends Record<string, unknown>>(
  initialValues: T,
  options: {
    onSubmit: (values: T) => Promise<void>;
    validate?: (values: T) => Partial<Record<keyof T, string>> | null;
    resetOnSuccess?: boolean;
  }
) {
  const { onSubmit, validate, resetOnSuccess = false } = options;
  
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const handleChange = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setIsDirty(true);
  }, []);
  
  const handleBlur = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    // Validate on blur
    if (validate) {
      const validationErrors = validate(values);
      if (validationErrors?.[field]) {
        setErrors((prev) => ({ ...prev, [field]: validationErrors[field] }));
      }
    }
  }, [validate, values]);
  
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Validate all fields
    if (validate) {
      const validationErrors = validate(values);
      if (validationErrors && Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      await onSubmit(values);
      if (resetOnSuccess) {
        setValues(initialValues);
        setIsDirty(false);
        setTouched({});
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSubmitError(errorMessage);
      
      // Handle field-specific errors from API
      if (error && typeof error === 'object' && 'fieldErrors' in error) {
        setErrors(error.fieldErrors as Partial<Record<keyof T, string>>);
      }
    } finally {
      setSubmitting(false);
    }
  }, [values, validate, onSubmit, resetOnSuccess, initialValues]);
  
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
    setSubmitError(null);
  }, [initialValues]);
  
  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    handleChange(field, value);
  }, [handleChange]);
  
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);
  
  return {
    values,
    errors,
    touched,
    submitting,
    submitError,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
    setValues,
  };
}

/**
 * Hook for module settings with auto-save
 */
export function useModuleSettings<T extends Record<string, unknown>>(
  moduleId: string,
  defaults: T,
  options: {
    autoSave?: boolean;
    debounceMs?: number;
  } = {}
) {
  const { autoSave = false, debounceMs = 1000 } = options;
  
  const [settings, setSettings] = useState<T>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  
  // Load settings
  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/modules/${moduleId}/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings({ ...defaults, ...data });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [moduleId, defaults]);
  
  const saveSettings = useCallback(async (newSettings: T) => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/modules/${moduleId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setSaving(false);
    }
  }, [moduleId]);
  
  const updateSettings = useCallback(async (updates: Partial<T>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    if (autoSave) {
      // Debounced auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings(newSettings);
      }, debounceMs);
    }
  }, [settings, autoSave, debounceMs, saveSettings]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    settings,
    loading,
    saving,
    error,
    updateSettings,
    saveSettings: () => saveSettings(settings),
    resetSettings: () => setSettings(defaults),
  };
}

/**
 * Hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Hook for async operations with loading/error states
 */
export function useAsync<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<{
    loading: boolean;
    error: Error | null;
    data: T | null;
  }>({
    loading: false,
    error: null,
    data: null,
  });
  
  const execute = useCallback(async (...args: Args) => {
    setState({ loading: true, error: null, data: null });
    
    try {
      const data = await asyncFunction(...args);
      setState({ loading: false, error: null, data });
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({ loading: false, error: err, data: null });
      throw err;
    }
  }, [asyncFunction]);
  
  return {
    ...state,
    execute,
    reset: () => setState({ loading: false, error: null, data: null }),
  };
}

/**
 * Hook for local storage state
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  return [storedValue, setValue];
}

/**
 * Hook for copying text to clipboard
 */
export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      setTimeout(() => {
        setCopied(false);
      }, timeout);
      
      return true;
    } catch (error) {
      console.warn('Failed to copy to clipboard:', error);
      return false;
    }
  }, [timeout]);
  
  return { copied, copy };
}

/**
 * Hook for tracking component mount state
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  return mounted;
}
