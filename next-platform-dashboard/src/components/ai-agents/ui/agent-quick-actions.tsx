"use client"

/**
 * Agent Quick Actions Component
 * 
 * PHASE-UI-13A: AI Agents Dashboard UI Enhancement
 * Quick action buttons for common agent operations
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Plus, 
  Store, 
  Upload, 
  Download, 
  Clock,
  Zap,
  Bot,
  Sparkles,
  ArrowRight,
  History
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// =============================================================================
// TYPES
// =============================================================================

export interface QuickAction {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description?: string
  variant?: 'default' | 'primary' | 'secondary' | 'outline'
  onClick: () => void
}

export interface RecentAgent {
  id: string
  name: string
  icon?: string
  lastUsed: string
}

export interface AgentQuickActionsProps {
  className?: string
  onCreateAgent?: () => void
  onBrowseMarketplace?: () => void
  onImportAgent?: () => void
  onExportAgents?: () => void
  recentAgents?: RecentAgent[]
  onAgentClick?: (agentId: string) => void
  customActions?: QuickAction[]
  loading?: boolean
}

// =============================================================================
// ACTION BUTTON
// =============================================================================

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description?: string
  variant?: 'default' | 'primary' | 'secondary' | 'outline'
  onClick: () => void
  index: number
}

function ActionButton({ 
  icon: Icon, 
  label, 
  description, 
  variant = 'outline', 
  onClick,
  index 
}: ActionButtonProps) {
  const buttonVariants = {
    default: "bg-background hover:bg-muted border",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  }

  return (
    <motion.button
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-lg transition-colors text-center w-full",
        buttonVariants[variant]
      )}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="h-6 w-6" />
      <div>
        <p className="font-medium text-sm">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </motion.button>
  )
}

// =============================================================================
// RECENT AGENT ITEM
// =============================================================================

interface RecentAgentItemProps {
  agent: RecentAgent
  onClick: () => void
  index: number
}

function RecentAgentItem({ agent, onClick, index }: RecentAgentItemProps) {
  return (
    <motion.button
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted w-full text-left transition-colors group"
      onClick={onClick}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="text-2xl">
        {agent.icon || '🤖'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{agent.name}</p>
        <p className="text-xs text-muted-foreground">
          <Clock className="h-3 w-3 inline mr-1" />
          {agent.lastUsed}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

function QuickActionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AgentQuickActions({
  className,
  onCreateAgent,
  onBrowseMarketplace,
  onImportAgent,
  onExportAgents,
  recentAgents = [],
  onAgentClick,
  customActions = [],
  loading = false,
}: AgentQuickActionsProps) {
  const defaultActions: QuickAction[] = [
    ...(onCreateAgent ? [{
      id: 'create',
      icon: Plus,
      label: 'Create Agent',
      description: 'Build from scratch',
      variant: 'primary' as const,
      onClick: onCreateAgent,
    }] : []),
    ...(onBrowseMarketplace ? [{
      id: 'marketplace',
      icon: Store,
      label: 'Marketplace',
      description: 'Browse templates',
      variant: 'outline' as const,
      onClick: onBrowseMarketplace,
    }] : []),
    ...(onImportAgent ? [{
      id: 'import',
      icon: Upload,
      label: 'Import',
      description: 'Import config',
      variant: 'outline' as const,
      onClick: onImportAgent,
    }] : []),
    ...(onExportAgents ? [{
      id: 'export',
      icon: Download,
      label: 'Export',
      description: 'Export all',
      variant: 'outline' as const,
      onClick: onExportAgents,
    }] : []),
  ]

  const allActions = [...defaultActions, ...customActions]

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuickActionsSkeleton />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Action Grid */}
        {allActions.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {allActions.map((action, index) => (
              <ActionButton
                key={action.id}
                icon={action.icon}
                label={action.label}
                description={action.description}
                variant={action.variant}
                onClick={action.onClick}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Recent Agents */}
        {recentAgents.length > 0 && onAgentClick && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <History className="h-4 w-4" />
                Recent Agents
              </h4>
            </div>
            <div className="space-y-1">
              {recentAgents.slice(0, 5).map((agent, index) => (
                <RecentAgentItem
                  key={agent.id}
                  agent={agent}
                  onClick={() => onAgentClick(agent.id)}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {allActions.length === 0 && recentAgents.length === 0 && (
          <div className="text-center py-6">
            <Bot className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No actions available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// COMPACT VARIANT
// =============================================================================

export function AgentQuickActionsCompact({
  onCreateAgent,
  onBrowseMarketplace,
  className,
}: Pick<AgentQuickActionsProps, 'onCreateAgent' | 'onBrowseMarketplace' | 'className'>) {
  return (
    <div className={cn("flex gap-2", className)}>
      {onCreateAgent && (
        <Button onClick={onCreateAgent} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Agent
        </Button>
      )}
      {onBrowseMarketplace && (
        <Button variant="outline" onClick={onBrowseMarketplace} className="gap-2">
          <Store className="h-4 w-4" />
          Marketplace
        </Button>
      )}
    </div>
  )
}

export default AgentQuickActions
