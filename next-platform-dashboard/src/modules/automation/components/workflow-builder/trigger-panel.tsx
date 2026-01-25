/**
 * TriggerPanel Component
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Panel for configuring workflow triggers including:
 * - Event triggers (platform events)
 * - Schedule triggers (cron-based)
 * - Webhook triggers (incoming HTTP)
 * - Manual triggers
 */

"use client"

import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, Zap, Clock, Globe, MousePointer } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { EVENT_REGISTRY } from "../../lib/event-types"
import type { TriggerConfig, TriggerType } from "../../types/automation-types"

// ============================================================================
// TYPES
// ============================================================================

interface TriggerPanelProps {
  trigger?: TriggerConfig
  triggerType?: TriggerType
  onTriggerChange: (trigger: TriggerConfig, type: TriggerType) => void
}

// ============================================================================
// TRIGGER TYPES
// ============================================================================

const TRIGGER_TYPES = [
  { id: 'event' as TriggerType, name: 'Event', icon: Zap, description: 'Triggered by platform events' },
  { id: 'schedule' as TriggerType, name: 'Schedule', icon: Clock, description: 'Run on a schedule' },
  { id: 'webhook' as TriggerType, name: 'Webhook', icon: Globe, description: 'Triggered by HTTP request' },
  { id: 'manual' as TriggerType, name: 'Manual', icon: MousePointer, description: 'Triggered manually' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function TriggerPanel({ trigger, triggerType, onTriggerChange }: TriggerPanelProps) {
  const [selectedType, setSelectedType] = useState<TriggerType>(triggerType || 'event')
  const [copied, setCopied] = useState(false)

  const handleTypeChange = (type: TriggerType) => {
    setSelectedType(type)
    onTriggerChange({ ...trigger }, type)
  }

  const handleConfigChange = (key: string, value: unknown) => {
    onTriggerChange({ ...trigger, [key]: value }, selectedType)
  }

  const copyWebhookUrl = async () => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/automation/webhook/${trigger?.endpoint_path || 'configure-me'}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Webhook URL copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 border-b">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-yellow-500" />
        Trigger
      </h3>

      <Tabs value={selectedType} onValueChange={(v) => handleTypeChange(v as TriggerType)}>
        <TabsList className="grid grid-cols-2 gap-1 h-auto">
          {TRIGGER_TYPES.map((t) => {
            const Icon = t.icon
            return (
              <TabsTrigger 
                key={t.id} 
                value={t.id} 
                className="text-xs flex flex-col items-center gap-1 py-2"
              >
                <Icon className="h-4 w-4" />
                {t.name}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Event Trigger Config */}
        <TabsContent value="event" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select
              value={trigger?.event_type as string || ''}
              onValueChange={(value) => handleConfigChange('event_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an event..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {/* CRM Events */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                  👤 CRM
                </div>
                {Object.entries(EVENT_REGISTRY.crm.contact).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Contact {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}
                {Object.entries(EVENT_REGISTRY.crm.deal).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Deal {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}
                {Object.entries(EVENT_REGISTRY.crm.task).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Task {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}

                {/* Booking Events */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted mt-2">
                  📅 Booking
                </div>
                {Object.entries(EVENT_REGISTRY.booking.appointment).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Appointment {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}

                {/* Form Events */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted mt-2">
                  📝 Forms
                </div>
                {Object.entries(EVENT_REGISTRY.form.submission).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Form {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}

                {/* E-commerce Events */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted mt-2">
                  🛒 E-Commerce
                </div>
                {Object.entries(EVENT_REGISTRY.ecommerce.order).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Order {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}
                {Object.entries(EVENT_REGISTRY.ecommerce.cart).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Cart {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}

                {/* Accounting Events */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted mt-2">
                  💰 Accounting
                </div>
                {Object.entries(EVENT_REGISTRY.accounting.invoice).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Invoice {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}
                {Object.entries(EVENT_REGISTRY.accounting.payment).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Payment {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event Filter */}
          <div className="space-y-2">
            <Label>Filter (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Only trigger when conditions are met
            </p>
            <Input
              placeholder='{"status": "active"}'
              value={JSON.stringify(trigger?.filter || {})}
              onChange={(e) => {
                try {
                  handleConfigChange('filter', JSON.parse(e.target.value))
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              className="font-mono text-xs"
            />
          </div>
        </TabsContent>

        {/* Schedule Trigger Config */}
        <TabsContent value="schedule" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Schedule Type</Label>
            <Select
              value={trigger?.schedule_type as string || 'daily'}
              onValueChange={(value) => handleConfigChange('schedule_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Every Hour</SelectItem>
                <SelectItem value="daily">Every Day</SelectItem>
                <SelectItem value="weekly">Every Week</SelectItem>
                <SelectItem value="monthly">Every Month</SelectItem>
                <SelectItem value="custom">Custom (Cron)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {trigger?.schedule_type === 'daily' && (
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={trigger?.time as string || '09:00'}
                onChange={(e) => handleConfigChange('time', e.target.value)}
              />
            </div>
          )}

          {trigger?.schedule_type === 'weekly' && (
            <>
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={trigger?.day_of_week as string || '1'}
                  onValueChange={(value) => handleConfigChange('day_of_week', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={trigger?.time as string || '09:00'}
                  onChange={(e) => handleConfigChange('time', e.target.value)}
                />
              </div>
            </>
          )}

          {trigger?.schedule_type === 'custom' && (
            <div className="space-y-2">
              <Label>Cron Expression</Label>
              <Input
                placeholder="0 9 * * 1-5"
                value={trigger?.cron as string || ''}
                onChange={(e) => handleConfigChange('cron', e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Example: 0 9 * * 1-5 (9am weekdays)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={trigger?.timezone as string || 'America/New_York'}
              onValueChange={(value) => handleConfigChange('timezone', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Webhook Trigger Config */}
        <TabsContent value="webhook" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Endpoint Path</Label>
            <Input
              placeholder="my-webhook"
              value={trigger?.endpoint_path as string || ''}
              onChange={(e) => handleConfigChange('endpoint_path', e.target.value.replace(/[^a-z0-9-]/gi, '-').toLowerCase())}
            />
            <p className="text-xs text-muted-foreground">
              Only letters, numbers, and hyphens allowed
            </p>
          </div>

          <div className="p-3 bg-muted rounded-md space-y-2">
            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
            <code className="block text-xs break-all">
              {`${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/automation/webhook/${trigger?.endpoint_path || 'configure-me'}`}
            </code>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={copyWebhookUrl}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </>
            )}
          </Button>

          <div className="space-y-2">
            <Label>Secret Key (Optional)</Label>
            <Input
              type="password"
              placeholder="For signature verification"
              value={trigger?.secret_key as string || ''}
              onChange={(e) => handleConfigChange('secret_key', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used to verify webhook signatures
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Send a POST request to this URL to trigger the workflow. Include your data in the request body.
          </p>
        </TabsContent>

        {/* Manual Trigger */}
        <TabsContent value="manual" className="mt-4">
          <div className="p-4 border border-dashed rounded-md text-center space-y-2">
            <MousePointer className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              This workflow can only be triggered manually via the dashboard or API.
            </p>
            <p className="text-xs text-muted-foreground">
              Use this for workflows that need human initiation, like data cleanup or ad-hoc notifications.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
