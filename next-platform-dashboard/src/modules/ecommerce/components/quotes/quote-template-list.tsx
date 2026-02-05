/**
 * Quote Template List Component
 * 
 * Phase ECOM-13: Quote Templates & Automation
 * 
 * List and manage quote templates
 */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Star,
  StarOff,
  FileText,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
  getQuoteTemplates, 
  deleteQuoteTemplate,
  duplicateQuoteTemplate,
  updateQuoteTemplate
} from '../../actions/quote-template-actions'
import { QuoteTemplateDialog } from './quote-template-dialog'
import type { QuoteTemplate } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteTemplateListProps {
  siteId: string
  agencyId: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteTemplateList({ siteId, agencyId }: QuoteTemplateListProps) {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null)
  
  // Load templates
  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const data = await getQuoteTemplates(siteId)
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    loadTemplates()
  }, [siteId])
  
  // Handlers
  const handleCreate = () => {
    setEditingTemplate(null)
    setShowDialog(true)
  }
  
  const handleEdit = (template: QuoteTemplate) => {
    setEditingTemplate(template)
    setShowDialog(true)
  }
  
  const handleDuplicate = async (template: QuoteTemplate) => {
    const result = await duplicateQuoteTemplate(siteId, template.id)
    if (result.success) {
      toast.success('Template duplicated')
      loadTemplates()
    } else {
      toast.error(result.error || 'Failed to duplicate')
    }
  }
  
  const handleDelete = async (template: QuoteTemplate) => {
    if (!confirm(`Delete template "${template.name}"?`)) return
    
    const result = await deleteQuoteTemplate(siteId, template.id)
    if (result.success) {
      toast.success('Template deleted')
      loadTemplates()
    } else {
      toast.error(result.error || 'Failed to delete')
    }
  }
  
  const handleToggleDefault = async (template: QuoteTemplate) => {
    const result = await updateQuoteTemplate(siteId, template.id, {
      is_default: !template.is_default
    })
    if (result.success) {
      toast.success(template.is_default ? 'Default removed' : 'Set as default')
      loadTemplates()
    } else {
      toast.error(result.error || 'Failed to update')
    }
  }
  
  const handleSaved = () => {
    setShowDialog(false)
    setEditingTemplate(null)
    loadTemplates()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quote Templates</h3>
          <p className="text-sm text-muted-foreground">
            Create reusable templates for faster quote creation
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>
      
      {/* Template Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="font-semibold mb-2">No templates yet</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first template to speed up quote creation
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card 
              key={template.id}
              className={cn(
                'relative',
                !template.is_active && 'opacity-60'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {template.name}
                      {template.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Default
                        </Badge>
                      )}
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(template)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleDefault(template)}>
                        {template.is_default ? (
                          <>
                            <StarOff className="h-4 w-4 mr-2" />
                            Remove Default
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-2" />
                            Set as Default
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(template)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span>{template.default_discount_value > 0 ? `${template.default_discount_value}${template.default_discount_type === 'percentage' ? '%' : ' fixed'}` : 'None'}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Default Items</span>
                    <span>{template.items?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Validity</span>
                    <span>{template.default_validity_days} days</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Used</span>
                    <span>{template.usage_count || template.use_count || 0} times</span>
                  </div>
                </div>
                
                {!template.is_active && (
                  <Badge variant="outline" className="mt-3">
                    Inactive
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Template Dialog */}
      <QuoteTemplateDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        template={editingTemplate}
        siteId={siteId}
        agencyId={agencyId}
        onSaved={handleSaved}
      />
    </div>
  )
}
