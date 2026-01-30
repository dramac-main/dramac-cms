"use client"

/**
 * Builder Trigger Config Component
 * 
 * PHASE-UI-13B: AI Agent Builder UI Enhancement
 * Visual trigger type configuration for agent activation
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Clock,
  Zap,
  Calendar,
  MessageSquare,
  Globe,
  Database,
  Webhook,
  Bell,
  Mail,
  FileText,
  Play,
  Settings,
  Plus,
  Trash2,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

// =============================================================================
// TYPES
// =============================================================================

export type TriggerType = 
  | 'manual'
  | 'schedule'
  | 'webhook'
  | 'event'
  | 'message'
  | 'api'

export interface ScheduleSettings {
  frequency: 'minute' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'cron'
  interval?: number
  cronExpression?: string
  timezone?: string
  daysOfWeek?: number[]
  timeOfDay?: string
  [key: string]: unknown
}

export interface WebhookSettings {
  url?: string
  secret?: string
  headers?: Record<string, string>
  [key: string]: unknown
}

export interface EventSettings {
  eventType: string
  filters?: Record<string, unknown>
  [key: string]: unknown
}

export type TriggerSettings = ScheduleSettings | WebhookSettings | EventSettings | Record<string, unknown>

export interface TriggerConfig {
  id: string
  type: TriggerType
  enabled: boolean
  settings: TriggerSettings
}

export interface BuilderTriggerConfigProps {
  triggers: TriggerConfig[]
  onTriggersChange: (triggers: TriggerConfig[]) => void
  allowMultiple?: boolean
  className?: string
}

// =============================================================================
// TRIGGER TYPE CONFIG
// =============================================================================

const triggerTypeConfig: Record<TriggerType, {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  color: string
}> = {
  manual: {
    icon: Play,
    label: "Manual",
    description: "Run manually via button or API call",
    color: "bg-blue-500",
  },
  schedule: {
    icon: Clock,
    label: "Schedule",
    description: "Run on a recurring schedule",
    color: "bg-purple-500",
  },
  webhook: {
    icon: Webhook,
    label: "Webhook",
    description: "Trigger via incoming webhook",
    color: "bg-green-500",
  },
  event: {
    icon: Zap,
    label: "Event",
    description: "React to system or custom events",
    color: "bg-yellow-500",
  },
  message: {
    icon: MessageSquare,
    label: "Message",
    description: "Respond to chat messages",
    color: "bg-pink-500",
  },
  api: {
    icon: Globe,
    label: "API",
    description: "Expose as API endpoint",
    color: "bg-cyan-500",
  },
}

// =============================================================================
// TRIGGER TYPE SELECTOR
// =============================================================================

interface TriggerTypeSelectorProps {
  onSelect: (type: TriggerType) => void
  disabledTypes?: TriggerType[]
}

function TriggerTypeSelector({ onSelect, disabledTypes = [] }: TriggerTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {(Object.keys(triggerTypeConfig) as TriggerType[]).map(type => {
        const config = triggerTypeConfig[type]
        const Icon = config.icon
        const isDisabled = disabledTypes.includes(type)

        return (
          <motion.button
            key={type}
            className={cn(
              "flex flex-col items-center p-4 rounded-lg border-2 transition-all",
              "hover:border-primary/50 hover:shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !isDisabled && onSelect(type)}
            whileHover={{ scale: isDisabled ? 1 : 1.02 }}
            whileTap={{ scale: isDisabled ? 1 : 0.98 }}
            disabled={isDisabled}
          >
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center mb-2 text-white",
              config.color
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="font-medium text-sm">{config.label}</span>
            <span className="text-xs text-muted-foreground text-center mt-1">
              {config.description}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

// =============================================================================
// SCHEDULE CONFIG
// =============================================================================

interface ScheduleConfigProps {
  settings: ScheduleSettings
  onChange: (settings: ScheduleSettings) => void
}

function ScheduleConfig({ settings, onChange }: ScheduleConfigProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select
            value={settings.frequency}
            onValueChange={(value) => onChange({ ...settings, frequency: value as ScheduleSettings['frequency'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minute">Every Minute</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="cron">Custom (Cron)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {settings.frequency !== 'cron' && settings.frequency !== 'minute' && (
          <div className="space-y-2">
            <Label>Interval</Label>
            <Input
              type="number"
              min={1}
              value={settings.interval || 1}
              onChange={(e) => onChange({ ...settings, interval: parseInt(e.target.value) || 1 })}
            />
          </div>
        )}
      </div>

      {settings.frequency === 'cron' && (
        <div className="space-y-2">
          <Label>Cron Expression</Label>
          <Input
            placeholder="0 * * * *"
            value={settings.cronExpression || ''}
            onChange={(e) => onChange({ ...settings, cronExpression: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Example: &quot;0 9 * * 1-5&quot; (9 AM weekdays)
          </p>
        </div>
      )}

      {(settings.frequency === 'daily' || settings.frequency === 'weekly') && (
        <div className="space-y-2">
          <Label>Time of Day</Label>
          <Input
            type="time"
            value={settings.timeOfDay || '09:00'}
            onChange={(e) => onChange({ ...settings, timeOfDay: e.target.value })}
          />
        </div>
      )}

      {settings.frequency === 'weekly' && (
        <div className="space-y-2">
          <Label>Days of Week</Label>
          <div className="flex gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <Button
                key={i}
                variant={settings.daysOfWeek?.includes(i) ? 'default' : 'outline'}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => {
                  const days = settings.daysOfWeek || []
                  const newDays = days.includes(i)
                    ? days.filter(d => d !== i)
                    : [...days, i]
                  onChange({ ...settings, daysOfWeek: newDays })
                }}
              >
                {day}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// WEBHOOK CONFIG
// =============================================================================

interface WebhookConfigProps {
  settings: WebhookSettings
  onChange: (settings: WebhookSettings) => void
}

function WebhookConfig({ settings, onChange }: WebhookConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Webhook URL</Label>
        <div className="flex gap-2">
          <Input
            value={settings.url || ''}
            readOnly
            placeholder="Generated after save"
            className="font-mono text-xs"
          />
          <Button variant="outline" size="sm">Copy</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Send POST requests to this URL to trigger the agent
        </p>
      </div>

      <div className="space-y-2">
        <Label>Secret (Optional)</Label>
        <Input
          type="password"
          value={settings.secret || ''}
          onChange={(e) => onChange({ ...settings, secret: e.target.value })}
          placeholder="Enter webhook secret"
        />
        <p className="text-xs text-muted-foreground">
          Used to verify incoming webhook requests
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// EVENT CONFIG
// =============================================================================

interface EventConfigProps {
  settings: EventSettings
  onChange: (settings: EventSettings) => void
}

function EventConfig({ settings, onChange }: EventConfigProps) {
  const eventTypes = [
    { value: 'page.created', label: 'Page Created' },
    { value: 'page.updated', label: 'Page Updated' },
    { value: 'page.deleted', label: 'Page Deleted' },
    { value: 'user.signup', label: 'User Signup' },
    { value: 'form.submitted', label: 'Form Submitted' },
    { value: 'order.placed', label: 'Order Placed' },
    { value: 'booking.created', label: 'Booking Created' },
    { value: 'custom', label: 'Custom Event' },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Event Type</Label>
        <Select
          value={settings.eventType}
          onValueChange={(value) => onChange({ ...settings, eventType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            {eventTypes.map(event => (
              <SelectItem key={event.value} value={event.value}>
                {event.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {settings.eventType === 'custom' && (
        <div className="space-y-2">
          <Label>Custom Event Name</Label>
          <Input
            placeholder="my.custom.event"
            value={(settings.filters as Record<string, string>)?.customEventName || ''}
            onChange={(e) => onChange({
              ...settings,
              filters: { ...settings.filters, customEventName: e.target.value }
            })}
          />
        </div>
      )}
    </div>
  )
}

// =============================================================================
// TRIGGER CARD
// =============================================================================

interface TriggerCardProps {
  trigger: TriggerConfig
  onChange: (trigger: TriggerConfig) => void
  onRemove: () => void
}

function TriggerCard({ trigger, onChange, onRemove }: TriggerCardProps) {
  const config = triggerTypeConfig[trigger.type]
  const Icon = config.icon

  const renderSettings = () => {
    switch (trigger.type) {
      case 'schedule':
        return (
          <ScheduleConfig
            settings={trigger.settings as ScheduleSettings}
            onChange={(settings) => onChange({ ...trigger, settings })}
          />
        )
      case 'webhook':
        return (
          <WebhookConfig
            settings={trigger.settings as WebhookSettings}
            onChange={(settings) => onChange({ ...trigger, settings })}
          />
        )
      case 'event':
        return (
          <EventConfig
            settings={trigger.settings as EventSettings}
            onChange={(settings) => onChange({ ...trigger, settings })}
          />
        )
      case 'manual':
      case 'api':
      case 'message':
        return (
          <p className="text-sm text-muted-foreground">
            No additional configuration required.
          </p>
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center text-white",
              config.color
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-medium">{config.label} Trigger</h4>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`trigger-${trigger.id}`} className="text-xs">
                {trigger.enabled ? 'Enabled' : 'Disabled'}
              </Label>
              <Switch
                id={`trigger-${trigger.id}`}
                checked={trigger.enabled}
                onCheckedChange={(enabled) => onChange({ ...trigger, enabled })}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator className="mb-4" />

        {renderSettings()}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BuilderTriggerConfig({
  triggers,
  onTriggersChange,
  allowMultiple = true,
  className,
}: BuilderTriggerConfigProps) {
  const [showSelector, setShowSelector] = React.useState(triggers.length === 0)

  const handleAddTrigger = (type: TriggerType) => {
    const newTrigger: TriggerConfig = {
      id: `trigger-${Date.now()}`,
      type,
      enabled: true,
      settings: getDefaultSettings(type),
    }
    onTriggersChange([...triggers, newTrigger])
    setShowSelector(false)
  }

  const handleUpdateTrigger = (index: number, trigger: TriggerConfig) => {
    const updated = [...triggers]
    updated[index] = trigger
    onTriggersChange(updated)
  }

  const handleRemoveTrigger = (index: number) => {
    onTriggersChange(triggers.filter((_, i) => i !== index))
  }

  const disabledTypes = !allowMultiple && triggers.length > 0
    ? triggers.map(t => t.type)
    : []

  return (
    <div className={cn("space-y-4", className)}>
      {/* Existing Triggers */}
      <AnimatePresence mode="popLayout">
        {triggers.map((trigger, index) => (
          <motion.div
            key={trigger.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <TriggerCard
              trigger={trigger}
              onChange={(t) => handleUpdateTrigger(index, t)}
              onRemove={() => handleRemoveTrigger(index)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add Trigger */}
      {showSelector ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="p-4">
            <h4 className="font-medium mb-4">Select Trigger Type</h4>
            <TriggerTypeSelector
              onSelect={handleAddTrigger}
              disabledTypes={disabledTypes}
            />
            {triggers.length > 0 && (
              <Button
                variant="ghost"
                className="mt-4"
                onClick={() => setShowSelector(false)}
              >
                Cancel
              </Button>
            )}
          </Card>
        </motion.div>
      ) : (
        allowMultiple && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowSelector(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Trigger
          </Button>
        )
      )}
    </div>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function getDefaultSettings(type: TriggerType): Record<string, unknown> {
  switch (type) {
    case 'schedule':
      return {
        frequency: 'daily',
        interval: 1,
        timeOfDay: '09:00',
        timezone: 'UTC',
      }
    case 'webhook':
      return {
        headers: {},
      }
    case 'event':
      return {
        eventType: 'page.created',
        filters: {},
      }
    default:
      return {}
  }
}

export default BuilderTriggerConfig
