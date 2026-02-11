/**
 * TemplateGallery Component
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Gallery for browsing and installing pre-built workflow templates.
 * Allows users to quickly start with common automation patterns.
 */

"use client"

import { useState, useMemo } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { 
  Search, 
  Clock, 
  Zap, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  icons
} from "lucide-react"
import { 
  WORKFLOW_TEMPLATES, 
  getTemplateCategories, 
  searchTemplates,
  type WorkflowTemplate 
} from "../lib/templates"
import { createWorkflowFromTemplate } from "../actions/automation-actions"

// ============================================================================
// TYPES
// ============================================================================

interface TemplateGalleryProps {
  siteId: string
  onWorkflowCreated?: (workflowId: string) => void
  onSelect?: (template: WorkflowTemplate) => void
}

// ============================================================================
// HELPERS
// ============================================================================

function getComplexityColor(complexity: string): string {
  switch (complexity) {
    case "simple": 
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "intermediate": 
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "advanced": 
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    default: 
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TemplateGallery({ 
  siteId, 
  onWorkflowCreated,
  onSelect 
}: TemplateGalleryProps) {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const categories = useMemo(() => ['all', ...getTemplateCategories()], [])
  
  const filteredTemplates = useMemo(() => {
    let templates = search 
      ? searchTemplates(search)
      : WORKFLOW_TEMPLATES

    if (selectedCategory !== "all") {
      templates = templates.filter(t => t.category === selectedCategory)
    }

    return templates
  }, [search, selectedCategory])

  const handleUseTemplate = async (template: WorkflowTemplate) => {
    if (onSelect) {
      // If onSelect is provided, just pass the template (for embedding in builder)
      onSelect(template)
      setSelectedTemplate(null)
      return
    }

    setIsCreating(true)
    try {
      // Transform template to match server action expected format
      const templateData = {
        name: template.name,
        description: template.description,
        trigger: template.trigger,
        steps: template.steps.map(step => ({
          name: step.name,
          step_type: step.step_type,
          action_type: step.action_type,
          config: step.action_config || step.condition_config || step.delay_config || {},
        })),
      }
      const result = await createWorkflowFromTemplate(siteId, templateData)
      if (result.success && result.data) {
        toast.success("Workflow created from template!")
        onWorkflowCreated?.(result.data.id)
      } else {
        toast.error(result.error || "Failed to create workflow")
      }
    } catch (_error) {
      toast.error("An error occurred")
    } finally {
      setIsCreating(false)
      setSelectedTemplate(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Workflow Templates</h2>
          <p className="text-muted-foreground">
            Start with a pre-built automation and customize it to your needs
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-1">
          {categories.map((cat) => (
            <TabsTrigger 
              key={cat} 
              value={cat}
              className="capitalize"
            >
              {cat === 'all' ? 'All Templates' : cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => setSelectedTemplate(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="text-3xl">
                  {(() => {
                    const LucideIcon = icons[template.icon as keyof typeof icons]
                    return LucideIcon ? <LucideIcon className="h-8 w-8" /> : null
                  })()}
                </div>
                <Badge className={getComplexityColor(template.complexity)}>
                  {template.complexity}
                </Badge>
              </div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {template.name}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  {template.steps.length} steps
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {template.estimatedSetupTime}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {template.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-2">
            {(() => { const Icon = icons['Search']; return Icon ? <Icon className="h-10 w-10 mx-auto text-muted-foreground" /> : null })()}
          </div>
          <p className="text-muted-foreground">
            No templates found matching your search.
          </p>
          <Button 
            variant="link" 
            onClick={() => {
              setSearch("")
              setSelectedCategory("all")
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Template Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        {selectedTemplate && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div>
                  {(() => {
                    const LucideIcon = icons[selectedTemplate.icon as keyof typeof icons]
                    return LucideIcon ? <LucideIcon className="h-10 w-10" /> : null
                  })()}
                </div>
                <div>
                  <DialogTitle>{selectedTemplate.name}</DialogTitle>
                  <DialogDescription>{selectedTemplate.description}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {/* Trigger Info */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Trigger
                  </h4>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <code className="text-primary">
                      {(selectedTemplate.trigger.config.event_type as string) || selectedTemplate.trigger.type}
                    </code>
                  </div>
                </div>

                {/* Steps Preview */}
                <div>
                  <h4 className="font-medium mb-2">Workflow Steps</h4>
                  <div className="space-y-2">
                    {selectedTemplate.steps.map((step, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-3 border rounded-md"
                      >
                        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{step.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {step.step_type === "action" 
                              ? step.action_type 
                              : step.step_type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Required Connections */}
                {selectedTemplate.requiredConnections && 
                 selectedTemplate.requiredConnections.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Required Connections
                    </h4>
                    <div className="flex gap-2">
                      {selectedTemplate.requiredConnections.map((conn) => (
                        <Badge key={conn} variant="outline" className="capitalize">
                          {conn}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      You&apos;ll need to connect these services before the workflow can run.
                    </p>
                  </div>
                )}

                {/* Config Variables */}
                {selectedTemplate.configVariables && 
                 selectedTemplate.configVariables.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Configuration Required</h4>
                    <div className="space-y-2">
                      {selectedTemplate.configVariables.map((variable) => (
                        <div 
                          key={variable.key} 
                          className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                        >
                          <span>{variable.label}</span>
                          {variable.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Industry */}
                {selectedTemplate.industry && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Optimized for {selectedTemplate.industry}</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedTemplate(null)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleUseTemplate(selectedTemplate)}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Use This Template
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
