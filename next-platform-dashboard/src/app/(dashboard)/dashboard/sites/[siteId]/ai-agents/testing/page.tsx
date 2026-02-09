/**
 * AI Agent Testing Page
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 */

import { Suspense } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, TestTube } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { AgentTestRunner } from "@/components/ai-agents/testing"
import { PLATFORM } from "@/lib/constants/platform"

export const metadata: Metadata = {
  title: `Agent Testing | ${PLATFORM.name}`,
  description: "Test and validate your AI agents"
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  )
}

async function getAgentsForTesting(siteId: string) {
  const supabase = await createClient()
  
  // Cast to any since AI agent tables aren't in TypeScript types yet
  const { data, error } = await (supabase as any)
    .from("ai_agents")
    .select("*")
    .eq("site_id", siteId)
    .order("name")
  
  if (error) {
    console.error("Error fetching agents:", error)
    return []
  }
  
  return (data || []) as any[]
}

interface TestingPageProps {
  params: Promise<{ siteId: string }>
}

export default async function TestingPage({ params }: TestingPageProps) {
  const { siteId } = await params
  const agents = await getAgentsForTesting(siteId)

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
          <TestTube className="h-8 w-8" />
          Agent Testing
        </h1>
        <p className="text-muted-foreground mt-1">
          Test and validate your AI agents before deploying
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        {agents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TestTube className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Agents to Test</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create an agent first to start testing
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <CardTitle>{agent.name}</CardTitle>
                  <CardDescription>
                    {agent.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AgentTestRunner
                    agent={{
                      id: agent.id,
                      siteId: siteId,
                      name: agent.name,
                      slug: agent.slug || agent.name.toLowerCase().replace(/\s+/g, '-'),
                      description: agent.description || '',
                      agentType: agent.type || 'assistant',
                      personality: agent.personality || '',
                      systemPrompt: agent.system_prompt || '',
                      goals: [],
                      constraints: agent.constraints || [],
                      examples: [],
                      triggerEvents: agent.trigger_events || [],
                      triggerConditions: [],
                      isActive: agent.is_active || false,
                      isPublic: agent.is_public || false,
                      llmProvider: agent.model_provider || 'openai',
                      llmModel: agent.model_id || 'gpt-4o-mini',
                      temperature: agent.temperature || 0.7,
                      maxTokens: agent.max_tokens_per_run || 4096,
                      maxStepsPerRun: agent.max_actions_per_run || 10,
                      maxToolCallsPerStep: 3,
                      timeoutSeconds: 120,
                      maxRunsPerHour: 60,
                      maxRunsPerDay: 500,
                      allowedTools: agent.allowed_tools || ['*'],
                      deniedTools: agent.denied_tools || [],
                      capabilities: [],
                      avatarUrl: undefined,
                      createdAt: agent.created_at,
                      updatedAt: agent.updated_at,
                      createdBy: agent.created_by,
                      totalRuns: 0,
                      successfulRuns: 0,
                      failedRuns: 0,
                      totalTokensUsed: 0,
                      totalActionsTaken: 0,
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Suspense>
    </div>
  )
}
