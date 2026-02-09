/**
 * useStorefrontCategories - Categories hook
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Fetches categories and provides utility functions for navigation.
 */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getPublicCategories } from '../actions/public-ecommerce-actions'
import type { 
  Category, 
  CategoryTreeNode,
  StorefrontCategoriesResult 
} from '../types/ecommerce-types'

/**
 * Build category tree from flat list
 */
function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const categoryMap = new Map<string, CategoryTreeNode>()
  const roots: CategoryTreeNode[] = []

  // First pass: create all nodes
  for (const category of categories) {
    categoryMap.set(category.id, {
      ...category,
      children: [],
      level: 0
    })
  }

  // Second pass: build tree structure
  for (const category of categories) {
    const node = categoryMap.get(category.id)!
    
    if (category.parent_id && categoryMap.has(category.parent_id)) {
      const parent = categoryMap.get(category.parent_id)!
      node.level = parent.level + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort children by sort_order
  const sortNodes = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
    nodes.sort((a, b) => a.sort_order - b.sort_order)
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortNodes(node.children)
      }
    }
    return nodes
  }

  return sortNodes(roots)
}

export function useStorefrontCategories(siteId: string): StorefrontCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    if (!siteId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getPublicCategories(siteId)
      // Only show active categories
      const activeCategories = data.filter(c => c.is_active)
      setCategories(activeCategories)
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err instanceof Error ? err.message : 'Failed to load categories')
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Build category tree
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])

  // Utility: Get category by ID
  const getCategoryById = useCallback((id: string): Category | undefined => {
    return categories.find(c => c.id === id)
  }, [categories])

  // Utility: Get category by slug
  const getCategoryBySlug = useCallback((slug: string): Category | undefined => {
    return categories.find(c => c.slug === slug)
  }, [categories])

  // Utility: Get category path (breadcrumbs)
  const getCategoryPath = useCallback((categoryId: string): Category[] => {
    const path: Category[] = []
    let currentId: string | null = categoryId

    while (currentId) {
      const category = categories.find(c => c.id === currentId)
      if (category) {
        path.unshift(category)
        currentId = category.parent_id
      } else {
        break
      }
    }

    return path
  }, [categories])

  return {
    categories,
    categoryTree,
    isLoading,
    error,
    getCategoryById,
    getCategoryBySlug,
    getCategoryPath
  }
}
