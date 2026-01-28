/**
 * Agent Tools Panel
 * 
 * Phase EM-58B: Tool access configuration
 */

'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Shield, AlertTriangle } from 'lucide-react';
import { AgentConfig } from '@/lib/ai-agents/types';

interface ToolDefinition {
  name: string;
  displayName: string;
  description: string;
  category: string;
  isDangerous: boolean;
  requiresPermissions: string[];
}

interface ToolCategory {
  id: string;
  label: string;
  icon: string;
}

const TOOL_CATEGORIES: ToolCategory[] = [
  { id: 'crm', label: 'CRM', icon: '👥' },
  { id: 'communication', label: 'Communication', icon: '📧' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'data', label: 'Data', icon: '📊' },
  { id: 'web', label: 'Web', icon: '🌐' },
  { id: 'system', label: 'System', icon: '⚙️' },
];

// Default tools available in the system
const DEFAULT_TOOLS: ToolDefinition[] = [
  // CRM Tools
  { name: 'crm_get_contact', displayName: 'Get Contact', description: 'Retrieve contact details by ID', category: 'crm', isDangerous: false, requiresPermissions: ['crm:read'] },
  { name: 'crm_search_contacts', displayName: 'Search Contacts', description: 'Search contacts by criteria', category: 'crm', isDangerous: false, requiresPermissions: ['crm:read'] },
  { name: 'crm_create_contact', displayName: 'Create Contact', description: 'Create a new contact', category: 'crm', isDangerous: false, requiresPermissions: ['crm:write'] },
  { name: 'crm_update_contact', displayName: 'Update Contact', description: 'Update contact details', category: 'crm', isDangerous: false, requiresPermissions: ['crm:write'] },
  { name: 'crm_add_note', displayName: 'Add Note', description: 'Add a note to a contact', category: 'crm', isDangerous: false, requiresPermissions: ['crm:write'] },
  { name: 'crm_add_tag', displayName: 'Add Tag', description: 'Add tag to a contact', category: 'crm', isDangerous: false, requiresPermissions: ['crm:write'] },
  { name: 'crm_delete_contact', displayName: 'Delete Contact', description: 'Delete a contact permanently', category: 'crm', isDangerous: true, requiresPermissions: ['crm:delete'] },
  
  // Communication Tools
  { name: 'email_draft', displayName: 'Draft Email', description: 'Create an email draft', category: 'communication', isDangerous: false, requiresPermissions: ['email:write'] },
  { name: 'email_send', displayName: 'Send Email', description: 'Send an email directly', category: 'communication', isDangerous: true, requiresPermissions: ['email:send'] },
  { name: 'notify_user', displayName: 'Notify User', description: 'Send notification to user', category: 'communication', isDangerous: false, requiresPermissions: [] },
  
  // Calendar Tools
  { name: 'calendar_check_availability', displayName: 'Check Availability', description: 'Check calendar availability', category: 'calendar', isDangerous: false, requiresPermissions: ['calendar:read'] },
  { name: 'calendar_create_event', displayName: 'Create Event', description: 'Create a calendar event', category: 'calendar', isDangerous: false, requiresPermissions: ['calendar:write'] },
  
  // Data Tools
  { name: 'data_query', displayName: 'Query Data', description: 'Query database for information', category: 'data', isDangerous: false, requiresPermissions: ['data:read'] },
  { name: 'data_aggregate', displayName: 'Aggregate Data', description: 'Aggregate data with calculations', category: 'data', isDangerous: false, requiresPermissions: ['data:read'] },
  
  // Web Tools
  { name: 'web_search', displayName: 'Web Search', description: 'Search the web for information', category: 'web', isDangerous: false, requiresPermissions: [] },
  { name: 'web_fetch', displayName: 'Fetch URL', description: 'Fetch content from a URL', category: 'web', isDangerous: false, requiresPermissions: [] },
  
  // System Tools
  { name: 'task_create', displayName: 'Create Task', description: 'Create a task for follow-up', category: 'system', isDangerous: false, requiresPermissions: ['tasks:write'] },
  { name: 'workflow_trigger', displayName: 'Trigger Workflow', description: 'Trigger an automation workflow', category: 'system', isDangerous: true, requiresPermissions: ['automation:execute'] },
  { name: 'wait', displayName: 'Wait', description: 'Pause execution for a duration', category: 'system', isDangerous: false, requiresPermissions: [] },
  { name: 'get_current_time', displayName: 'Get Time', description: 'Get current date and time', category: 'system', isDangerous: false, requiresPermissions: [] },
];

