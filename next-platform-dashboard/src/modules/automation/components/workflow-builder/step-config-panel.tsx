/**
 * StepConfigPanel Component
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Right panel for configuring the selected workflow step including:
 * - Step name and description
 * - Action-specific settings
 * - Input/output mapping
 * - Error handling configuration
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Info, AlertCircle } from "lucide-react"
import { ACTION_REGISTRY } from "../../lib/action-types"
import type { 
  WorkflowStep, 
  WorkflowStepUpdate, 
  ConditionConfig, 
  DelayConfig 
} from "../../types/automation-types"

// ============================================================================
// TYPES
// ============================================================================

interface StepConfigPanelProps {
  step: WorkflowStep
  onUpdate: (stepId: string, updates: WorkflowStepUpdate) => void
  onClose: () => void
}

// ============================================================================
// CONDITION CONFIG COMPONENT
// ============================================================================

interface ConditionConfigProps {
  config: ConditionConfig
  onUpdate: (config: ConditionConfig) => void
}

function ConditionConfigSection({ config, onUpdate }: ConditionConfigProps) {
  const conditions = config.conditions || []
  const operator = config.operator || 'and'

  const addCondition = () => {
    onUpdate({
      ...config,
      conditions: [...conditions, { field: '', operator: 'equals', value: '' }],
    })
  }

  const updateCondition = (index: number, updates: Record<string, unknown>) => {
    const newConditions = [...conditions]
    newConditions[index] = { ...newConditions[index], ...updates } as typeof conditions[0]
    onUpdate({ ...config, conditions: newConditions })
  }

  const removeCondition = (index: number) => {
    onUpdate({
      ...config,
      conditions: conditions.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Conditions</h4>
        <Select
          value={operator}
          onValueChange={(value) => onUpdate({ ...config, operator: value as 'and' | 'or' })}
        >
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">AND</SelectItem>
            <SelectItem value="or">OR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {conditions.map((cond, index) => (
        <div key={index} className="flex gap-2 items-start">
          <Input
            placeholder="Field ({{trigger.status}})"
            value={cond.field || ''}
            onChange={(e) => updateCondition(index, { field: e.target.value })}
            className="flex-1"
          />
          <Select
            value={cond.operator || 'equals'}
            onValueChange={(value) => updateCondition(index, { operator: value })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equals">equals</SelectItem>
              <SelectItem value="not_equals">not equals</SelectItem>
              <SelectItem value="contains">contains</SelectItem>
              <SelectItem value="not_contains">not contains</SelectItem>
              <SelectItem value="greater_than">&gt;</SelectItem>
              <SelectItem value="less_than">&lt;</SelectItem>
              <SelectItem value="is_empty">is empty</SelectItem>
              <SelectItem value="is_not_empty">is not empty</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Value"
            value={cond.value as string || ''}
            onChange={(e) => updateCondition(index, { value: e.target.value })}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeCondition(index)}
            className="h-9 w-9 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addCondition} className="w-full">
        + Add Condition
      </Button>
    </div>
  )
}

// ============================================================================
// DELAY CONFIG COMPONENT
// ============================================================================

interface DelayConfigProps {
  config: DelayConfig
  onUpdate: (config: DelayConfig) => void
}

function DelayConfigSection({ config, onUpdate }: DelayConfigProps) {
  const delayType = config.type || 'fixed'

  // Parse the value to get number and unit
  const parseValue = (val?: string) => {
    if (!val) return { num: '5', unit: 'm' }
    const match = val.match(/^(\d+)([smhd])$/)
    if (match) return { num: match[1], unit: match[2] }
    return { num: '5', unit: 'm' }
  }

  const { num, unit } = parseValue(config.value)

  return (
    <div className="space-y-4 pt-4 border-t">
      <h4 className="font-medium">Delay Settings</h4>

      <div className="space-y-2">
        <Label>Delay Type</Label>
        <Select
          value={delayType}
          onValueChange={(value) => onUpdate({ ...config, type: value as DelayConfig['type'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Fixed Duration</SelectItem>
            <SelectItem value="until">Until Date/Time</SelectItem>
            <SelectItem value="expression">Dynamic Expression</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {delayType === 'fixed' && (
        <div className="space-y-2">
          <Label>Duration</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              value={num}
              onChange={(e) => {
                onUpdate({ ...config, value: `${e.target.value}${unit}` })
              }}
              className="w-20"
            />
            <Select
              value={unit}
              onValueChange={(newUnit) => {
                onUpdate({ ...config, value: `${num}${newUnit}` })
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="s">Seconds</SelectItem>
                <SelectItem value="m">Minutes</SelectItem>
                <SelectItem value="h">Hours</SelectItem>
                <SelectItem value="d">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {delayType === 'until' && (
        <div className="space-y-2">
          <Label>Wait Until</Label>
          <Input
            type="datetime-local"
            value={config.value || ''}
            onChange={(e) => onUpdate({ ...config, value: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Or use a variable: {"{{trigger.appointment_date}}"}
          </p>
        </div>
      )}

      {delayType === 'expression' && (
        <div className="space-y-2">
          <Label>Expression</Label>
          <Input
            placeholder="{{trigger.scheduled_date - 1d}}"
            value={config.value || ''}
            onChange={(e) => onUpdate({ ...config, value: e.target.value })}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Use date math expressions with trigger data
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// STEP CONFIG PANEL COMPONENT
// ============================================================================

export function StepConfigPanel({ step, onUpdate, onClose }: StepConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(step.action_config || {})
  const [lastStepId, setLastStepId] = useState(step.id)

  // Sync local config when step changes (avoiding setState in effect)
  if (step.id !== lastStepId) {
    setLastStepId(step.id)
    setLocalConfig(step.action_config || {})
  }

  const handleConfigChange = (key: string, value: unknown) => {
    const newConfig = { ...localConfig, [key]: value }
    setLocalConfig(newConfig)
    onUpdate(step.id, { action_config: newConfig })
  }

  // Get action definition from registry
  const getActionDef = (): {
    id: string
    name: string
    description: string
    icon: string
    inputs: Record<string, {
      type: string
      required?: boolean
      default?: unknown
      values?: readonly string[]
      placeholder?: string
    }>
  } | null => {
    if (!step.action_type) return null
    const parts = step.action_type.split('.')
    if (parts.length < 2) return null
    const [category, action] = parts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry = ACTION_REGISTRY as any
    return registry[category]?.[action] ?? null
  }

  const actionDef = getActionDef()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Configure Step</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="settings" className="h-full">
          <TabsList className="w-full justify-start rounded-none border-b px-4">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="mapping">Data Mapping</TabsTrigger>
            <TabsTrigger value="errors">Error Handling</TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="p-4 space-y-4">
            {/* Step Name */}
            <div className="space-y-2">
              <Label>Step Name</Label>
              <Input
                value={step.name || ''}
                onChange={(e) => onUpdate(step.id, { name: e.target.value })}
                placeholder="Give this step a name..."
              />
            </div>

            {/* Step Description */}
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                value={String(step.description || '')}
                onChange={(e) => onUpdate(step.id, { description: e.target.value })}
                placeholder="What does this step do?"
                rows={2}
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Step Enabled</Label>
                <p className="text-xs text-muted-foreground">
                  Disabled steps are skipped during execution
                </p>
              </div>
              <Switch
                checked={step.is_active}
                onCheckedChange={(checked) => onUpdate(step.id, { is_active: checked })}
              />
            </div>

            {/* Action-specific config */}
            {actionDef && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium flex items-center gap-2">
                  {actionDef.icon} {actionDef.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {actionDef.description}
                </p>

                {/* Render inputs based on action definition */}
                {Object.entries(actionDef.inputs || {}).map(
                  ([key, inputConfig]) => {
                    const config = inputConfig
                    
                    return (
                      <div key={key} className="space-y-2">
                        <Label className="flex items-center gap-1">
                          {key.replace(/_/g, ' ')}
                          {config.required && <span className="text-red-500">*</span>}
                        </Label>

                        {config.type === 'string' && (
                          <Input
                            value={(localConfig as Record<string, unknown>)[key] as string || ''}
                            onChange={(e) => handleConfigChange(key, e.target.value)}
                            placeholder={config.placeholder || config.default as string || `Enter ${key}...`}
                          />
                        )}

                        {config.type === 'number' && (
                          <Input
                            type="number"
                            value={(localConfig as Record<string, unknown>)[key] as number ?? config.default as number ?? ''}
                            onChange={(e) => handleConfigChange(key, Number(e.target.value))}
                          />
                        )}

                        {config.type === 'enum' && (
                          <Select
                            value={(localConfig as Record<string, unknown>)[key] as string || ''}
                            onValueChange={(value) => handleConfigChange(key, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${key}...`} />
                            </SelectTrigger>
                            <SelectContent>
                              {config.values?.map((v: string) => (
                                <SelectItem key={v} value={v}>
                                  {v}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {config.type === 'boolean' && (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={(localConfig as Record<string, unknown>)[key] as boolean || false}
                              onCheckedChange={(checked) => handleConfigChange(key, checked)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {(localConfig as Record<string, unknown>)[key] ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        )}

                        {(config.type === 'object' || config.type === 'array') && (
                          <Textarea
                            value={JSON.stringify((localConfig as Record<string, unknown>)[key] || (config.type === 'array' ? [] : {}), null, 2)}
                            onChange={(e) => {
                              try {
                                handleConfigChange(key, JSON.parse(e.target.value))
                              } catch {
                                // Invalid JSON, ignore
                              }
                            }}
                            placeholder={config.type === 'array' ? '[]' : '{}'}
                            rows={4}
                            className="font-mono text-xs"
                          />
                        )}

                        {/* Variable hint */}
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Use {'{{trigger.field}}'} for dynamic values
                        </p>
                      </div>
                    )
                  }
                )}
              </div>
            )}

            {/* Condition step config */}
            {(step.step_type === 'condition' || step.action_type === 'flow.condition') && (
              <ConditionConfigSection
                config={step.condition_config || {}}
                onUpdate={(config) => onUpdate(step.id, { condition_config: config })}
              />
            )}

            {/* Delay step config */}
            {(step.step_type === 'delay' || step.action_type === 'flow.delay') && (
              <DelayConfigSection
                config={step.delay_config || {}}
                onUpdate={(config) => onUpdate(step.id, { delay_config: config })}
              />
            )}
          </TabsContent>

          {/* Data Mapping Tab */}
          <TabsContent value="mapping" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Input Mapping</Label>
              <p className="text-xs text-muted-foreground">
                Map data from trigger or previous steps to this step&apos;s inputs
              </p>
              <Textarea
                value={JSON.stringify(step.input_mapping || {}, null, 2)}
                onChange={(e) => {
                  try {
                    onUpdate(step.id, { input_mapping: JSON.parse(e.target.value) })
                  } catch {
                    // Invalid JSON
                  }
                }}
                placeholder='{"email": "{{trigger.email}}"}'
                rows={6}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label>Output Key</Label>
              <p className="text-xs text-muted-foreground">
                Store this step&apos;s output for use in later steps
              </p>
              <Input
                value={step.output_key || ''}
                onChange={(e) => onUpdate(step.id, { output_key: e.target.value })}
                placeholder="step_1_result"
              />
            </div>

            <div className="p-3 bg-muted rounded-md space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Available Variables
              </h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><code className="bg-background px-1 rounded">{'{{trigger.*}}'}</code> - Trigger event data</p>
                <p><code className="bg-background px-1 rounded">{'{{steps.StepName.*}}'}</code> - Previous step outputs</p>
                <p><code className="bg-background px-1 rounded">{'{{variables.*}}'}</code> - Workflow variables</p>
                <p><code className="bg-background px-1 rounded">{'{{now}}'}</code> - Current timestamp</p>
              </div>
            </div>
          </TabsContent>

          {/* Error Handling Tab */}
          <TabsContent value="errors" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>On Error</Label>
              <Select
                value={step.on_error || 'fail'}
                onValueChange={(value) => onUpdate(step.id, { on_error: value as WorkflowStep['on_error'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fail">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Stop workflow
                    </div>
                  </SelectItem>
                  <SelectItem value="continue">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">⏩</span>
                      Continue to next step
                    </div>
                  </SelectItem>
                  <SelectItem value="retry">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500">🔄</span>
                      Retry step
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {step.on_error === 'retry' && (
              <>
                <div className="space-y-2">
                  <Label>Max Retries</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={step.max_retries || 3}
                    onChange={(e) => onUpdate(step.id, { max_retries: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Retry Delay (seconds)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={step.retry_delay_seconds || 60}
                    onChange={(e) =>
                      onUpdate(step.id, { retry_delay_seconds: Number(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Wait time between retry attempts
                  </p>
                </div>
              </>
            )}

            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Error Handling Tips
              </h4>
              <ul className="text-xs text-amber-700 dark:text-amber-300 mt-2 space-y-1 list-disc list-inside">
                <li>Use &quot;Continue&quot; for non-critical steps like logging</li>
                <li>Use &quot;Retry&quot; for external API calls that may fail temporarily</li>
                <li>Use &quot;Stop&quot; for critical steps where failure means the workflow should abort</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
