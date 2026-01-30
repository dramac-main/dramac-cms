/**
 * Agent Builder - Main Component
 * 
 * Phase EM-58B: UI for creating and editing AI agents
 */

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AgentIdentity } from './AgentIdentity';
import { AgentPersonality } from './AgentPersonality';
import { AgentGoals } from './AgentGoals';
import { AgentTriggers } from './AgentTriggers';
import { AgentTools } from './AgentTools';
import { AgentConstraints } from './AgentConstraints';
import { AgentSettings } from './AgentSettings';
import { AgentPreview } from './AgentPreview';
import { AgentTestPanel } from './AgentTestPanel';
import { AgentConfig, AgentType, AgentGoal } from '@/lib/ai-agents/types';
import { AgentTemplate } from '@/lib/ai-agents/templates';
import { Loader2 } from 'lucide-react';

interface AgentBuilderProps {
  initialAgent?: Partial<AgentConfig>;
  templates?: AgentTemplate[];
  siteId: string;
  onSave: (agent: Partial<AgentConfig>) => Promise<void>;
  onCancel?: () => void;
}

const createDefaultAgent = (siteId: string): Partial<AgentConfig> => ({
  siteId,
  name: '',
  slug: '',
  description: '',
  agentType: 'assistant' as AgentType,
  personality: '',
  systemPrompt: '',
  goals: [],
  constraints: [],
  examples: [],
  triggerEvents: [],
  triggerConditions: [],
  isActive: false,
  isPublic: false,
  llmProvider: 'openai',
  llmModel: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 4096,
  maxStepsPerRun: 10,
  maxToolCallsPerStep: 3,
  timeoutSeconds: 120,
  maxRunsPerHour: 60,
  maxRunsPerDay: 500,
  allowedTools: [],
  deniedTools: [],
  capabilities: [],
});

export interface TestResult {
  success: boolean;
  durationMs: number;
  steps: number;
  tokensUsed: number;
  actions: Array<{ tool: string; input: Record<string, unknown> }>;
  response?: string;
  error?: string;
}

export function AgentBuilder({
  initialAgent,
  templates = [],
  siteId,
  onSave,
  onCancel,
}: AgentBuilderProps) {
  const [agent, setAgent] = useState<Partial<AgentConfig>>(
    initialAgent || createDefaultAgent(siteId)
  );
  const [activeTab, setActiveTab] = useState('identity');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const updateAgent = useCallback((updates: Partial<AgentConfig>) => {
    setAgent(prev => ({ ...prev, ...updates }));
  }, []);

  const handleStartFromTemplate = useCallback((template: AgentTemplate) => {
    setAgent({
      ...createDefaultAgent(siteId),
      ...template.defaultConfig,
      name: `${template.name} (Copy)`,
      slug: `${template.id}-copy`,
    });
  }, [siteId]);

  const handleTest = useCallback(async (_scenario?: string) => {
    setIsTesting(true);
    try {
      // Simulate test for now - in production this would call the agent executor
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTestResults({
        success: true,
        durationMs: 1250,
        steps: 3,
        tokensUsed: 450,
        actions: [
          { tool: 'crm_get_contact', input: { id: 'test-123' } },
          { tool: 'crm_add_note', input: { contactId: 'test-123', note: 'Test note' } },
        ],
        response: 'Agent completed successfully. Found contact and added a note.',
      });
    } catch (error) {
      setTestResults({
        success: false,
        durationMs: 500,
        steps: 1,
        tokensUsed: 50,
        actions: [],
        error: error instanceof Error ? error.message : 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  }, []);

  const handleSave = useCallback(async (activate: boolean) => {
    setIsSaving(true);
    try {
      await onSave({ ...agent, isActive: activate });
    } finally {
      setIsSaving(false);
    }
  }, [agent, onSave]);

  const isValid = Boolean(
    agent.name && 
    agent.systemPrompt && 
    agent.agentType
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Builder */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{agent.avatarUrl || '🤖'}</span>
              {agent.name || 'New Agent'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-7 w-full">
                <TabsTrigger value="identity">Identity</TabsTrigger>
                <TabsTrigger value="personality">Personality</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="triggers">Triggers</TabsTrigger>
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="constraints">Rules</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="identity" className="mt-4">
                <AgentIdentity
                  agent={agent}
                  onChange={updateAgent}
                  templates={templates}
                  onSelectTemplate={handleStartFromTemplate}
                />
              </TabsContent>

              <TabsContent value="personality" className="mt-4">
                <AgentPersonality
                  personality={agent.personality || ''}
                  systemPrompt={agent.systemPrompt || ''}
                  examples={agent.examples || []}
                  onChange={updateAgent}
                />
              </TabsContent>

              <TabsContent value="goals" className="mt-4">
                <AgentGoals
                  goals={(agent.goals || []) as AgentGoal[]}
                  onChange={(goals) => updateAgent({ goals })}
                />
              </TabsContent>

              <TabsContent value="triggers" className="mt-4">
                <AgentTriggers
                  triggers={agent.triggerEvents || []}
                  schedule={agent.triggerSchedule}
                  conditions={agent.triggerConditions || []}
                  onChange={updateAgent}
                />
              </TabsContent>

              <TabsContent value="tools" className="mt-4">
                <AgentTools
                  allowedTools={agent.allowedTools || []}
                  deniedTools={agent.deniedTools || []}
                  onChange={updateAgent}
                />
              </TabsContent>

              <TabsContent value="constraints" className="mt-4">
                <AgentConstraints
                  constraints={(agent.constraints || []) as string[]}
                  onChange={(constraints) => updateAgent({ constraints })}
                />
              </TabsContent>

              <TabsContent value="settings" className="mt-4">
                <AgentSettings
                  settings={{
                    llmProvider: agent.llmProvider || 'openai',
                    llmModel: agent.llmModel || 'gpt-4o-mini',
                    temperature: agent.temperature || 0.7,
                    maxTokens: agent.maxTokens || 4096,
                    maxStepsPerRun: agent.maxStepsPerRun || 10,
                    timeoutSeconds: agent.timeoutSeconds || 120,
                    maxRunsPerHour: agent.maxRunsPerHour || 60,
                  }}
                  onChange={updateAgent}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Preview & Test Panel */}
      <div className="space-y-6">
        <AgentPreview agent={agent} />
        
        <AgentTestPanel
          agent={agent}
          isLoading={isTesting}
          results={testResults}
          onTest={handleTest}
        />

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              {onCancel && (
                <Button
                  variant="ghost"
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleSave(false)}
                disabled={isSaving || !isValid}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Draft
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleSave(true)}
                disabled={isSaving || !isValid}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Activate Agent
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
