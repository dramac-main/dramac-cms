"use client"

/**
 * Enhanced Agent Builder Component
 * 
 * PHASE-UI-13B: AI Agent Builder UI Enhancement
 * Multi-step wizard with live preview and test console
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Bot, 
  Sparkles, 
  Package, 
  Zap, 
  Settings, 
  Play,
  ChevronRight,
  ChevronLeft,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// UI Components
import {
  BuilderHeader,
  BuilderStepCard,
  BuilderStepProgress,
  BuilderToolSelector,
  BuilderTriggerConfig,
  BuilderPreviewPanel,
  BuilderTestConsole,
  type BuilderStep,
  type AgentTool,
  type TriggerConfig,
  type AgentPreviewData,
  type ValidationResult,
  type TestInput,
  type TestOutput,
  type SaveStatus,
} from './ui'

// =============================================================================
// TYPES
// =============================================================================

export interface AIAgentTemplate {
  id: string
  name: string
  description: string
  icon?: string
  systemPrompt?: string
  category?: string
}

export interface AgentBuilderData {
  id?: string
  name: string
  description: string
  icon: string
  templateId?: string
  llmProvider: string
  model: string
  tools: string[]
  triggers: TriggerConfig[]
  settings: {
    maxTokens: number
    temperature: number
    timeout: number
    retries: number
    systemPrompt: string
  }
  isPublic: boolean
}

export interface AgentBuilderEnhancedProps {
  initialData?: Partial<AgentBuilderData>
  templates: AIAgentTemplate[]
  availableTools: AgentTool[]
  llmProviders: { id: string; name: string; models: string[] }[]
  onSave: (data: AgentBuilderData) => Promise<void>
  onBack: () => void
  onTest?: (data: AgentBuilderData, input: TestInput) => Promise<TestOutput>
  className?: string
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const defaultAgentData: AgentBuilderData = {
  name: '',
  description: '',
  icon: '🤖',
  llmProvider: 'openai',
  model: 'gpt-4-turbo-preview',
  tools: [],
  triggers: [],
  settings: {
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 30,
    retries: 3,
    systemPrompt: '',
  },
  isPublic: false,
}

// =============================================================================
// STEP DEFINITIONS
// =============================================================================

const STEP_IDS = {
  BASICS: 'basics',
  MODEL: 'model',
  TOOLS: 'tools',
  TRIGGERS: 'triggers',
  SETTINGS: 'settings',
} as const

const steps: Omit<BuilderStep, 'status'>[] = [
  {
    id: STEP_IDS.BASICS,
    number: 1,
    title: 'Basic Info',
    description: 'Name, description, and template',
  },
  {
    id: STEP_IDS.MODEL,
    number: 2,
    title: 'AI Model',
    description: 'Choose LLM provider and model',
  },
  {
    id: STEP_IDS.TOOLS,
    number: 3,
    title: 'Tools',
    description: 'Select agent capabilities',
    isOptional: true,
  },
  {
    id: STEP_IDS.TRIGGERS,
    number: 4,
    title: 'Triggers',
    description: 'Configure how agent activates',
    isOptional: true,
  },
  {
    id: STEP_IDS.SETTINGS,
    number: 5,
    title: 'Settings',
    description: 'Advanced configuration',
    isOptional: true,
  },
]

// =============================================================================
// ICON PICKER
// =============================================================================

const iconOptions = [
  '🤖', '🧠', '💡', '⚡', '🔮', '🎯', '📊', '💬',
  '📝', '🔍', '🛠️', '🚀', '✨', '🎨', '📧', '🔔',
]

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {iconOptions.map((icon) => (
        <button
          key={icon}
          type="button"
          className={cn(
            "h-10 w-10 rounded-lg border-2 flex items-center justify-center text-xl transition-all",
            value === icon
              ? "border-primary bg-primary/10"
              : "border-border hover:border-muted-foreground/50"
          )}
          onClick={() => onChange(icon)}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}

// =============================================================================
// STEP CONTENT COMPONENTS
// =============================================================================

interface StepBasicsProps {
  data: AgentBuilderData
  onChange: (data: Partial<AgentBuilderData>) => void
  templates: AIAgentTemplate[]
}

function StepBasics({ data, onChange, templates }: StepBasicsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Agent Name *</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="My AI Agent"
          className="max-w-md"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe what this agent does..."
          className="max-w-md min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Icon</Label>
        <IconPicker
          value={data.icon}
          onChange={(icon) => onChange({ icon })}
        />
      </div>

      {templates.length > 0 && (
        <div className="space-y-2">
          <Label>Template (Optional)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            {templates.slice(0, 6).map((template) => (
              <Card
                key={template.id}
                className={cn(
                  "cursor-pointer transition-all",
                  data.templateId === template.id
                    ? "ring-2 ring-primary"
                    : "hover:bg-muted/50"
                )}
                onClick={() => onChange({ 
                  templateId: template.id,
                  settings: {
                    ...data.settings,
                    systemPrompt: template.systemPrompt || data.settings.systemPrompt,
                  }
                })}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{template.icon || '📋'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface StepModelProps {
  data: AgentBuilderData
  onChange: (data: Partial<AgentBuilderData>) => void
  providers: { id: string; name: string; models: string[] }[]
}

function StepModel({ data, onChange, providers }: StepModelProps) {
  const currentProvider = providers.find(p => p.id === data.llmProvider)
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>LLM Provider</Label>
        <Select
          value={data.llmProvider}
          onValueChange={(value) => {
            const provider = providers.find(p => p.id === value)
            onChange({ 
              llmProvider: value,
              model: provider?.models[0] || ''
            })
          }}
        >
          <SelectTrigger className="max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Model</Label>
        <Select
          value={data.model}
          onValueChange={(value) => onChange({ model: value })}
        >
          <SelectTrigger className="max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currentProvider?.models.map((model) => (
              <SelectItem key={model} value={model}>
                <code className="text-sm">{model}</code>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="systemPrompt">System Prompt</Label>
        <Textarea
          id="systemPrompt"
          value={data.settings.systemPrompt}
          onChange={(e) => onChange({ 
            settings: { ...data.settings, systemPrompt: e.target.value }
          })}
          placeholder="You are a helpful AI assistant..."
          className="max-w-2xl min-h-[120px] font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Define the agent&apos;s behavior and personality
        </p>
      </div>
    </div>
  )
}

interface StepToolsProps {
  data: AgentBuilderData
  onChange: (data: Partial<AgentBuilderData>) => void
  availableTools: AgentTool[]
}

function StepTools({ data, onChange, availableTools }: StepToolsProps) {
  return (
    <BuilderToolSelector
      tools={availableTools}
      selectedTools={data.tools}
      onSelectionChange={(tools) => onChange({ tools })}
      maxSelections={10}
    />
  )
}

interface StepTriggersProps {
  data: AgentBuilderData
  onChange: (data: Partial<AgentBuilderData>) => void
}

function StepTriggers({ data, onChange }: StepTriggersProps) {
  return (
    <BuilderTriggerConfig
      triggers={data.triggers}
      onTriggersChange={(triggers) => onChange({ triggers })}
      allowMultiple
    />
  )
}

interface StepSettingsProps {
  data: AgentBuilderData
  onChange: (data: Partial<AgentBuilderData>) => void
}

function StepSettings({ data, onChange }: StepSettingsProps) {
  const updateSettings = (updates: Partial<AgentBuilderData['settings']>) => {
    onChange({ settings: { ...data.settings, ...updates } })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Max Tokens</Label>
            <span className="text-sm text-muted-foreground">
              {data.settings.maxTokens.toLocaleString()}
            </span>
          </div>
          <Slider
            value={[data.settings.maxTokens]}
            onValueChange={([value]) => updateSettings({ maxTokens: value })}
            min={256}
            max={16384}
            step={256}
            className="max-w-md"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Temperature</Label>
            <span className="text-sm text-muted-foreground">
              {data.settings.temperature}
            </span>
          </div>
          <Slider
            value={[data.settings.temperature]}
            onValueChange={([value]) => updateSettings({ temperature: value })}
            min={0}
            max={2}
            step={0.1}
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">
            Lower = more focused, Higher = more creative
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="timeout">Timeout (seconds)</Label>
            <Input
              id="timeout"
              type="number"
              value={data.settings.timeout}
              onChange={(e) => updateSettings({ timeout: parseInt(e.target.value) || 30 })}
              min={5}
              max={300}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retries">Max Retries</Label>
            <Input
              id="retries"
              type="number"
              value={data.settings.retries}
              onChange={(e) => updateSettings({ retries: parseInt(e.target.value) || 0 })}
              min={0}
              max={5}
            />
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between max-w-md">
          <div>
            <Label>Public Agent</Label>
            <p className="text-xs text-muted-foreground">
              Allow other users to discover and use this agent
            </p>
          </div>
          <Switch
            checked={data.isPublic}
            onCheckedChange={(isPublic) => onChange({ isPublic })}
          />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AgentBuilderEnhanced({
  initialData,
  templates,
  availableTools,
  llmProviders,
  onSave,
  onBack,
  onTest,
  className,
}: AgentBuilderEnhancedProps) {
  const [data, setData] = React.useState<AgentBuilderData>({
    ...defaultAgentData,
    ...initialData,
  })
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('idle')
  const [isDirty, setIsDirty] = React.useState(false)
  const [lastSaved, setLastSaved] = React.useState<Date | undefined>()
  const [showTestConsole, setShowTestConsole] = React.useState(false)

  const isNew = !initialData?.id

  // Build steps with status
  const stepsWithStatus: BuilderStep[] = steps.map((step, index) => ({
    ...step,
    status: index < currentStepIndex 
      ? 'completed' 
      : index === currentStepIndex 
        ? 'active' 
        : 'pending',
  }))

  // Validation
  const validation: ValidationResult = React.useMemo(() => {
    const errors: { field: string; message: string }[] = []
    const warnings: { field: string; message: string }[] = []

    if (!data.name.trim()) {
      errors.push({ field: 'Name', message: 'Agent name is required' })
    }
    if (!data.llmProvider) {
      errors.push({ field: 'Provider', message: 'LLM provider is required' })
    }
    if (!data.model) {
      errors.push({ field: 'Model', message: 'Model is required' })
    }
    if (data.tools.length === 0) {
      warnings.push({ field: 'Tools', message: 'No tools selected' })
    }
    if (data.triggers.length === 0) {
      warnings.push({ field: 'Triggers', message: 'No triggers configured' })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }, [data])

  // Preview data
  const previewData: AgentPreviewData = {
    name: data.name,
    description: data.description,
    icon: data.icon,
    template: templates.find(t => t.id === data.templateId)?.name,
    llmProvider: llmProviders.find(p => p.id === data.llmProvider)?.name,
    model: data.model,
    tools: data.tools,
    triggers: data.triggers.map(t => ({ type: t.type, enabled: t.enabled })),
    settings: data.settings,
    isPublic: data.isPublic,
  }

  // Handle data changes
  const handleChange = (updates: Partial<AgentBuilderData>) => {
    setData(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }

  // Handle save
  const handleSave = async () => {
    if (!validation.isValid) return

    setSaveStatus('saving')
    try {
      await onSave(data)
      setSaveStatus('saved')
      setIsDirty(false)
      setLastSaved(new Date())
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  // Handle test
  const handleTest = async (input: TestInput): Promise<TestOutput> => {
    if (onTest) {
      return onTest(data, input)
    }
    // Mock test output
    return {
      timestamp: new Date(),
      status: 'success',
      duration: 1234,
      tokensUsed: 150,
      response: 'This is a test response from the agent.',
    }
  }

  // Navigation
  const canGoNext = currentStepIndex < steps.length - 1
  const canGoPrev = currentStepIndex > 0

  const goNext = () => {
    if (canGoNext) setCurrentStepIndex(prev => prev + 1)
  }

  const goPrev = () => {
    if (canGoPrev) setCurrentStepIndex(prev => prev - 1)
  }

  // Render step content
  const renderStepContent = () => {
    switch (steps[currentStepIndex].id) {
      case STEP_IDS.BASICS:
        return <StepBasics data={data} onChange={handleChange} templates={templates} />
      case STEP_IDS.MODEL:
        return <StepModel data={data} onChange={handleChange} providers={llmProviders} />
      case STEP_IDS.TOOLS:
        return <StepTools data={data} onChange={handleChange} availableTools={availableTools} />
      case STEP_IDS.TRIGGERS:
        return <StepTriggers data={data} onChange={handleChange} />
      case STEP_IDS.SETTINGS:
        return <StepSettings data={data} onChange={handleChange} />
      default:
        return null
    }
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Header */}
      <BuilderHeader
        agentName={data.name}
        onNameChange={(name) => handleChange({ name })}
        onBack={onBack}
        onSave={handleSave}
        onTest={() => setShowTestConsole(true)}
        saveStatus={saveStatus}
        isDirty={isDirty}
        isNew={isNew}
        lastSaved={lastSaved}
      >
        <BuilderStepProgress
          steps={stepsWithStatus}
          currentStep={currentStepIndex + 1}
          onStepClick={(stepId) => {
            const index = steps.findIndex(s => s.id === stepId)
            if (index !== -1 && index <= currentStepIndex) {
              setCurrentStepIndex(index)
            }
          }}
        />
      </BuilderHeader>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Steps */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <BuilderStepCard step={stepsWithStatus[currentStepIndex]} defaultOpen>
                  {renderStepContent()}
                </BuilderStepCard>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={goPrev}
                disabled={!canGoPrev}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
              </div>

              {canGoNext ? (
                <Button onClick={goNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={!validation.isValid}>
                  <Check className="h-4 w-4 mr-2" />
                  {isNew ? 'Create Agent' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="hidden lg:block">
            <BuilderPreviewPanel
              data={previewData}
              validation={validation}
              sticky
            />
          </div>
        </div>
      </div>

      {/* Test Console (Slide-over) */}
      <AnimatePresence>
        {showTestConsole && (
          <motion.div
            className="fixed inset-0 z-50 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowTestConsole(false)}
            />
            
            {/* Panel */}
            <motion.div
              className="relative w-full max-w-lg bg-background shadow-xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="h-full overflow-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Test Console</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTestConsole(false)}
                  >
                    Close
                  </Button>
                </div>
                <BuilderTestConsole
                  onRun={handleTest}
                  defaultInput="Hello, can you help me?"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AgentBuilderEnhanced
