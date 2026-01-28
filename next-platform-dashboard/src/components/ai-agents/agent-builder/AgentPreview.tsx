/**
 * Agent Preview Panel
 * 
 * Phase EM-58B: Preview of agent configuration
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentConfig } from '@/lib/ai-agents/types';
import { Bot, Zap, Calendar, Wrench, Shield, Target } from 'lucide-react';

interface AgentPreviewProps {
  agent: Partial<AgentConfig>;
}

export function AgentPreview({ agent }: AgentPreviewProps) {
  const triggerCount = (agent.triggerEvents?.length || 0) + (agent.triggerSchedule ? 1 : 0);
  const toolCount = agent.allowedTools?.length || 0;
  const constraintCount = (agent.constraints?.length || 0);
  const goalCount = (agent.goals?.length || 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className="text-4xl">{agent.avatarUrl || '🤖'}</div>
          <div>
            <h3 className="font-semibold">{agent.name || 'Unnamed Agent'}</h3>
            <p className="text-sm text-muted-foreground">
              {agent.agentType || 'assistant'} • {agent.domain || 'general'}
            </p>
          </div>
        </div>

        {/* Description */}
        {agent.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {agent.description}
          </p>
        )}

        {/* Capabilities */}
        {agent.capabilities && agent.capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.slice(0, 4).map((cap, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {cap}
              </Badge>
            ))}
            {agent.capabilities.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{agent.capabilities.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>{triggerCount} trigger{triggerCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Wrench className="h-4 w-4 text-blue-500" />
            <span>{toolCount} tool{toolCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-green-500" />
            <span>{goalCount} goal{goalCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-red-500" />
            <span>{constraintCount} rule{constraintCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Model Info */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1">Model</div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {agent.llmProvider || 'openai'}
            </Badge>
            <Badge variant="secondary">
              {agent.llmModel || 'gpt-4o-mini'}
            </Badge>
          </div>
        </div>

        {/* Status */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={agent.isActive ? 'default' : 'secondary'}>
              {agent.isActive ? 'Active' : 'Draft'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
