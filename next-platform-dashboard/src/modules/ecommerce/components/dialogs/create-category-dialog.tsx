/**
 * Create Category Dialog
 * 
 * Phase EM-52: E-Commerce Module
 */
'use client'

import { useState } from 'react'
import { useEcommerce } from '../../context/ecommerce-context'
import { Loader2, Plus, FolderPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { CategoryInput } from '../../types/ecommerce-types'

interface CreateCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentId?: string
}

export function CreateCategoryDialog({ 
  open, 
  onOpenChange,
  parentId 
}: CreateCategoryDialogProps) {
  const { addCategory, categories, siteId, agencyId } = useEcommerce()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [selectedParentId, setSelectedParentId] = useState<string | null>(parentId || null)

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value))
    }
  }

  const resetForm = () => {
    setName('')
    setSlug('')
    setDescription('')
    setSelectedParentId(parentId || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Category name is required')
      return
    }

    setIsSubmitting(true)

    try {
      const categoryData = {
        site_id: siteId,
        agency_id: agencyId,
        name: name.trim(),
        slug: slug || generateSlug(name),
        description: description || null,
        parent_id: selectedParentId,
        image_url: null,
        is_active: true,
        sort_order: 0,
        seo_title: null,
        seo_description: null,
      }

      await addCategory(categoryData)
      toast.success('Category created successfully')
      resetForm()
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to create category')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get top-level categories for parent selection
  const topLevelCategories = categories.filter(c => !c.parent_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Add New Category
          </DialogTitle>
          <DialogDescription>
            Create a new product category for your store
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter category name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="category-url-slug"
            />
            <p className="text-xs text-muted-foreground">
              Used in the category URL. Auto-generated from name.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentCategory">Parent Category</Label>
            <Select 
              value={selectedParentId || '_none'} 
              onValueChange={(v) => setSelectedParentId(v === '_none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">None (Top Level)</SelectItem>
                {topLevelCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Organize categories in a hierarchy
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional category description"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
