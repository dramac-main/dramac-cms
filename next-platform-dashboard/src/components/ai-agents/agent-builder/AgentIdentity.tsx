/**
 * Agent Identity Panel
 * 
 * Phase EM-58B: Agent name, type, domain, and template selection
 */

'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AgentConfig, AgentType, AgentDomain } from '@/lib/ai-agents/types';
import { AgentTemplate } from '@/lib/ai-agents/templates';

const AGENT_TYPES: Array<{ value: AgentType; label: string; description: string }> = [
  { value: 'assistant', label: 'Assistant', description: 'General purpose helper' },
  { value: 'specialist', label: 'Specialist', description: 'Domain expert (sales, support, etc.)' },
  { value: 'orchestrator', label: 'Orchestrator', description: 'Manages other agents' },
  { value: 'analyst', label: 'Analyst', description: 'Data analysis and reporting' },
  { value: 'guardian', label: 'Guardian', description: 'Monitoring and alerting' },
];

const DOMAINS: Array<{ value: AgentDomain | 'general'; label: string }> = [
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'support', label: 'Support' },
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'HR' },
  { value: 'custom', label: 'Custom' },
];

const AVATARS = ['🤖', '🎯', '💚', '🎫', '📊', '📅', '🔒', '🧹', '📧', '🚀', '❓', '⏰'];

interface AgentIdentityProps {
  agent: Partial<AgentConfig>;
  onChange: (updates: Partial<AgentConfig>) => void;
  templates: AgentTemplate[];
  onSelectTemplate: (template: AgentTemplate) => void;
}

export function AgentIdentity({ 
  agent, 
  onChange, 
  templates, 
  onSelectTemplate 
}: AgentIdentityProps) {
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    onChange({ 
      name,
      slug: agent.slug || generateSlug(name)
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Start Templates */}
      {templates.length > 0 && (
        <div>
          <Label className="text-base font-semibold">Start from Template</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Choose a pre-built agent to customize
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {templates.slice(0, 6).map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="p-3 border rounded-lg hover:border-primary hover:bg-primary/5 text-left transition-colors"
              >
                <div className="text-2xl mb-1">{template.icon}</div>
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-muted-foreground">
                  {template.difficulty} • {template.setupTime}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t pt-6">
        <Label className="text-base font-semibold">Or Build Custom</Label>
      </div>

      {/* Name & Avatar */}
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <Label>Avatar</Label>
          <div className="grid grid-cols-4 gap-1 mt-2">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onChange({ avatarUrl: emoji })}
                className={`w-10 h-10 text-xl rounded-lg border flex items-center justify-center hover:bg-primary/10 transition-colors ${
                  agent.avatarUrl === emoji ? 'border-primary bg-primary/5' : 'border-transparent'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <Label htmlFor="name">Agent Name *</Label>
            <Input
              id="name"
              value={agent.name || ''}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Sales Assistant, Support Helper"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={agent.slug || ''}
              onChange={(e) => onChange({ slug: e.target.value })}
              placeholder="auto-generated-from-name"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL-friendly identifier for API calls
            </p>
          </div>
        </div>
      </div>

      {/* Type & Domain */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Agent Type *</Label>
          <Select
            value={agent.agentType || ''}
            onValueChange={(value) => onChange({ agentType: value as AgentType })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {AGENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {type.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Domain / Department</Label>
          <Select
            value={agent.domain || ''}
            onValueChange={(value) => onChange({ domain: value as AgentDomain })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              {DOMAINS.map((domain) => (
                <SelectItem key={domain.value} value={domain.value}>
                  {domain.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={agent.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Briefly describe what this agent does..."
          rows={2}
          className="mt-2"
        />
      </div>

      {/* Capabilities */}
      <div>
        <Label>Capabilities</Label>
        <p className="text-sm text-muted-foreground mb-2">
          What can this agent do? (helps with discovery)
        </p>
        <div className="flex flex-wrap gap-2">
          {(agent.capabilities || []).map((cap, index) => (
            <Badge 
              key={index} 
              variant="secondary"
              className="cursor-pointer"
              onClick={() => {
                onChange({
                  capabilities: (agent.capabilities || []).filter((_, i) => i !== index)
                });
              }}
            >
              {cap} ×
            </Badge>
          ))}
          <Input
            placeholder="Add capability..."
            className="w-40"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = e.currentTarget.value.trim();
                if (value) {
                  onChange({
                    capabilities: [...(agent.capabilities || []), value]
                  });
                  e.currentTarget.value = '';
                }
                e.preventDefault();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
