/**
 * AI Agents Dashboard Page
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 * 
 * Main dashboard page for AI agents showing agent list,
 * quick stats, and access to all AI agent features.
 */

import { Suspense } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft,
  Bot,
  Activity, 
  CheckCircle2, 
  CircleX, 
  Store,
  BarChart3,
  TestTube,
  CreditCard,
  MoreHorizontal,
  PlayCircle,
  PauseCircle,
  Settings,
  Plus,
  Brain,
  Zap,
  Clock
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PLATFORM } from "@/lib/constants/platform"

export const metadata: Metadata = {
  title: `AI Agents | ${PLATFORM.name}`,
  description: "AI Agents - Intelligent automation agents for your business"
}

// ============================================================================
// TYPES
// ============================================================================

interface Agent {
  id: string
  name: string
  description: string | null
  type: string
  is_active: boolean
  created_at: string
  updated_at: string
  execution_count: number
  last_executed_at: string | null
  success_rate: number
}

interface AIAgentsStats {
  totalAgents: number
  activeAgents: number
  totalExecutions: number
  successRate: number
  tokensUsed: number
  pendingApprovals: number
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getAgents(siteId: string): Promise<Agent[]> {
  const supabase = await createClient()
  
  // Cast to any since AI agent tables aren't in TypeScript types yet
  const { data, error } = await (supabase as any)
    .from("ai_agents")
    .select(`
      id,
      name,
      description,
      type,
      is_active,
      created_at,
      updated_at
    `)
    .eq("site_id", siteId)
    .order("updated_at", { ascending: false })
    .limit(10)
  
  if (error) {
    console.error("Error fetching agents:", error)
    return []
  }

  // Fetch execution stats for each agent
  const agentIds = (data || []).map((a: any) => a.id)
  
  if (agentIds.length === 0) {
    return []
  }

  // Get execution counts per agent
  const { data: executionData } = await (supabase as any)
    .from("ai_agent_executions")
    .select("agent_id, status, created_at")
    .eq("site_id", siteId)
    .in("agent_id", agentIds)
    .order("created_at", { ascending: false })
  
  // Aggregate stats
  const executionStats: Record<string, { 
    count: number
    successful: number
    lastExecuted: string | null 
  }> = {}
  
  for (const exec of (executionData || []) as any[]) {
    if (!executionStats[exec.agent_id]) {
      executionStats[exec.agent_id] = { 
        count: 0, 
        successful: 0,
        lastExecuted: exec.created_at 
      }
    }
    executionStats[exec.agent_id].count++
    if (exec.status === 'completed') {
      executionStats[exec.agent_id].successful++
    }
  }

  return (data || []).map((a: any): Agent => {
    const stats = executionStats[a.id] || { count: 0, successful: 0, lastExecuted: null }
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      type: a.type ?? 'assistant',
      is_active: a.is_active ?? false,
      created_at: a.created_at ?? new Date().toISOString(),
      updated_at: a.updated_at ?? new Date().toISOString(),
      execution_count: stats.count,
      last_executed_at: stats.lastExecuted,
      success_rate: stats.count > 0 ? (stats.successful / stats.count) * 100 : 0
    }
  })
}

async function getAIAgentsStats(siteId: string): Promise<AIAgentsStats> {
  const supabase = await createClient()
  
  // Cast to any since AI agent tables aren't in TypeScript types yet
  const db = supabase as any
  
  // Get agent counts
  const { count: totalAgents } = await db
    .from("ai_agents")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)

  const { count: activeAgents } = await db
    .from("ai_agents")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("is_active", true)

  // Get execution stats
  const { count: totalExecutions } = await db
    .from("ai_agent_executions")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)

  const { count: successfulExecutions } = await db
    .from("ai_agent_executions")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("status", "completed")

  // Get pending approvals
  const { count: pendingApprovals } = await db
    .from("ai_agent_approvals")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("status", "pending")

  // Get tokens used (from usage tracking)
  const { data: usageData } = await db
    .from("ai_usage_tracking")
    .select("tokens_input, tokens_output")
    .eq("site_id", siteId)

  const tokensUsed = (usageData || []).reduce(
    (sum: number, u: any) => sum + (u.tokens_input || 0) + (u.tokens_output || 0),
    0
  )

  const successRate = totalExecutions && totalExecutions > 0
    ? ((successfulExecutions || 0) / totalExecutions) * 100
    : 0

  return {
    totalAgents: totalAgents || 0,
    activeAgents: activeAgents || 0,
    totalExecutions: totalExecutions || 0,
    successRate,
    tokensUsed,
    pendingApprovals: pendingApprovals || 0
  }
}

