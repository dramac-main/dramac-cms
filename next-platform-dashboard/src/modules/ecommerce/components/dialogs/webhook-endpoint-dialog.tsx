/**
 * Webhook Endpoint Dialog
 * 
 * Phase ECOM-43B: Integrations & Webhooks - UI Components
 * 
 * Dialog for creating and editing webhook endpoints.
 */
'use client'

import { useState, useEffect } from 'react'
import { Loader2, Webhook, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { toast } from 'sonner'
import type { 
  CreateWebhookInput, 
  UpdateWebhookInput, 
  WebhookEndpoint, 
  WebhookEventType,
  WebhookEventTypeInfo 
} from '../../types/integration-types'

interface WebhookEndpointDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  endpoint?: WebhookEndpoint | null
  eventTypes: WebhookEventTypeInfo[]
  onSubmit: (input: CreateWebhookInput | UpdateWebhookInput) => Promise<{ success: boolean; error?: string }>
}

// Group events by category
function groupEventsByCategory(events: WebhookEventTypeInfo[]): Record<string, WebhookEventTypeInfo[]> {
  return events.reduce((acc, event) => {
    const category = event.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(event)
    return acc
  }, {} as Record<string, WebhookEventTypeInfo[]>)
}

export function WebhookEndpointDialog({ 
  open, 
  onOpenChange, 
  endpoint, 
  eventTypes,
  onSubmit 
}: WebhookEndpointDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!endpoint
  
  // Form state
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>([])
  const [customHeaders, setCustomHeaders] = useState<{ key: string; value: string }[]>([])
  const [timeoutSeconds, setTimeoutSeconds] = useState('30')
  const [maxRetries, setMaxRetries] = useState('3')

  // Populate form when editing
  useEffect(() => {
    if (endpoint) {
      setName(endpoint.name)
      setUrl(endpoint.url)
      setDescription(endpoint.description || '')
      setSelectedEvents(endpoint.events)
      setCustomHeaders(
        Object.entries(endpoint.custom_headers || {}).map(([key, value]) => ({ key, value: value as string }))
      )
      setTimeoutSeconds(String(endpoint.timeout_seconds))
      setMaxRetries(String(endpoint.max_retries))
    } else {
      resetForm()
    }
  }, [endpoint, open])

  const resetForm = () => {
    setName('')
    setUrl('')
    setDescription('')
    setSelectedEvents([])
    setCustomHeaders([])
    setTimeoutSeconds('30')
    setMaxRetries('3')
  }

  const handleEventToggle = (eventType: WebhookEventType) => {
    setSelectedEvents(prev => 
      prev.includes(eventType) 
        ? prev.filter(e => e !== eventType)
        : [...prev, eventType]
    )
  }

  const handleCategoryToggle = (categoryEvents: WebhookEventTypeInfo[]) => {
    const eventNames = categoryEvents.map(e => e.event_type as WebhookEventType)
    const allSelected = eventNames.every(e => selectedEvents.includes(e))
    
    if (allSelected) {
      setSelectedEvents(prev => prev.filter(e => !eventNames.includes(e)))
    } else {
      setSelectedEvents(prev => [...new Set([...prev, ...eventNames])] as WebhookEventType[])
    }
  }

  const addCustomHeader = () => {
    setCustomHeaders(prev => [...prev, { key: '', value: '' }])
  }

  const removeCustomHeader = (index: number) => {
    setCustomHeaders(prev => prev.filter((_, i) => i !== index))
  }

  const updateCustomHeader = (index: number, field: 'key' | 'value', value: string) => {
    setCustomHeaders(prev => prev.map((header, i) => 
      i === index ? { ...header, [field]: value } : header
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Please enter a name')
      return
    }

    if (!url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    try {
      new URL(url)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    if (selectedEvents.length === 0) {
      toast.error('Please select at least one event')
      return
    }

    setIsSubmitting(true)
    
    try {
      const headersObject = customHeaders
        .filter(h => h.key.trim())
        .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {})

      const input: CreateWebhookInput | UpdateWebhookInput = {
        name: name.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        events: selectedEvents,
        custom_headers: Object.keys(headersObject).length > 0 ? headersObject : undefined,
        timeout_seconds: parseInt(timeoutSeconds) || 30,
        max_retries: parseInt(maxRetries) || 3
      }
      
      const result = await onSubmit(input)
      
      if (result.success) {
        toast.success(isEditing ? 'Webhook updated' : 'Webhook created')
        onOpenChange(false)
        resetForm()
      } else {
        toast.error(result.error || 'Failed to save webhook')
      }
    } catch {
      toast.error('Failed to save webhook')
    } finally {
      setIsSubmitting(false)
    }
  }

  const groupedEvents = groupEventsByCategory(eventTypes)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            {isEditing ? 'Edit Webhook Endpoint' : 'Create Webhook Endpoint'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update your webhook endpoint configuration.' 
              : 'Configure a new endpoint to receive webhook events.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="My Webhook"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">Endpoint URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://api.example.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this webhook is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Events to subscribe *</Label>
            <div className="border rounded-md">
              <Accordion type="multiple" className="w-full">
                {Object.entries(groupedEvents).map(([category, events]) => {
                  const categorySelected = events.filter(e => selectedEvents.includes(e.event_type as WebhookEventType)).length
                  return (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-2">
                          <span className="capitalize">{category.replace('_', ' ')}</span>
                          <span className="text-xs text-muted-foreground">
                            {categorySelected}/{events.length} selected
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b">
                          <span className="text-sm text-muted-foreground">Select all</span>
                          <Checkbox
                            checked={events.every(e => selectedEvents.includes(e.event_type as WebhookEventType))}
                            onCheckedChange={() => handleCategoryToggle(events)}
                          />
                        </div>
                        <div className="space-y-2">
                          {events.map(event => (
                            <div key={event.event_type} className="flex items-start space-x-2">
                              <Checkbox
                                id={event.event_type}
                                checked={selectedEvents.includes(event.event_type as WebhookEventType)}
                                onCheckedChange={() => handleEventToggle(event.event_type as WebhookEventType)}
                              />
                              <label 
                                htmlFor={event.event_type} 
                                className="text-sm cursor-pointer flex-1"
                              >
                                <span className="font-mono text-xs">{event.event_type}</span>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {event.description}
                                  </p>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Custom Headers</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCustomHeader}>
                <Plus className="h-3 w-3 mr-1" />
                Add Header
              </Button>
            </div>
            {customHeaders.length > 0 && (
              <div className="space-y-2">
                {customHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Header name"
                      value={header.key}
                      onChange={(e) => updateCustomHeader(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) => updateCustomHeader(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeCustomHeader(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                min="5"
                max="60"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="retries">Max Retries</Label>
              <Input
                id="retries"
                type="number"
                min="0"
                max="10"
                value={maxRetries}
                onChange={(e) => setMaxRetries(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
