'use client'

/**
 * Social Settings Page Component
 * 
 * Client component for managing team permissions and approval workflows
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Users, 
  Shield, 
  Settings, 
  Plus,
  Trash2,
  Edit2,
  GitBranch,
  Info
} from 'lucide-react'
import { 
  upsertTeamPermission, 
  deleteTeamPermission,
  createApprovalWorkflow,
  updateApprovalWorkflow,
  deleteApprovalWorkflow,
  getRoleDefaults
} from '../actions/team-actions'
import type { TeamPermission, ApprovalWorkflow, TeamRole } from '../types'
import { toast } from 'sonner'

interface SocialSettingsPageProps {
  siteId: string
  tenantId: string
  userId: string
  teamPermissions: TeamPermission[]
  approvalWorkflows: ApprovalWorkflow[]
}

const ROLE_OPTIONS: { value: TeamRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Full access to all features' },
  { value: 'manager', label: 'Manager', description: 'Can manage team and approve posts' },
  { value: 'publisher', label: 'Publisher', description: 'Can publish and schedule posts' },
  { value: 'creator', label: 'Creator', description: 'Can create posts, requires approval' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to analytics' },
]

export function SocialSettingsPage({
  siteId,
  tenantId,
  userId,
  teamPermissions,
  approvalWorkflows,
}: SocialSettingsPageProps) {
  const router = useRouter()
  const [permissions, setPermissions] = useState(teamPermissions)
  const [workflows, setWorkflows] = useState(approvalWorkflows)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isAddWorkflowOpen, setIsAddWorkflowOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<TeamPermission | null>(null)
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | null>(null)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Social Media Settings</h1>
        <p className="text-muted-foreground">
          Manage team permissions and approval workflows
        </p>
      </div>
      
      <Tabs defaultValue="team" className="space-y-6">
        <TabsList>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team Permissions
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <GitBranch className="h-4 w-4 mr-2" />
            Approval Workflows
          </TabsTrigger>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
        </TabsList>
        
        {/* Team Permissions Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Assign roles and permissions to team members
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddMemberOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {permissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No team members added yet</p>
                  <p className="text-sm">Add team members to assign permissions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {permissions.map((permission) => (
                    <TeamMemberCard
                      key={permission.id}
                      permission={permission}
                      onEdit={() => setEditingPermission(permission)}
                      onDelete={async () => {
                        const { success } = await deleteTeamPermission(siteId, permission.userId)
                        if (success) {
                          setPermissions(prev => prev.filter(p => p.id !== permission.id))
                          toast.success('Team member removed')
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Role Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role Reference</CardTitle>
              <CardDescription>
                Understanding what each role can do
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ROLE_OPTIONS.map((role) => (
                  <div key={role.value} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">{role.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                    <RolePermissionsList role={role.value} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Approval Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Approval Workflows</CardTitle>
                  <CardDescription>
                    Define when posts require approval before publishing
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddWorkflowOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Workflow
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {workflows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No approval workflows configured</p>
                  <p className="text-sm">Create workflows to require approval for certain posts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <WorkflowCard
                      key={workflow.id}
                      workflow={workflow}
                      onEdit={() => setEditingWorkflow(workflow)}
                      onDelete={async () => {
                        const { success } = await deleteApprovalWorkflow(workflow.id, siteId)
                        if (success) {
                          setWorkflows(prev => prev.filter(w => w.id !== workflow.id))
                          toast.success('Workflow deleted')
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">How Approval Workflows Work</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    When a post matches a workflow&apos;s conditions, it will be set to &quot;pending_approval&quot; 
                    status instead of being published directly. Managers and admins can then 
                    approve or reject the post from the Approvals page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Settings</CardTitle>
              <CardDescription>
                Configure default behavior for the social media module
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require approval for all posts</Label>
                  <p className="text-sm text-muted-foreground">
                    All posts will require manager approval before publishing
                  </p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-archive failed posts</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically archive posts that fail to publish after 3 attempts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable post templates</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow team members to create and use post templates
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications for approvals and mentions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                <div>
                  <p className="font-medium">Disconnect All Accounts</p>
                  <p className="text-sm text-muted-foreground">
                    Remove all connected social media accounts
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Disconnect All
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                <div>
                  <p className="font-medium">Clear Analytics Data</p>
                  <p className="text-sm text-muted-foreground">
                    Delete all historical analytics data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Clear Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Member Dialog */}
      <AddMemberDialog
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        siteId={siteId}
        onSuccess={(permission) => {
          setPermissions(prev => [...prev, permission])
          toast.success('Team member added')
        }}
      />
      
      {/* Edit Member Dialog */}
      {editingPermission && (
        <EditMemberDialog
          open={!!editingPermission}
          onOpenChange={() => setEditingPermission(null)}
          permission={editingPermission}
          siteId={siteId}
          onSuccess={(updated) => {
            setPermissions(prev => prev.map(p => p.id === updated.id ? updated : p))
            toast.success('Team member updated')
          }}
        />
      )}
      
      {/* Add Workflow Dialog */}
      <AddWorkflowDialog
        open={isAddWorkflowOpen}
        onOpenChange={setIsAddWorkflowOpen}
        siteId={siteId}
        tenantId={tenantId}
        userId={userId}
        onSuccess={(workflow) => {
          setWorkflows(prev => [...prev, workflow])
          toast.success('Workflow created')
        }}
      />
      
      {/* Edit Workflow Dialog */}
      {editingWorkflow && (
        <EditWorkflowDialog
          open={!!editingWorkflow}
          onOpenChange={() => setEditingWorkflow(null)}
          workflow={editingWorkflow}
          siteId={siteId}
          onSuccess={(updated) => {
            setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w))
            toast.success('Workflow updated')
          }}
        />
      )}
    </div>
  )
}

