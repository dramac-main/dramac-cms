/**
 * Edit Category Dialog
 * 
 * Phase EM-52: E-Commerce Module
 */
'use client'

import { useState, useEffect } from 'react'
import { useEcommerce } from '../../context/ecommerce-context'
import type { Category } from '../../types/ecommerce-types'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

interface EditCategoryDialogProps {
  category: Category | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCategoryDialog({ category, open, onOpenChange }: EditCategoryDialogProps) {
  const { editCategory, categories, isLoading } = useEcommerce()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [manualSlugEdit, setManualSlugEdit] = useState(false)

  // Load category data when dialog opens
  useEffect(() => {
    if (open && category) {
      setName(category.name)
      setSlug(category.slug)
      setDescription(category.description || '')
      setParentId(category.parent_id || '')
      setManualSlugEdit(false)
    } else if (!open) {
      // Reset form when dialog closes
      resetForm()
    }
  }, [open, category])

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!manualSlugEdit) {
      setSlug(generateSlug(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setManualSlugEdit(true)
    setSlug(value)
  }

  const resetForm = () => {
    setName('')
    setSlug('')
    setDescription('')
    setParentId('')
    setManualSlugEdit(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) return

    if (!name.trim()) {
      toast.error('Please enter a category name')
      return
    }

    setIsSubmitting(true)
    try {
      const updateData = {
        name: name.trim(),
        slug: slug || generateSlug(name),
        description: description.trim() || null,
        parent_id: parentId || null,
      }

      await editCategory(category.id, updateData)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter out current category and its descendants from parent options
  const availableParentCategories = categories.filter(cat => {
    if (!category) return true
    if (cat.id === category.id) return false
    // Could add logic here to prevent circular references
    return true
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the category details below
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Electronics, Clothing, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="electronics"
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs. Auto-generated from name if left empty.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this category..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category</Label>
              <Select value={parentId || 'none'} onValueChange={(value) => setParentId(value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="No parent (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (top-level)</SelectItem>
                  {availableParentCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Make this a subcategory of another category
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
