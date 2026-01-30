/**
 * AI Agent Approvals Page
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 */

import { Suspense } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Pending Approvals | DRAMAC",
  description: "Review and approve AI agent actions"
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}

interface Approval {
  id: string
  agent_id: string
  execution_id: string
  tool_name: string
  tool_input: Record<string, unknown>
  reason: string
  status: 'pending' | 'approved' | 'denied' | 'expired'
  created_at: string
  expires_at: string
  agent: {
    name: string
  }
}

async function getPendingApprovals(siteId: string): Promise<Approval[]> {
  const supabase = await createClient()
  
  // Cast to any since AI agent tables aren't in TypeScript types yet
  const { data, error } = await (supabase as any)
    .from("ai_agent_approvals")
    .select(`
      id,
      agent_id,
      execution_id,
      tool_name,
      tool_input,
      reason,
      status,
      created_at,
      expires_at,
      agent:ai_agents(name)
    `)
    .eq("site_id", siteId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
  
  if (error) {
    console.error("Error fetching approvals:", error)
    return []
  }
  
  return (data || []).map((d: any) => ({
    ...d,
    agent: Array.isArray(d.agent) ? d.agent[0] : d.agent
  })) as Approval[]
}

function ApprovalCard({ approval, siteId }: { approval: Approval; siteId: string }) {
  const isExpiringSoon = new Date(approval.expires_at).getTime() - Date.now() < 3600000 // 1 hour

  return (
    <Card className={isExpiringSoon ? 'border-amber-500' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Approval Required
            </CardTitle>
            <CardDescription>
              Agent: {approval.agent?.name || 'Unknown'} • Tool: {approval.tool_name}
            </CardDescription>
          </div>
          {isExpiringSoon && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Expiring Soon
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Reason for Approval</p>
          <p className="text-sm text-muted-foreground">{approval.reason}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-1">Action Details</p>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            {JSON.stringify(approval.tool_input, null, 2)}
          </pre>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Requested: {new Date(approval.created_at).toLocaleString()}</span>
          <span>Expires: {new Date(approval.expires_at).toLocaleString()}</span>
        </div>

        <div className="flex gap-2 pt-2">
          <form action={async () => {
            'use server'
            const supabase = await createClient()
            await (supabase as any)
              .from("ai_agent_approvals")
              .update({ status: 'approved', reviewed_at: new Date().toISOString() })
              .eq("id", approval.id)
          }}>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
            </Button>
          </form>
          <form action={async () => {
            'use server'
            const supabase = await createClient()
            await (supabase as any)
              .from("ai_agent_approvals")
              .update({ status: 'denied', reviewed_at: new Date().toISOString() })
              .eq("id", approval.id)
          }}>
            <Button type="submit" variant="destructive">
              <XCircle className="h-4 w-4 mr-2" /> Deny
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

interface ApprovalsPageProps {
  params: Promise<{ siteId: string }>
}

export default async function ApprovalsPage({ params }: ApprovalsPageProps) {
  const { siteId } = await params
  const approvals = await getPendingApprovals(siteId)

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
          <Clock className="h-8 w-8" />
          Pending Approvals
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and approve high-risk AI agent actions
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        {approvals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground text-center">
                No pending approvals at this time
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {approvals.length} approval(s) waiting for your review
            </p>
            {approvals.map((approval) => (
              <ApprovalCard key={approval.id} approval={approval} siteId={siteId} />
            ))}
          </div>
        )}
      </Suspense>
    </div>
  )
}
