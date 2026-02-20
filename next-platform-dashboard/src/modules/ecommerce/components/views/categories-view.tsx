/**
 * Categories View Component
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Displays product categories in a tree/list structure
 */
'use client'

import { useState, useMemo } from 'react'
import { useEcommerce } from '../../context/ecommerce-context'
import type { Category } from '../../types/ecommerce-types'
import { EditCategoryDialog } from '../dialogs/edit-category-dialog'
import { 
  FolderTree, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  FolderOpen,
  Folder
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface CategoriesViewProps {
  searchQuery?: string
  onCreateCategory?: () => void
}

export function CategoriesView({ searchQuery = '', onCreateCategory }: CategoriesViewProps) {
  const { categories, products, isLoading, removeCategory } = useEcommerce()
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Filter categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories
    
    const query = searchQuery.toLowerCase()
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(query) ||
      cat.description?.toLowerCase().includes(query)
    )
  }, [categories, searchQuery])

  // Build tree structure
  const rootCategories = useMemo(() => {
    return filteredCategories.filter(cat => !cat.parent_id)
  }, [filteredCategories])

  const getChildCategories = (parentId: string) => {
    return filteredCategories.filter(cat => cat.parent_id === parentId)
  }

  const getProductCount = (categoryId: string): number => {
    // Count products in this category (simplified - in real app would use a join)
    return products.filter(p => p.categories?.some(c => c.id === categoryId)).length
  }

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await removeCategory(categoryId)
    }
  }

  const renderCategory = (category: Category, level: number = 0): React.ReactNode => {
    const children = getChildCategories(category.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedCategories.includes(category.id)
    const productCount = getProductCount(category.id)

    return (
      <>
        <TableRow key={category.id}>
          <TableCell>
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mr-2"
                  onClick={() => toggleExpanded(category.id)}
                >
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    isExpanded && "rotate-90"
                  )} />
                </Button>
              ) : (
                <div className="w-8" />
              )}
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 mr-2 text-primary" />
                ) : (
                  <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                )
              ) : (
                <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
              )}
              <span className="font-medium">{category.name}</span>
            </div>
          </TableCell>
          <TableCell>
            <code className="text-sm text-muted-foreground">{category.slug}</code>
          </TableCell>
          <TableCell>
            <Badge variant="secondary">{productCount} products</Badge>
          </TableCell>
          <TableCell>
            {category.is_active ? (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Active
              </Badge>
            ) : (
              <Badge variant="secondary">Hidden</Badge>
            )}
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  View Products
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingCategory(category)
                    setShowEditDialog(true)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCreateCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subcategory
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && children.map(child => renderCategory(child, level + 1))}
      </>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <Button onClick={onCreateCategory}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      {rootCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No categories found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first category'}
          </p>
          {!searchQuery && (
            <Button onClick={onCreateCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rootCategories.map(category => renderCategory(category))}
            </TableBody>
          </Table>
        </div>
      )}

      <EditCategoryDialog 
        category={editingCategory}
        open={showEditDialog} 
        onOpenChange={setShowEditDialog}
      />
    </div>
  )
}