// ============================================================================
// COMPONENTS
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend
}: { 
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  description?: string
  trend?: { value: number; positive: boolean }
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}% from last week
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function AgentTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    task: 'bg-blue-100 text-blue-800',
    assistant: 'bg-purple-100 text-purple-800',
    autonomous: 'bg-orange-100 text-orange-800',
    workflow: 'bg-green-100 text-green-800',
  }
  
  return (
    <Badge variant="secondary" className={styles[type] || 'bg-gray-100 text-gray-800'}>
      {type}
    </Badge>
  )
}

function AgentCard({ agent, siteId }: { agent: Agent; siteId: string }) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Link 
                href={`/dashboard/sites/${siteId}/ai-agents/${agent.id}`}
                className="font-semibold hover:underline"
              >
                {agent.name}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <AgentTypeBadge type={agent.type} />
                {agent.is_active ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <PlayCircle className="h-3 w-3 mr-1" /> Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500">
                    <PauseCircle className="h-3 w-3 mr-1" /> Paused
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/sites/${siteId}/ai-agents/${agent.id}`}>
                  <Settings className="h-4 w-4 mr-2" /> Configure
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Zap className="h-4 w-4 mr-2" /> Test Run
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                {agent.is_active ? (
                  <>
                    <PauseCircle className="h-4 w-4 mr-2" /> Pause
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" /> Activate
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {agent.description || 'No description'}
        </p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Executions</p>
            <p className="font-medium">{agent.execution_count}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Success Rate</p>
            <p className="font-medium">
              {agent.execution_count > 0 ? `${agent.success_rate.toFixed(0)}%` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Last Run</p>
            <p className="font-medium">
              {agent.last_executed_at 
                ? new Date(agent.last_executed_at).toLocaleDateString()
                : 'Never'
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

async function AIAgentsContent({ siteId }: { siteId: string }) {
  const [agents, stats] = await Promise.all([
    getAgents(siteId),
    getAIAgentsStats(siteId)
  ])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href={`/sites/${siteId}`}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Site
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            AI Agents
          </h1>
          <p className="text-muted-foreground mt-1">
            Intelligent automation agents for your business
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/sites/${siteId}/ai-agents/new`}>
            <Plus className="h-4 w-4 mr-2" /> Create Agent
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Agents"
          value={stats.totalAgents}
          icon={Bot}
          description={`${stats.activeAgents} active`}
        />
        <StatCard
          title="Executions"
          value={stats.totalExecutions}
          icon={Activity}
          description="Total runs"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate.toFixed(0)}%`}
          icon={CheckCircle2}
        />
        <StatCard
          title="Tokens Used"
          value={stats.tokensUsed.toLocaleString()}
          icon={Zap}
          description="This month"
        />
      </div>

      {/* Pending Approvals Alert */}
      {stats.pendingApprovals > 0 && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium">Pending Approvals</p>
                <p className="text-sm text-muted-foreground">
                  {stats.pendingApprovals} agent action(s) waiting for your approval
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/sites/${siteId}/ai-agents/approvals`}>
                Review Now
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/sites/${siteId}/ai-agents/marketplace`}>
            <Store className="h-4 w-4 mr-2" /> Agent Marketplace
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/sites/${siteId}/ai-agents/analytics`}>
            <BarChart3 className="h-4 w-4 mr-2" /> Analytics
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/sites/${siteId}/ai-agents/testing`}>
            <TestTube className="h-4 w-4 mr-2" /> Testing
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/sites/${siteId}/ai-agents/usage`}>
            <CreditCard className="h-4 w-4 mr-2" /> Usage & Billing
          </Link>
        </Button>
      </div>

      {/* Agent List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Agents</h2>
          <Link 
            href={`/dashboard/sites/${siteId}/ai-agents/all`}
            className="text-sm text-primary hover:underline"
          >
            View All
          </Link>
        </div>
        
        {agents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Agents Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first AI agent or install one from the marketplace
              </p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href={`/dashboard/sites/${siteId}/ai-agents/new`}>
                    <Plus className="h-4 w-4 mr-2" /> Create Agent
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/sites/${siteId}/ai-agents/marketplace`}>
                    <Store className="h-4 w-4 mr-2" /> Browse Marketplace
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} siteId={siteId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

interface AIAgentsPageProps {
  params: Promise<{ siteId: string }>
}

export default async function AIAgentsPage({ params }: AIAgentsPageProps) {
  const { siteId } = await params

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AIAgentsContent siteId={siteId} />
    </Suspense>
  )
}
