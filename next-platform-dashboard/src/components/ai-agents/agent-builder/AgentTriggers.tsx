/**
 * Agent Triggers Panel
 * 
 * Phase EM-58B: Event triggers, schedules, and conditions
 */

'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AgentConfig, AgentTriggerCondition } from '@/lib/ai-agents/types';
import { Plus, Trash2, Calendar, Zap, Filter } from 'lucide-react';
import { useState } from 'react';

interface AgentTriggersProps {
  triggers: string[];
  schedule?: string;
  conditions: AgentTriggerCondition[];
  onChange: (updates: Partial<AgentConfig>) => void;
}

const EVENT_CATEGORIES = [
  {
    category: 'CRM',
    events: [
      { value: 'crm.contact.created', label: 'Contact Created' },
      { value: 'crm.contact.updated', label: 'Contact Updated' },
      { value: 'crm.deal.created', label: 'Deal Created' },
      { value: 'crm.deal.stage_changed', label: 'Deal Stage Changed' },
      { value: 'crm.deal.closed', label: 'Deal Closed' },
    ]
  },
  {
    category: 'Support',
    events: [
      { value: 'support.ticket.created', label: 'Ticket Created' },
      { value: 'support.ticket.updated', label: 'Ticket Updated' },
      { value: 'support.ticket.closed', label: 'Ticket Closed' },
    ]
  },
  {
    category: 'Forms',
    events: [
      { value: 'form.submitted', label: 'Form Submitted' },
    ]
  },
  {
    category: 'Users',
    events: [
      { value: 'user.signed_up', label: 'User Signed Up' },
      { value: 'user.logged_in', label: 'User Logged In' },
    ]
  },
  {
    category: 'Chat',
    events: [
      { value: 'chat.message', label: 'Chat Message Received' },
    ]
  },
];

const SCHEDULE_PRESETS = [
  { value: '', label: 'No Schedule' },
  { value: 'schedule:every_5_minutes', label: 'Every 5 minutes' },
  { value: 'schedule:every_hour', label: 'Every hour' },
  { value: 'schedule:daily_6am', label: 'Daily at 6 AM' },
  { value: 'schedule:daily_9am', label: 'Daily at 9 AM' },
  { value: 'schedule:daily_7pm', label: 'Daily at 7 PM' },
  { value: 'schedule:weekly_monday', label: 'Weekly on Monday' },
  { value: 'schedule:monthly', label: 'Monthly' },
];

const OPERATORS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'gt', label: 'greater than' },
  { value: 'gte', label: 'greater or equal' },
  { value: 'lt', label: 'less than' },
  { value: 'lte', label: 'less or equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
];

export function AgentTriggers({ 
  triggers, 
  schedule, 
  conditions, 
  onChange 
}: AgentTriggersProps) {
  const [newCondition, setNewCondition] = useState<Partial<AgentTriggerCondition>>({
    operator: 'eq'
  });
  const [manualEnabled, setManualEnabled] = useState(triggers.includes('manual'));

  const addTrigger = (trigger: string) => {
    if (!triggers.includes(trigger)) {
      onChange({ triggerEvents: [...triggers, trigger] });
    }
  };

  const removeTrigger = (trigger: string) => {
    onChange({ triggerEvents: triggers.filter(t => t !== trigger) });
  };

  const toggleManual = (enabled: boolean) => {
    setManualEnabled(enabled);
    if (enabled) {
      addTrigger('manual');
    } else {
      removeTrigger('manual');
    }
  };

  const addCondition = () => {
    if (newCondition.field && newCondition.operator) {
      onChange({
        triggerConditions: [
          ...conditions,
          {
            field: newCondition.field,
            operator: newCondition.operator as AgentTriggerCondition['operator'],
            value: newCondition.value
          }
        ]
      });
      setNewCondition({ operator: 'eq' });
    }
  };

  const removeCondition = (index: number) => {
    onChange({
      triggerConditions: conditions.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      {/* Event Triggers */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4" />
          <Label className="text-base font-semibold">Event Triggers</Label>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Activate the agent when specific events occur
        </p>
        
        {/* Selected Triggers */}
        <div className="flex flex-wrap gap-2 mb-4">
          {triggers.filter(t => t !== 'manual' && !t.startsWith('schedule:')).map((trigger) => (
            <Badge 
              key={trigger} 
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeTrigger(trigger)}
            >
              {trigger} ×
            </Badge>
          ))}
        </div>
        
        {/* Event Categories */}
        <div className="space-y-3">
          {EVENT_CATEGORIES.map((category) => (
            <div key={category.category}>
              <Label className="text-xs text-muted-foreground">{category.category}</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {category.events.map((event) => (
                  <Button
                    key={event.value}
                    variant={triggers.includes(event.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => 
                      triggers.includes(event.value) 
                        ? removeTrigger(event.value) 
                        : addTrigger(event.value)
                    }
                  >
                    {event.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Trigger */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4" />
          <Label className="text-base font-semibold">Schedule</Label>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Run the agent on a recurring schedule
        </p>
        
        <Select
          value={schedule || ''}
          onValueChange={(value) => onChange({ triggerSchedule: value || undefined })}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select schedule" />
          </SelectTrigger>
          <SelectContent>
            {SCHEDULE_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {schedule && (
          <div className="mt-2">
            <Input
              value={schedule}
              onChange={(e) => onChange({ triggerSchedule: e.target.value })}
              placeholder="Or enter custom cron: 0 9 * * *"
              className="w-64 font-mono text-sm"
            />
          </div>
        )}
      </div>

      {/* Manual Trigger */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Allow Manual Trigger</Label>
          <p className="text-sm text-muted-foreground">
            Enable running this agent on-demand
          </p>
        </div>
        <Switch
          checked={manualEnabled}
          onCheckedChange={toggleManual}
        />
      </div>

      {/* Conditions */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-4 w-4" />
          <Label className="text-base font-semibold">Conditions</Label>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Only run when these conditions are met
        </p>
        
        {conditions.length > 0 && (
          <div className="space-y-2 mb-4">
            {conditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge variant="outline">{condition.field}</Badge>
                <span className="text-sm text-muted-foreground">
                  {OPERATORS.find(o => o.value === condition.operator)?.label}
                </span>
                <Badge variant="secondary">{String(condition.value)}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeCondition(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <Card className="border-dashed">
          <CardContent className="pt-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs">Field</Label>
                <Input
                  value={newCondition.field || ''}
                  onChange={(e) => setNewCondition({ ...newCondition, field: e.target.value })}
                  placeholder="e.g., data.source"
                />
              </div>
              
              <div className="w-40">
                <Label className="text-xs">Operator</Label>
                <Select
                  value={newCondition.operator || 'eq'}
                  onValueChange={(value) => setNewCondition({ ...newCondition, operator: value as AgentTriggerCondition['operator'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Label className="text-xs">Value</Label>
                <Input
                  value={String(newCondition.value || '')}
                  onChange={(e) => setNewCondition({ ...newCondition, value: e.target.value })}
                  placeholder="e.g., website"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={addCondition}
                disabled={!newCondition.field}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
