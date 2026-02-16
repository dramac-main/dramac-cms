'use client'

/**
 * AgentsPageWrapper — Agent management with CRUD, status, and performance
 */

import { useState, useCallback, useTransition, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Users,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { AgentStatusDot } from '../shared/AgentStatusDot'
import { LiveChatEmptyState } from '../shared/LiveChatEmptyState'
import {
  createAgent,
  updateAgent,
  deleteAgent,
  getAgencyMembersForSite,
} from '@/modules/live-chat/actions/agent-actions'
import type { AgencyMember } from '@/modules/live-chat/actions/agent-actions'
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  setDefaultDepartment,
} from '@/modules/live-chat/actions/department-actions'
import type {
  ChatAgent,
  ChatDepartment,
  AgentPerformanceData,
  AgentRole,
} from '@/modules/live-chat/types'

interface AgentsPageWrapperProps {
  agents: ChatAgent[]
  departments: (ChatDepartment & { agentCount: number })[]
  performance: AgentPerformanceData[]
  siteId: string
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

export function AgentsPageWrapper({
  agents: initialAgents,
  departments: initialDepartments,
  performance,
  siteId,
}: AgentsPageWrapperProps) {
  const [isPending, startTransition] = useTransition()
  const [agents, setAgents] = useState(initialAgents)
  const [departments, setDepartments] = useState(initialDepartments)
  const [showAddAgent, setShowAddAgent] = useState(false)
  const [showAddDept, setShowAddDept] = useState(false)
  const [agencyMembers, setAgencyMembers] = useState<AgencyMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  // Fetch agency members when Add Agent dialog opens
  const loadAgencyMembers = useCallback(() => {
    setMembersLoading(true)
    getAgencyMembersForSite(siteId)
      .then(({ members }) => {
        // Filter out users already added as agents
        const existingUserIds = new Set(agents.map(a => a.userId))
        setAgencyMembers(members.filter(m => !existingUserIds.has(m.userId)))
      })
      .finally(() => setMembersLoading(false))
  }, [siteId, agents])

  // Add agent form state
  const [agentForm, setAgentForm] = useState({
    userId: '',
    displayName: '',
    email: '',
    role: 'agent' as AgentRole,
    departmentId: '',
    maxConcurrentChats: 5,
  })

  // Edit agent state
  const [editingAgent, setEditingAgent] = useState<ChatAgent | null>(null)
  const [showEditAgent, setShowEditAgent] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    role: 'agent' as AgentRole,
    departmentId: '',
    maxConcurrentChats: 5,
  })

  // Add department form state
  const [deptForm, setDeptForm] = useState({
    name: '',
    description: '',
    autoAssign: true,
  })

  const handleAddAgent = useCallback(() => {
    if (!agentForm.userId || !agentForm.displayName) {
      toast.error('User ID and display name are required')
      return
    }
    startTransition(async () => {
      const result = await createAgent({
        siteId,
        userId: agentForm.userId,
        displayName: agentForm.displayName,
        email: agentForm.email || undefined,
        role: agentForm.role,
        departmentId: agentForm.departmentId || undefined,
        maxConcurrentChats: agentForm.maxConcurrentChats,
      })
      if (result.error) {
        toast.error(result.error)
      } else if (result.agent) {
        setAgents((prev) => [...prev, result.agent!])
        setShowAddAgent(false)
        setAgentForm({
          userId: '',
          displayName: '',
          email: '',
          role: 'agent',
          departmentId: '',
          maxConcurrentChats: 5,
        })
        toast.success('Agent added')
      }
    })
  }, [agentForm, siteId])

  const handleDeleteAgent = useCallback(
    (agentId: string) => {
      startTransition(async () => {
        const result = await deleteAgent(agentId)
        if (result.error) {
          toast.error(result.error)
        } else {
          setAgents((prev) => prev.filter((a) => a.id !== agentId))
          toast.success('Agent removed')
        }
      })
    },
    []
  )

  const handleEditAgent = useCallback(
    (agent: ChatAgent) => {
      setEditingAgent(agent)
      setEditForm({
        displayName: agent.displayName,
        email: agent.email || '',
        role: (agent.role as AgentRole) || 'agent',
        departmentId: agent.departmentId || '',
        maxConcurrentChats: agent.maxConcurrentChats || 5,
      })
      setShowEditAgent(true)
    },
    []
  )

  const handleSaveEdit = useCallback(() => {
    if (!editingAgent || !editForm.displayName) {
      toast.error('Display name is required')
      return
    }
    startTransition(async () => {
      const result = await updateAgent(editingAgent.id, {
        displayName: editForm.displayName,
        email: editForm.email || undefined,
        role: editForm.role,
        departmentId: editForm.departmentId || null,
        maxConcurrentChats: editForm.maxConcurrentChats,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === editingAgent.id
              ? ({
                  ...a,
                  displayName: editForm.displayName,
                  email: editForm.email || a.email,
                  role: editForm.role,
                  departmentId: editForm.departmentId || undefined,
                  maxConcurrentChats: editForm.maxConcurrentChats,
                } as ChatAgent)
              : a
          )
        )
        setShowEditAgent(false)
        setEditingAgent(null)
        toast.success('Agent updated')
      }
    })
  }, [editingAgent, editForm])

  const handleAddDepartment = useCallback(() => {
    if (!deptForm.name) {
      toast.error('Department name is required')
      return
    }
    startTransition(async () => {
      const result = await createDepartment({
        siteId,
        name: deptForm.name,
        description: deptForm.description || undefined,
        autoAssign: deptForm.autoAssign,
      })
      if (result.error) {
        toast.error(result.error)
      } else if (result.department) {
        setDepartments((prev) => [...prev, { ...result.department!, agentCount: 0 } as typeof prev[0]])
        setShowAddDept(false)
        setDeptForm({ name: '', description: '', autoAssign: true })
        toast.success('Department created')
      }
    })
  }, [deptForm, siteId])

  const handleDeleteDepartment = useCallback(
    (deptId: string) => {
      startTransition(async () => {
        const result = await deleteDepartment(deptId)
        if (result.error) {
          toast.error(result.error)
        } else {
          setDepartments((prev) => prev.filter((d) => d.id !== deptId))
          toast.success('Department deleted')
        }
      })
    },
    []
  )

  const handleSetDefaultDept = useCallback(
    (deptId: string) => {
      startTransition(async () => {
        const result = await setDefaultDepartment(siteId, deptId)
        if (result.error) {
          toast.error(result.error)
        } else {
          setDepartments((prev) =>
            prev.map((d) => ({ ...d, isDefault: d.id === deptId }))
          )
          toast.success('Default department updated')
        }
      })
    },
    [siteId]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agents</h2>
          <p className="text-muted-foreground">
            Manage chat agents and departments
          </p>
        </div>
        <Dialog open={showAddAgent} onOpenChange={(open) => {
          setShowAddAgent(open)
          if (open) loadAgencyMembers()
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Chat Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Team Member</Label>
                {membersLoading ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading members...
                  </div>
                ) : agencyMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No available members. All team members are already agents.
                  </p>
                ) : (
                  <Select
                    value={agentForm.userId || 'none'}
                    onValueChange={(val) => {
                      if (val === 'none') {
                        setAgentForm({ ...agentForm, userId: '', displayName: '', email: '' })
                        return
                      }
                      const member = agencyMembers.find(m => m.userId === val)
                      if (member) {
                        setAgentForm({
                          ...agentForm,
                          userId: member.userId,
                          displayName: member.name || member.email.split('@')[0],
                          email: member.email,
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select a team member</SelectItem>
                      {agencyMembers.map((member) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          {member.name || member.email} ({member.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={agentForm.displayName}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, displayName: e.target.value })
                  }
                  placeholder="Agent name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={agentForm.email}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, email: e.target.value })
                  }
                  placeholder="agent@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={agentForm.role}
                    onValueChange={(val) =>
                      setAgentForm({ ...agentForm, role: val as AgentRole })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Concurrent Chats</Label>
                  <Input
                    type="number"
                    value={agentForm.maxConcurrentChats}
                    onChange={(e) =>
                      setAgentForm({
                        ...agentForm,
                        maxConcurrentChats: parseInt(e.target.value) || 5,
                      })
                    }
                    min={1}
                    max={20}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={agentForm.departmentId || 'none'}
                  onValueChange={(val) =>
                    setAgentForm({
                      ...agentForm,
                      departmentId: val === 'none' ? '' : val,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddAgent}
                disabled={isPending || !agentForm.userId || !agentForm.displayName}
                className="w-full"
              >
                {isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Add Agent
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agent cards */}
      {agents.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <LiveChatEmptyState
              icon={Users}
              title="No agents configured"
              description="Add agents to your live chat to start handling customer conversations"
              action={{
                label: 'Add First Agent',
                onClick: () => setShowAddAgent(true),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents
            .sort((a, b) => {
              const order = { online: 0, away: 1, busy: 2, offline: 3 }
              return order[a.status] - order[b.status]
            })
            .map((agent) => {
              const perf = performance.find((p) => p.agentId === agent.id)
              return (
                <Card key={agent.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {getInitials(agent.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="absolute -bottom-0.5 -right-0.5">
                            <AgentStatusDot status={agent.status} />
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {agent.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {agent.email || 'No email'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {agent.role}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Active</p>
                        <p className="font-medium">
                          {agent.currentChatCount}/{agent.maxConcurrentChats}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Total</p>
                        <p className="font-medium">
                          {perf?.totalChats ?? agent.totalChatsHandled}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Avg Response
                        </p>
                        <p className="font-medium">
                          {perf?.avgResponseTime
                            ? formatDuration(perf.avgResponseTime)
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Rating</p>
                        <p className="font-medium">
                          {perf?.avgRating
                            ? `${perf.avgRating.toFixed(1)}/5`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditAgent(agent)}
                        disabled={isPending}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeleteAgent(agent.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}

      {/* Edit Agent Dialog */}
      <Dialog open={showEditAgent} onOpenChange={setShowEditAgent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={editForm.displayName}
                onChange={(e) =>
                  setEditForm({ ...editForm, displayName: e.target.value })
                }
                placeholder="Agent name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                placeholder="agent@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(val) =>
                    setEditForm({ ...editForm, role: val as AgentRole })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Concurrent Chats</Label>
                <Input
                  type="number"
                  value={editForm.maxConcurrentChats}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      maxConcurrentChats: parseInt(e.target.value) || 5,
                    })
                  }
                  min={1}
                  max={20}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={editForm.departmentId || 'none'}
                onValueChange={(val) =>
                  setEditForm({
                    ...editForm,
                    departmentId: val === 'none' ? '' : val,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSaveEdit}
              disabled={isPending || !editForm.displayName}
              className="w-full"
            >
              {isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Departments section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Departments</h3>
          <Dialog open={showAddDept} onOpenChange={setShowAddDept}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Department</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={deptForm.name}
                    onChange={(e) =>
                      setDeptForm({ ...deptForm, name: e.target.value })
                    }
                    placeholder="e.g. Sales, Support, Billing"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={deptForm.description}
                    onChange={(e) =>
                      setDeptForm({
                        ...deptForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional description"
                  />
                </div>
                <Button
                  onClick={handleAddDepartment}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Department
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {departments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              No departments configured. Add departments to organize agents.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Auto-Assign</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">
                        {dept.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dept.description || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={dept.autoAssign ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {dept.autoAssign ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {dept.isDefault ? (
                          <Badge className="text-xs">Default</Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleSetDefaultDept(dept.id)}
                            disabled={isPending}
                          >
                            Set Default
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!dept.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDeleteDepartment(dept.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
