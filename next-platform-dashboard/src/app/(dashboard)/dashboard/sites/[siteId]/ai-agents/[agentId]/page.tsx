/**
 * AI Agent Detail Page
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 */

import { Suspense } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Bot, Settings, Zap, History, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/server"
import { getAgent, deleteAgent } from "@/lib/ai-agents/actions"
import { AgentBuilder } from "@/components/ai-agents/agent-builder"
import { AGENT_TEMPLATES } from "@/lib/ai-agents/templates"
import { PLATFORM } from "@/lib/constants/platform"

export const metadata: Metadata = {
  title: `Agent Details | ${PLATFORM.name}`,
  description: "View and manage AI agent"
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[600px]" />
    </div>
  )
}

interface AgentDetailPageProps {
  params: Promise<{ siteId: string; agentId: string }>
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { siteId, agentId } = await params
  const agent = await getAgent(agentId)

  if (!agent) {
    notFound()
  }

  async function handleDelete() {
    'use server'
    await deleteAgent(agentId)
    redirect(`/dashboard/sites/${siteId}/ai-agents`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href={`/dashboard/sites/${siteId}/ai-agents`}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to AI Agents
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8" />
            {agent.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{agent.agentType}</Badge>
            <Badge variant={agent.isActive ? "default" : "secondary"}>
              {agent.isActive ? "Active" : "Paused"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/sites/${siteId}/ai-agents/${agentId}/executions`}>
              <History className="h-4 w-4 mr-2" /> Execution History
            </Link>
          </Button>
          <Button>
            <Zap className="h-4 w-4 mr-2" /> Test Run
          </Button>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="executions">Executions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p>{agent.description || 'No description'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">LLM Provider</p>
                    <p>{agent.llmProvider} / {agent.llmModel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Temperature</p>
                    <p>{agent.temperature}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Max Tokens</p>
                    <p>{agent.maxTokens}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  {agent.goals.length === 0 ? (
                    <p className="text-muted-foreground">No goals configured</p>
                  ) : (
                    <ul className="space-y-2">
                      {agent.goals.map((goal, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary font-medium">{i + 1}.</span>
                          <div>
                            <p className="font-medium">{goal.name}</p>
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Triggers</CardTitle>
                </CardHeader>
                <CardContent>
                  {agent.triggerEvents.length === 0 ? (
                    <p className="text-muted-foreground">No triggers configured (manual only)</p>
                  ) : (
                    <ul className="space-y-1">
                      {agent.triggerEvents.map((event, i) => (
                        <li key={i}>
                          <Badge variant="outline">{event}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Constraints</CardTitle>
                </CardHeader>
                <CardContent>
                  {agent.constraints.length === 0 ? (
                    <p className="text-muted-foreground">No constraints configured</p>
                  ) : (
                    <ul className="space-y-1 list-disc list-inside">
                      {agent.constraints.map((constraint, i) => (
                        <li key={i} className="text-sm">{constraint}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="edit">
            <AgentBuilder
              siteId={siteId}
              initialAgent={agent}
              templates={AGENT_TEMPLATES}
              onSave={async () => {
                'use server'
                // Handle save
                redirect(`/dashboard/sites/${siteId}/ai-agents/${agentId}`)
              }}
            />
          </TabsContent>

          <TabsContent value="executions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Executions</CardTitle>
                <CardDescription>
                  Last 10 executions of this agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No executions yet. Run the agent to see execution history.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for this agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={handleDelete}>
                  <Button type="submit" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Agent
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Suspense>
    </div>
  )
}
