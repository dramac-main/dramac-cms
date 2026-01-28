/**
 * AI Agents Main Page Component
 * 
 * Phase EM-58B: Unified AI agents dashboard with all features
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Store, BarChart3, CreditCard, TestTube2, Plus } from 'lucide-react';
import { AgentBuilder } from './agent-builder';
import { AgentMarketplace, AgentDetails } from './marketplace';
import { AgentAnalytics } from './analytics';
import { UsageDashboard } from './billing';
import { AgentTestRunner } from './testing';
import type { AgentConfig } from '@/lib/ai-agents/types';
import { UsageTier, TIER_LIMITS } from '@/lib/ai-agents/billing';

interface AIAgentsPageProps {
  siteId: string;
  initialAgents?: AgentConfig[];
  currentTier?: UsageTier;
}

// Mock data for demonstration
const MOCK_USAGE = {
  siteId: '',
  periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  tokensUsed: 42500,
  tokensLimit: 50000,
  executionsUsed: 87,
  executionsLimit: 100,
  costEstimate: 0.43,
  overageTokens: 0,
  overageCost: 0,
};

export function AIAgentsPage({ 
  siteId, 
  initialAgents = [],
  currentTier = 'free'
}: AIAgentsPageProps) {
  const [activeTab, setActiveTab] = useState('agents');
  const [agents, setAgents] = useState<AgentConfig[]>(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsAgentId, setDetailsAgentId] = useState<string | null>(null);

  const handleSaveAgent = async (agent: Partial<AgentConfig>) => {
    // In production, this would save to the database
    console.log('Saving agent:', agent);
    setAgents(prev => {
      if (!agent.id) return prev; // Safety check
      const existing = prev.findIndex(a => a.id === agent.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], ...agent } as AgentConfig;
        return updated;
      }
      return [...prev, agent as AgentConfig];
    });
  };

  const handleInstallAgent = async (agentId: string) => {
    // In production, this would install from marketplace
    console.log('Installing agent:', agentId);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleViewDetails = (agentId: string) => {
    setDetailsAgentId(agentId);
    setShowDetails(true);
  };

  const handleUpgrade = async (tier: UsageTier) => {
    // In production, this would integrate with billing
    console.log('Upgrading to:', tier);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Agents</h1>
        <p className="text-muted-foreground">
          Build, deploy, and manage intelligent automation agents
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">My Agents</span>
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Marketplace</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube2 className="h-4 w-4" />
            <span className="hidden sm:inline">Testing</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Usage</span>
          </TabsTrigger>
        </TabsList>

        {/* My Agents Tab */}
        <TabsContent value="agents" className="mt-6">
          {selectedAgent ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to Agents
              </button>
              <AgentBuilder
                siteId={siteId}
                initialAgent={selectedAgent}
                onSave={handleSaveAgent}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Agent List */}
              {agents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{agent.avatarUrl || '🤖'}</div>
                        <div>
                          <h3 className="font-semibold">{agent.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {agent.agentType} • {agent.isActive ? 'active' : 'inactive'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Create New Card */}
                  <div
                    className="p-4 border border-dashed rounded-lg hover:border-primary hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-center"
                    onClick={() => setSelectedAgent({
                      id: crypto.randomUUID(),
                      siteId,
                      name: '',
                      slug: '',
                      agentType: 'assistant',
                      domain: 'custom',
                      capabilities: [],
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
                      maxTokens: 2000,
                      maxStepsPerRun: 10,
                      maxToolCallsPerStep: 5,
                      timeoutSeconds: 300,
                      maxRunsPerHour: 60,
                      maxRunsPerDay: 500,
                      allowedTools: [],
                      deniedTools: [],
                      totalRuns: 0,
                      successfulRuns: 0,
                      failedRuns: 0,
                      totalTokensUsed: 0,
                      totalActionsTaken: 0,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    })}
                  >
                    <div className="text-center">
                      <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2 font-medium">Create New Agent</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 font-semibold">No agents yet</h3>
                  <p className="text-muted-foreground mt-1">
                    Create your first agent or browse the marketplace
                  </p>
                  <div className="flex gap-3 justify-center mt-4">
                    <button
                      onClick={() => setSelectedAgent({
                        id: crypto.randomUUID(),
                        siteId,
                        name: '',
                        slug: '',
                        agentType: 'assistant',
                        domain: 'custom',
                        capabilities: [],
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
                        maxTokens: 2000,
                        maxStepsPerRun: 10,
                        maxToolCallsPerStep: 5,
                        timeoutSeconds: 300,
                        maxRunsPerHour: 60,
                        maxRunsPerDay: 500,
                        allowedTools: [],
                        deniedTools: [],
                        totalRuns: 0,
                        successfulRuns: 0,
                        failedRuns: 0,
                        totalTokensUsed: 0,
                        totalActionsTaken: 0,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      })}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                      Create Agent
                    </button>
                    <button
                      onClick={() => setActiveTab('marketplace')}
                      className="inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted"
                    >
                      <Store className="h-4 w-4" />
                      Browse Marketplace
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="mt-6">
          <AgentMarketplace
            siteId={siteId}
            onInstall={handleInstallAgent}
            onViewDetails={handleViewDetails}
          />
          <AgentDetails
            agent={null} // Would be populated from API
            open={showDetails}
            onOpenChange={setShowDetails}
            onInstall={handleInstallAgent}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <AgentAnalytics
            siteId={siteId}
            onAgentClick={(agentId) => {
              const agent = agents.find(a => a.id === agentId);
              if (agent) {
                setSelectedAgent(agent);
                setActiveTab('agents');
              }
            }}
          />
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="mt-6">
          {agents.length > 0 ? (
            <div className="space-y-6">
              <div className="flex gap-4 overflow-x-auto pb-2">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`px-4 py-2 rounded-md whitespace-nowrap ${
                      selectedAgent?.id === agent.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                      {agent.avatarUrl || '🤖'} {agent.name}
                  </button>
                ))}
              </div>
              {selectedAgent ? (
                <AgentTestRunner agent={selectedAgent} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Select an agent above to run tests
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <TestTube2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No agents to test</h3>
              <p className="text-muted-foreground mt-1">
                Create an agent first to run tests
              </p>
            </div>
          )}
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="mt-6">
          <UsageDashboard
            siteId={siteId}
            currentTier={currentTier}
            usage={{ ...MOCK_USAGE, siteId }}
            limits={TIER_LIMITS[currentTier]}
            onUpgrade={handleUpgrade}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIAgentsPage;
