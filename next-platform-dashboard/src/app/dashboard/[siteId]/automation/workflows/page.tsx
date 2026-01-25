/**
 * Workflows List Page
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * View and manage all automation workflows.
 */

import { Suspense } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Plus, Search } from "lucide-react"
import { WorkflowListCard } from "@/modules/automation/components/workflow-list-card"

export const metadata: Metadata = {
  title: "Workflows | Automation | DRAMAC",
  description: "Manage your automation workflows"
}

// ============================================================================
// TYPES
// ============================================================================

interface Workflow {
  id: string
  name: string
  description: string | null
  is_active: boolean
  trigger_type: string
  created_at: string
  updated_at: string
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getWorkflows(siteId: string, statusFilter?: string): Promise<Workflow[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from("automation_workflows")
    .select("id, name, description, is_active, trigger_type, created_at, updated_at")
    .eq("site_id", siteId)
    .order("updated_at", { ascending: false })
  
  // Filter by is_active boolean based on status string
  if (statusFilter === "active") {
    query = query.eq("is_active", true)
  } else if (statusFilter === "paused") {
    query = query.eq("is_active", false)
  }
  // "all" or undefined: no filter
  
  const { data, error } = await query

  if (error) {
    console.error("Error fetching workflows:", error)
    return []
  }

  // Map data to ensure proper types (handle nulls)
  return (data || []).map((w): Workflow => ({
    id: w.id,
    name: w.name,
    description: w.description,
    is_active: w.is_active ?? false,
    trigger_type: w.trigger_type ?? 'manual',
    created_at: w.created_at ?? new Date().toISOString(),
    updated_at: w.updated_at ?? new Date().toISOString(),
  }))
}

// ============================================================================
// COMPONENTS
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  )
}

async function WorkflowsListContent({ siteId }: { siteId: string }) {
  const workflows = await getWorkflows(siteId)

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search workflows..." className="pl-9" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="updated">
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Last Updated</SelectItem>
            <SelectItem value="created">Date Created</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
        <Link href={`/dashboard/${siteId}/automation/workflows/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </Link>
      </div>

      {/* Workflows Grid */}
      {workflows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-medium mb-2">No Workflows Found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first workflow or try a template to get started.
            </p>
            <div className="flex gap-2 justify-center">
              <Link href={`/dashboard/${siteId}/automation/workflows/new`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </Link>
              <Link href={`/dashboard/${siteId}/automation/templates`}>
                <Button variant="outline">
                  Browse Templates
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <WorkflowListCard 
              key={workflow.id} 
              workflow={workflow} 
              siteId={siteId} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// PAGE
// ============================================================================

interface WorkflowsPageProps {
  params: Promise<{ siteId: string }>
}

export default async function WorkflowsPage({ params }: WorkflowsPageProps) {
  const { siteId } = await params

  return (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <div className="border-b px-6 py-3 flex items-center justify-between">
        <Link href={`/dashboard/${siteId}/automation`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Automation
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">All Workflows</h1>
        <div className="w-24" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<LoadingSkeleton />}>
          <WorkflowsListContent siteId={siteId} />
        </Suspense>
      </div>
    </div>
  )
}
