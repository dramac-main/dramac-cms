"use client"

/**
 * Builder Preview Panel Component
 * 
 * PHASE-UI-13B: AI Agent Builder UI Enhancement
 * Live agent preview card showing current configuration
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Bot,
  Clock,
  Zap,
  Settings,
  Package,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// =============================================================================
// TYPES
// =============================================================================

export interface AgentPreviewData {
  name: string
  description?: string
  icon?: string
  template?: string
  llmProvider?: string
  model?: string
  tools: string[]
  triggers: {
    type: string
    enabled: boolean
  }[]
  settings: {
    maxTokens?: number
    temperature?: number
    timeout?: number
    retries?: number
  }
  permissions?: string[]
  isPublic?: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationWarning {
  field: string
  message: string
}

export interface BuilderPreviewPanelProps {
  data: AgentPreviewData
  validation?: ValidationResult
  className?: string
  sticky?: boolean
}

// =============================================================================
// PREVIEW HEADER
// =============================================================================

interface PreviewHeaderProps {
  name: string
  description?: string
  icon?: string
  isPublic?: boolean
}

function PreviewHeader({ name, description, icon, isPublic }: PreviewHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
        {icon ? (
          <span className="text-2xl">{icon}</span>
        ) : (
          <Bot className="h-6 w-6 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">
            {name || "Untitled Agent"}
          </h3>
          {isPublic ? (
            <Globe className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description || "No description provided"}
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// PREVIEW SECTION
// =============================================================================

interface PreviewSectionProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  defaultOpen?: boolean
}

function PreviewSection({ title, icon: Icon, children, defaultOpen = true }: PreviewSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:text-primary transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </motion.div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pb-3">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// =============================================================================
// VALIDATION STATUS
// =============================================================================

interface ValidationStatusProps {
  validation: ValidationResult
}

function ValidationStatus({ validation }: ValidationStatusProps) {
  if (validation.isValid && validation.warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm">Configuration valid</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {validation.errors.map((error, i) => (
        <div key={i} className="flex items-start gap-2 text-red-600 dark:text-red-400">
          <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="font-medium">{error.field}:</span> {error.message}
          </div>
        </div>
      ))}
      {validation.warnings.map((warning, i) => (
        <div key={i} className="flex items-start gap-2 text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="font-medium">{warning.field}:</span> {warning.message}
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BuilderPreviewPanel({
  data,
  validation,
  className,
  sticky = true,
}: BuilderPreviewPanelProps) {
  const enabledTriggers = data.triggers.filter(t => t.enabled)

  return (
    <Card className={cn(
      "overflow-hidden",
      sticky && "sticky top-4",
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)] max-h-[600px]">
          <div className="px-6 pb-6 space-y-4">
            {/* Agent Header */}
            <PreviewHeader
              name={data.name}
              description={data.description}
              icon={data.icon}
              isPublic={data.isPublic}
            />

            <Separator />

            {/* Validation Status */}
            {validation && (
              <>
                <PreviewSection title="Status" icon={CheckCircle2}>
                  <ValidationStatus validation={validation} />
                </PreviewSection>
                <Separator />
              </>
            )}

            {/* Model Configuration */}
            <PreviewSection title="AI Model" icon={Sparkles}>
              <div className="space-y-2">
                {data.template && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Template</span>
                    <Badge variant="secondary">{data.template}</Badge>
                  </div>
                )}
                {data.llmProvider && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-medium">{data.llmProvider}</span>
                  </div>
                )}
                {data.model && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Model</span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {data.model}
                    </code>
                  </div>
                )}
              </div>
            </PreviewSection>

            <Separator />

            {/* Tools */}
            <PreviewSection title={`Tools (${data.tools.length})`} icon={Package}>
              {data.tools.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.tools.map((tool, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tools selected</p>
              )}
            </PreviewSection>

            <Separator />

            {/* Triggers */}
            <PreviewSection title={`Triggers (${enabledTriggers.length})`} icon={Zap}>
              {enabledTriggers.length > 0 ? (
                <div className="space-y-2">
                  {enabledTriggers.map((trigger, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm capitalize">{trigger.type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No triggers configured</p>
              )}
            </PreviewSection>

            <Separator />

            {/* Settings */}
            <PreviewSection title="Settings" icon={Settings} defaultOpen={false}>
              <div className="space-y-2 text-sm">
                {data.settings.maxTokens && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Max Tokens</span>
                    <span>{data.settings.maxTokens.toLocaleString()}</span>
                  </div>
                )}
                {data.settings.temperature !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Temperature</span>
                    <span>{data.settings.temperature}</span>
                  </div>
                )}
                {data.settings.timeout && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Timeout</span>
                    <span>{data.settings.timeout}s</span>
                  </div>
                )}
                {data.settings.retries && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Retries</span>
                    <span>{data.settings.retries}</span>
                  </div>
                )}
              </div>
            </PreviewSection>

            {/* Permissions */}
            {data.permissions && data.permissions.length > 0 && (
              <>
                <Separator />
                <PreviewSection title="Permissions" icon={Lock} defaultOpen={false}>
                  <div className="flex flex-wrap gap-1.5">
                    {data.permissions.map((perm, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </PreviewSection>
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// COMPACT PREVIEW
// =============================================================================

export interface CompactPreviewProps {
  data: AgentPreviewData
  className?: string
  onClick?: () => void
}

export function CompactPreview({ data, className, onClick }: CompactPreviewProps) {
  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer",
        "hover:bg-muted/50 transition-colors",
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
        {data.icon ? (
          <span className="text-lg">{data.icon}</span>
        ) : (
          <Bot className="h-5 w-5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{data.name || "Untitled Agent"}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{data.tools.length} tools</span>
          <span>•</span>
          <span>{data.triggers.filter(t => t.enabled).length} triggers</span>
        </div>
      </div>
    </motion.div>
  )
}

export default BuilderPreviewPanel