interface AgentToolsProps {
  allowedTools: string[];
  deniedTools: string[];
  onChange: (updates: Partial<AgentConfig>) => void;
}

export function AgentTools({ allowedTools, deniedTools, onChange }: AgentToolsProps) {
  const [tools] = useState<ToolDefinition[]>(DEFAULT_TOOLS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTools = tools.filter(tool => {
    if (search && !tool.name.toLowerCase().includes(search.toLowerCase()) &&
        !tool.displayName.toLowerCase().includes(search.toLowerCase()) &&
        !tool.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedCategory && tool.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const isToolAllowed = (toolName: string) => {
    if (deniedTools.includes(toolName)) return false;
    return allowedTools.some(pattern => {
      if (pattern.endsWith('*')) {
        return toolName.startsWith(pattern.slice(0, -1));
      }
      return pattern === toolName;
    });
  };

  const toggleTool = (toolName: string) => {
    const isCurrentlyAllowed = isToolAllowed(toolName);
    
    if (isCurrentlyAllowed) {
      // Remove from allowed
      onChange({
        allowedTools: allowedTools.filter(t => t !== toolName),
      });
    } else {
      // Add to allowed, remove from denied if present
      onChange({
        allowedTools: [...allowedTools.filter(t => t !== toolName), toolName],
        deniedTools: deniedTools.filter(t => t !== toolName)
      });
    }
  };

  const toggleCategoryWildcard = (category: string) => {
    const wildcard = `${category}_*`;
    const hasWildcard = allowedTools.includes(wildcard);
    
    if (hasWildcard) {
      onChange({
        allowedTools: allowedTools.filter(t => t !== wildcard)
      });
    } else {
      // Remove individual tools in category, add wildcard
      const categoryTools = tools
        .filter(t => t.category === category)
        .map(t => t.name);
      
      onChange({
        allowedTools: [
          ...allowedTools.filter(t => !categoryTools.includes(t)),
          wildcard
        ]
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">Tool Access</Label>
        <p className="text-sm text-muted-foreground">
          Select which tools this agent can use to complete tasks
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools..."
          className="pl-9"
        />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === null ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Badge>
        {TOOL_CATEGORIES.map((cat) => (
          <Badge
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.icon} {cat.label}
          </Badge>
        ))}
      </div>

      {/* Tool List */}
      <div className="space-y-4">
        {TOOL_CATEGORIES.filter(
          cat => !selectedCategory || cat.id === selectedCategory
        ).map((category) => {
          const categoryTools = filteredTools.filter(t => t.category === category.id);
          if (categoryTools.length === 0) return null;
          
          const wildcard = `${category.id}_*`;
          const hasWildcard = allowedTools.includes(wildcard);
          
          return (
            <div key={category.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {categoryTools.length} tools
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">All</span>
                  <Switch
                    checked={hasWildcard}
                    onCheckedChange={() => toggleCategoryWildcard(category.id)}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                {categoryTools.map((tool) => (
                  <div
                    key={tool.name}
                    className={`flex items-start gap-3 p-2 rounded-md border transition-colors ${
                      isToolAllowed(tool.name)
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted/30 border-transparent'
                    }`}
                  >
                    <Checkbox
                      checked={isToolAllowed(tool.name)}
                      onCheckedChange={() => toggleTool(tool.name)}
                      disabled={hasWildcard}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {tool.displayName}
                        </span>
                        {tool.isDangerous && (
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        )}
                        {tool.requiresPermissions.length > 0 && (
                          <Shield className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="text-sm font-medium mb-2">Access Summary</div>
        <div className="flex flex-wrap gap-2">
          {allowedTools.length === 0 ? (
            <span className="text-sm text-muted-foreground">No tools selected</span>
          ) : (
            <>
              {allowedTools.map((tool) => (
                <Badge key={tool} variant="default">
                  {tool}
                </Badge>
              ))}
              {deniedTools.map((tool) => (
                <Badge key={tool} variant="destructive">
                  ✗ {tool}
                </Badge>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
