"use client"

/**
 * Builder Tool Selector Component
 * 
 * PHASE-UI-13B: AI Agent Builder UI Enhancement
 * Grid of tools with search and filtering for agent capabilities
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search,
  Check,
  Code,
  Globe,
  Database,
  FileText,
  Mail,
  Calendar,
  MessageSquare,
  Zap,
  Cloud,
  Lock,
  Calculator,
  Image,
  Video,
  Music,
  MapPin,
  ShoppingCart,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  Webhook,
  Package,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// =============================================================================
// TYPES
// =============================================================================

export type ToolCategory = 
  | 'communication'
  | 'data'
  | 'integration'
  | 'productivity'
  | 'media'
  | 'commerce'
  | 'analytics'
  | 'custom'

export interface AgentTool {
  id: string
  name: string
  description: string
  category: ToolCategory
  icon: string
  isPremium?: boolean
  isNew?: boolean
  isDeprecated?: boolean
  requiredPermissions?: string[]
}

export interface BuilderToolSelectorProps {
  tools: AgentTool[]
  selectedTools: string[]
  onSelectionChange: (selected: string[]) => void
  maxSelections?: number
  className?: string
}

// =============================================================================
// ICON MAPPING
// =============================================================================

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  code: Code,
  globe: Globe,
  database: Database,
  file: FileText,
  mail: Mail,
  calendar: Calendar,
  message: MessageSquare,
  zap: Zap,
  cloud: Cloud,
  lock: Lock,
  calculator: Calculator,
  image: Image,
  video: Video,
  music: Music,
  location: MapPin,
  cart: ShoppingCart,
  payment: CreditCard,
  users: Users,
  chart: BarChart3,
  settings: Settings,
  webhook: Webhook,
  package: Package,
  sparkles: Sparkles,
}

// =============================================================================
// CATEGORY CONFIG
// =============================================================================

const categoryConfig: Record<ToolCategory, { label: string; color: string }> = {
  communication: { label: "Communication", color: "bg-blue-500" },
  data: { label: "Data", color: "bg-green-500" },
  integration: { label: "Integration", color: "bg-purple-500" },
  productivity: { label: "Productivity", color: "bg-yellow-500" },
  media: { label: "Media", color: "bg-pink-500" },
  commerce: { label: "Commerce", color: "bg-orange-500" },
  analytics: { label: "Analytics", color: "bg-cyan-500" },
  custom: { label: "Custom", color: "bg-gray-500" },
}

// =============================================================================
// TOOL CARD
// =============================================================================

interface ToolCardProps {
  tool: AgentTool
  isSelected: boolean
  onToggle: () => void
  disabled?: boolean
}

function ToolCard({ tool, isSelected, onToggle, disabled }: ToolCardProps) {
  const Icon = iconMap[tool.icon] || Package
  const category = categoryConfig[tool.category]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            className={cn(
              "relative flex flex-col items-center p-4 rounded-lg border-2 transition-all",
              "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50",
              isSelected 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border hover:border-muted-foreground/30",
              disabled && "opacity-50 cursor-not-allowed",
              tool.isDeprecated && "opacity-60"
            )}
            onClick={onToggle}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
          >
            {/* Selection Indicator */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="h-3 w-3 text-primary-foreground" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Badges */}
            <div className="absolute top-1 left-1 flex gap-1">
              {tool.isPremium && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                  Pro
                </Badge>
              )}
              {tool.isNew && (
                <Badge variant="default" className="text-xs px-1 py-0 bg-green-500">
                  New
                </Badge>
              )}
            </div>

            {/* Icon */}
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center mb-2",
              isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <Icon className="h-5 w-5" />
            </div>

            {/* Name */}
            <span className="text-sm font-medium text-center line-clamp-1">
              {tool.name}
            </span>

            {/* Category Dot */}
            <div className={cn(
              "h-1.5 w-1.5 rounded-full mt-1",
              category.color
            )} />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{tool.name}</p>
            <p className="text-xs text-muted-foreground">{tool.description}</p>
            <Badge variant="outline" className="text-xs">
              {category.label}
            </Badge>
            {tool.isDeprecated && (
              <Badge variant="destructive" className="text-xs ml-1">
                Deprecated
              </Badge>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// =============================================================================
// CATEGORY FILTER
// =============================================================================

interface CategoryFilterProps {
  categories: ToolCategory[]
  activeCategory: ToolCategory | 'all'
  onCategoryChange: (category: ToolCategory | 'all') => void
}

function CategoryFilter({ categories, activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={activeCategory === 'all' ? 'default' : 'outline'}
        className="cursor-pointer"
        onClick={() => onCategoryChange('all')}
      >
        All
      </Badge>
      {categories.map(cat => {
        const config = categoryConfig[cat]
        return (
          <Badge
            key={cat}
            variant={activeCategory === cat ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => onCategoryChange(cat)}
          >
            <span className={cn(
              "h-2 w-2 rounded-full mr-1.5",
              config.color
            )} />
            {config.label}
          </Badge>
        )
      })}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BuilderToolSelector({
  tools,
  selectedTools,
  onSelectionChange,
  maxSelections,
  className,
}: BuilderToolSelectorProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState<ToolCategory | 'all'>('all')

  // Get unique categories
  const categories = React.useMemo(() => {
    return [...new Set(tools.map(t => t.category))]
  }, [tools])

  // Filter tools
  const filteredTools = React.useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = searchQuery === '' || 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [tools, searchQuery, activeCategory])

  // Handle toggle
  const handleToggle = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      onSelectionChange(selectedTools.filter(id => id !== toolId))
    } else {
      if (maxSelections && selectedTools.length >= maxSelections) {
        return // Don't add more if at max
      }
      onSelectionChange([...selectedTools, toolId])
    }
  }

  const isAtMax = maxSelections !== undefined && selectedTools.length >= maxSelections

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {maxSelections && (
          <Badge variant="outline" className="self-center">
            {selectedTools.length} / {maxSelections} selected
          </Badge>
        )}
      </div>

      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Tool Grid */}
      <ScrollArea className="h-[320px] pr-4">
        <motion.div 
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredTools.map((tool) => (
              <motion.div
                key={tool.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <ToolCard
                  tool={tool}
                  isSelected={selectedTools.includes(tool.id)}
                  onToggle={() => handleToggle(tool.id)}
                  disabled={isAtMax && !selectedTools.includes(tool.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredTools.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No tools found</p>
            <p className="text-xs text-muted-foreground">Try a different search or category</p>
          </div>
        )}
      </ScrollArea>

      {/* Selected Tools Summary */}
      {selectedTools.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-sm text-muted-foreground">Selected:</span>
          {selectedTools.map(id => {
            const tool = tools.find(t => t.id === id)
            if (!tool) return null
            return (
              <Badge
                key={id}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => handleToggle(id)}
              >
                {tool.name}
                <span className="ml-1 text-muted-foreground">×</span>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default BuilderToolSelector
