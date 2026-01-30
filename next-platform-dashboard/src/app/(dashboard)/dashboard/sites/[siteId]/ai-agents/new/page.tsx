/**
 * New AI Agent Page
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 */

import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Bot } from "lucide-react"
import { AgentBuilder } from "@/components/ai-agents/agent-builder"
import { AGENT_TEMPLATES } from "@/lib/ai-agents/templates"
import { createAgent } from "@/lib/ai-agents/actions"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Create Agent | DRAMAC",
  description: "Create a new AI agent"
}

interface NewAgentPageProps {
  params: Promise<{ siteId: string }>
}

export default async function NewAgentPage({ params }: NewAgentPageProps) {
  const { siteId } = await params

  async function handleSave(agent: Parameters<typeof createAgent>[1] & { id?: string }) {
    'use server'
    
    await createAgent(siteId, {
      name: agent.name,
      type: agent.type,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      modelProvider: agent.modelProvider,
      modelId: agent.modelId,
      goals: agent.goals,
      allowedTools: agent.allowedTools,
      deniedTools: agent.deniedTools,
      constraints: agent.constraints,
      maxTokensPerRun: agent.maxTokensPerRun,
      maxActionsPerRun: agent.maxActionsPerRun,
    })
    
    redirect(`/dashboard/sites/${siteId}/ai-agents`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Link 
          href={`/dashboard/sites/${siteId}/ai-agents`}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Agents
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bot className="h-8 w-8" />
          Create New Agent
        </h1>
        <p className="text-muted-foreground mt-1">
          Build a custom AI agent for your business
        </p>
      </div>

      <AgentBuilder
        siteId={siteId}
        templates={AGENT_TEMPLATES}
        onSave={async (agent) => {
          'use server'
          // Transform Partial<AgentConfig> to the format createAgent expects
          if (!agent.name || !agent.agentType || !agent.systemPrompt) {
            throw new Error('Name, type, and system prompt are required')
          }
          
          await createAgent(siteId, {
            name: agent.name,
            type: agent.agentType,
            description: agent.description,
            systemPrompt: agent.systemPrompt,
            modelProvider: agent.llmProvider,
            modelId: agent.llmModel,
            goals: agent.goals?.map(g => ({
              title: g.name,
              description: g.description || '',
              priority: g.priority,
            })),
            allowedTools: agent.allowedTools,
            deniedTools: agent.deniedTools,
            constraints: agent.constraints,
            maxTokensPerRun: agent.maxTokens,
            maxActionsPerRun: agent.maxStepsPerRun,
          })
          
          redirect(`/dashboard/sites/${siteId}/ai-agents`)
        }}
        onCancel={() => {
          // Client-side navigation will handle this
        }}
      />
    </div>
  )
}