function TeamMemberCard({
  permission,
  onEdit,
  onDelete,
}: {
  permission: TeamPermission
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{permission.userId}</p>
          <Badge variant="secondary" className="mt-1">
            {permission.role}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

function RolePermissionsList({ role }: { role: TeamRole }) {
  const defaults = getRoleDefaults(role)
  
  return (
    <ul className="mt-2 text-xs space-y-1">
      <li className={defaults.canPublishPosts ? 'text-green-600' : 'text-muted-foreground'}>
        {defaults.canPublishPosts ? '✓' : '✗'} Publish posts
      </li>
      <li className={defaults.canSchedulePosts ? 'text-green-600' : 'text-muted-foreground'}>
        {defaults.canSchedulePosts ? '✓' : '✗'} Schedule posts
      </li>
      <li className={defaults.canApprovePosts ? 'text-green-600' : 'text-muted-foreground'}>
        {defaults.canApprovePosts ? '✓' : '✗'} Approve posts
      </li>
      <li className={defaults.canManageTeam ? 'text-green-600' : 'text-muted-foreground'}>
        {defaults.canManageTeam ? '✓' : '✗'} Manage team
      </li>
      <li className={defaults.canViewAnalytics ? 'text-green-600' : 'text-muted-foreground'}>
        {defaults.canViewAnalytics ? '✓' : '✗'} View analytics
      </li>
    </ul>
  )
}

function WorkflowCard({
  workflow,
  onEdit,
  onDelete,
}: {
  workflow: ApprovalWorkflow
  onEdit: () => void
  onDelete: () => void
}) {
  const stepCount = workflow.steps?.length || 0
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${workflow.isActive ? 'bg-green-100' : 'bg-muted'}`}>
          <GitBranch className={`h-5 w-5 ${workflow.isActive ? 'text-green-600' : ''}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{workflow.name}</p>
            {workflow.isActive ? (
              <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {stepCount} step{stepCount !== 1 ? 's' : ''}
            {workflow.triggerConditions?.platforms && ` • ${workflow.triggerConditions.platforms.length} platforms`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

function AddMemberDialog({
  open,
  onOpenChange,
  siteId,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  onSuccess: (permission: TeamPermission) => void
}) {
  const [newUserId, setNewUserId] = useState('')
  const [role, setRole] = useState<TeamRole>('creator')
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async () => {
    if (!newUserId) return
    
    setIsLoading(true)
    
    try {
      const { permission, error } = await upsertTeamPermission(siteId, newUserId, {
        role,
      })
      
      if (error) throw new Error(error)
      if (permission) {
        onSuccess(permission)
        onOpenChange(false)
        setNewUserId('')
        setRole('creator')
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to add team member')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a user and assign their role for social media management
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label>User ID or Email</Label>
            <Input
              placeholder="Enter user ID or email"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <span>{option.label}</span>
                      <span className="text-muted-foreground ml-2">- {option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !newUserId}>
            {isLoading ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditMemberDialog({
  open,
  onOpenChange,
  permission,
  siteId,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  permission: TeamPermission
  siteId: string
  onSuccess: (permission: TeamPermission) => void
}) {
  const [role, setRole] = useState<TeamRole>(permission.role)
  const [canPublishPosts, setCanPublishPosts] = useState(permission.canPublishPosts)
  const [canSchedulePosts, setCanSchedulePosts] = useState(permission.canSchedulePosts)
  const [canApprovePosts, setCanApprovePosts] = useState(permission.canApprovePosts)
  const [canManageTeam, setCanManageTeam] = useState(permission.canManageTeam)
  const [canViewAnalytics, setCanViewAnalytics] = useState(permission.canViewAnalytics)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async () => {
    setIsLoading(true)
    
    try {
      const { permission: updated, error } = await upsertTeamPermission(siteId, permission.userId, {
        role,
        canPublishPosts,
        canSchedulePosts,
        canApprovePosts,
        canManageTeam,
        canViewAnalytics,
      })
      
      if (error) throw new Error(error)
      if (updated) {
        onSuccess(updated)
        onOpenChange(false)
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to update team member')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update role and permissions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label>Custom Permissions</Label>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Can Publish</span>
              <Switch checked={canPublishPosts} onCheckedChange={setCanPublishPosts} />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Can Schedule</span>
              <Switch checked={canSchedulePosts} onCheckedChange={setCanSchedulePosts} />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Can Approve</span>
              <Switch checked={canApprovePosts} onCheckedChange={setCanApprovePosts} />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Can Manage Team</span>
              <Switch checked={canManageTeam} onCheckedChange={setCanManageTeam} />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Can View Analytics</span>
              <Switch checked={canViewAnalytics} onCheckedChange={setCanViewAnalytics} />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddWorkflowDialog({
  open,
  onOpenChange,
  siteId,
  tenantId,
  userId,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  tenantId: string
  userId: string
  onSuccess: (workflow: ApprovalWorkflow) => void
}) {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async () => {
    if (!name) return
    
    setIsLoading(true)
    
    try {
      const { workflow, error } = await createApprovalWorkflow(siteId, tenantId, userId, {
        name,
        triggerConditions: { always: true },
        steps: [{
          order: 1,
          approvers: [userId],
          type: 'any',
          timeoutHours: 24,
        }],
      })
      
      if (error) throw new Error(error)
      if (workflow) {
        onSuccess(workflow)
        onOpenChange(false)
        setName('')
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to create workflow')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Approval Workflow</DialogTitle>
          <DialogDescription>
            Define a new approval workflow for posts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label>Workflow Name</Label>
            <Input
              placeholder="e.g., Brand Posts Approval"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !name}>
            {isLoading ? 'Creating...' : 'Create Workflow'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditWorkflowDialog({
  open,
  onOpenChange,
  workflow,
  siteId,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflow: ApprovalWorkflow
  siteId: string
  onSuccess: (workflow: ApprovalWorkflow) => void
}) {
  const [name, setName] = useState(workflow.name)
  const [isActive, setIsActive] = useState(workflow.isActive)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async () => {
    setIsLoading(true)
    
    try {
      const { workflow: updated, error } = await updateApprovalWorkflow(workflow.id, siteId, {
        name,
        isActive,
      })
      
      if (error) throw new Error(error)
      if (updated) {
        onSuccess(updated)
        onOpenChange(false)
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to update workflow')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Workflow</DialogTitle>
          <DialogDescription>
            Update approval workflow settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label>Workflow Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
