'use client'

/**
 * Campaigns Page Wrapper Component
 * 
 * Client component wrapper for campaigns management with full CRUD operations
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
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  MoreHorizontal, 
  Target, 
  Calendar, 
  Trash2,
  Edit,
  Pause,
  Play,
  Archive,
  Eye,
  Heart,
  MousePointer,
  Hash,
  LucideIcon,
} from 'lucide-react'
import { 
  createCampaign, 
  updateCampaign, 
  deleteCampaign,
  pauseCampaign,
  resumeCampaign,
  archiveCampaign
} from '../actions/campaign-actions'
import type { Campaign, CampaignStatus } from '../types'
import { toast } from 'sonner'

interface CampaignsPageWrapperProps {
  siteId: string
  tenantId: string
  userId: string
  initialCampaigns: Campaign[]
  totalCampaigns?: number
}

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-gray-500',
  scheduled: 'bg-blue-500',
  active: 'bg-green-500',
  paused: 'bg-yellow-500',
  completed: 'bg-purple-500',
  archived: 'bg-gray-400',
}

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
}

export function CampaignsPageWrapper({
  siteId,
  tenantId,
  userId,
  initialCampaigns,
  totalCampaigns: _totalCampaigns,
}: CampaignsPageWrapperProps) {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    goalImpressions: '',
    goalEngagement: '',
    goalClicks: '',
    budget: '',
    hashtags: '',
  })
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      goalImpressions: '',
      goalEngagement: '',
      goalClicks: '',
      budget: '',
      hashtags: '',
    })
    setEditingCampaign(null)
  }
  
  const handleSubmit = async () => {
    if (!formData.name || !formData.startDate) {
      toast.error('Please fill in required fields')
      return
    }
    
    setIsCreating(true)
    
    try {
      const campaignData = {
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        goals: {
          impressions: formData.goalImpressions ? parseInt(formData.goalImpressions) : undefined,
          engagement: formData.goalEngagement ? parseInt(formData.goalEngagement) : undefined,
          clicks: formData.goalClicks ? parseInt(formData.goalClicks) : undefined,
        },
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        hashtags: formData.hashtags ? formData.hashtags.split(',').map(h => h.trim()) : undefined,
      }
      
      if (editingCampaign) {
        const { campaign, error } = await updateCampaign(editingCampaign.id, siteId, campaignData)
        if (error) throw new Error(error)
        
        setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? campaign! : c))
        toast.success('Campaign updated successfully')
      } else {
        const { campaign, error } = await createCampaign(siteId, tenantId, userId, campaignData)
        if (error) throw new Error(error)
        
        setCampaigns(prev => [campaign!, ...prev])
        toast.success('Campaign created successfully')
      }
      
      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      toast.error((error as Error).message || 'Failed to save campaign')
    } finally {
      setIsCreating(false)
    }
  }
  
  const handleEdit = (campaign: Campaign) => {
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      color: campaign.color,
      startDate: campaign.startDate.split('T')[0],
      endDate: campaign.endDate?.split('T')[0] || '',
      goalImpressions: campaign.goals?.impressions?.toString() || '',
      goalEngagement: campaign.goals?.engagement?.toString() || '',
      goalClicks: campaign.goals?.clicks?.toString() || '',
      budget: campaign.budget?.toString() || '',
      hashtags: campaign.hashtags?.join(', ') || '',
    })
    setEditingCampaign(campaign)
    setIsDialogOpen(true)
  }
  
  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign? Posts will be unlinked but not deleted.')) {
      return
    }
    
    const { success, error } = await deleteCampaign(campaignId, siteId)
    
    if (success) {
      setCampaigns(prev => prev.filter(c => c.id !== campaignId))
      toast.success('Campaign deleted')
      router.refresh()
    } else {
      toast.error(error || 'Failed to delete campaign')
    }
  }
  
  const handlePause = async (campaignId: string) => {
    const { success, error } = await pauseCampaign(campaignId, siteId)
    
    if (success) {
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'paused' as CampaignStatus } : c))
      toast.success('Campaign paused')
      router.refresh()
    } else {
      toast.error(error || 'Failed to pause campaign')
    }
  }
  
  const handleResume = async (campaignId: string) => {
    const { success, error } = await resumeCampaign(campaignId, siteId)
    
    if (success) {
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'active' as CampaignStatus } : c))
      toast.success('Campaign resumed')
      router.refresh()
    } else {
      toast.error(error || 'Failed to resume campaign')
    }
  }
  
  const handleArchive = async (campaignId: string) => {
    const { success, error } = await archiveCampaign(campaignId, siteId)
    
    if (success) {
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'archived' as CampaignStatus } : c))
      toast.success('Campaign archived')
      router.refresh()
    } else {
      toast.error(error || 'Failed to archive campaign')
    }
  }
  
  const activeCampaigns = campaigns.filter(c => ['active', 'scheduled'].includes(c.status))
  const pastCampaigns = campaigns.filter(c => ['completed', 'paused', 'archived'].includes(c.status))
  const draftCampaigns = campaigns.filter(c => c.status === 'draft')
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Organize your content around marketing campaigns
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
              </DialogTitle>
              <DialogDescription>
                {editingCampaign 
                  ? 'Update your campaign details'
                  : 'Set up a new marketing campaign to organize your content'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Product Launch 2026"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the campaign..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Optional"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Goals (Optional)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Impressions</Label>
                    <Input
                      type="number"
                      placeholder="50000"
                      value={formData.goalImpressions}
                      onChange={(e) => setFormData(prev => ({ ...prev, goalImpressions: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Engagements</Label>
                    <Input
                      type="number"
                      placeholder="2000"
                      value={formData.goalEngagement}
                      onChange={(e) => setFormData(prev => ({ ...prev, goalEngagement: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Clicks</Label>
                    <Input
                      type="number"
                      placeholder="500"
                      value={formData.goalClicks}
                      onChange={(e) => setFormData(prev => ({ ...prev, goalClicks: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hashtags">Hashtags</Label>
                <Input
                  id="hashtags"
                  placeholder="#productlaunch, #newproduct, #2026"
                  value={formData.hashtags}
                  onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Separate hashtags with commas
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isCreating}>
                {isCreating ? 'Saving...' : (editingCampaign ? 'Update Campaign' : 'Create Campaign')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Empty State */}
      {campaigns.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first campaign to organize your social media content
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Active Campaigns */}
      {activeCampaigns.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Active Campaigns</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeCampaigns.map((campaign) => (
              <CampaignCard 
                key={campaign.id}
                campaign={campaign}
                onEdit={() => handleEdit(campaign)}
                onDelete={() => handleDelete(campaign.id)}
                onPause={() => handlePause(campaign.id)}
                onResume={() => handleResume(campaign.id)}
                onArchive={() => handleArchive(campaign.id)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Draft Campaigns */}
      {draftCampaigns.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Drafts</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {draftCampaigns.map((campaign) => (
              <CampaignCard 
                key={campaign.id}
                campaign={campaign}
                onEdit={() => handleEdit(campaign)}
                onDelete={() => handleDelete(campaign.id)}
                onPause={() => handlePause(campaign.id)}
                onResume={() => handleResume(campaign.id)}
                onArchive={() => handleArchive(campaign.id)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Past Campaigns */}
      {pastCampaigns.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Past Campaigns</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pastCampaigns.map((campaign) => (
              <CampaignCard 
                key={campaign.id}
                campaign={campaign}
                onEdit={() => handleEdit(campaign)}
                onDelete={() => handleDelete(campaign.id)}
                onPause={() => handlePause(campaign.id)}
                onResume={() => handleResume(campaign.id)}
                onArchive={() => handleArchive(campaign.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CampaignCard({
  campaign,
  onEdit,
  onDelete,
  onPause,
  onResume,
  onArchive,
}: {
  campaign: Campaign
  onEdit: () => void
  onDelete: () => void
  onPause: () => void
  onResume: () => void
  onArchive: () => void
}) {
  const goals = campaign.goals || {}
  const hasGoals = Object.keys(goals).length > 0
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: campaign.color }}
            />
            <div>
              <CardTitle className="text-lg">{campaign.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="h-3 w-3" />
                {new Date(campaign.startDate).toLocaleDateString()}
                {campaign.endDate && ` - ${new Date(campaign.endDate).toLocaleDateString()}`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary"
              className={`${STATUS_COLORS[campaign.status]} text-white`}
            >
              {STATUS_LABELS[campaign.status]}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {campaign.status === 'active' && (
                  <DropdownMenuItem onClick={onPause}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </DropdownMenuItem>
                )}
                {campaign.status === 'paused' && (
                  <DropdownMenuItem onClick={onResume}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {campaign.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {campaign.description}
          </p>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-muted rounded-lg">
            <p className="text-lg font-bold">{campaign.totalPosts}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <p className="text-lg font-bold">{(campaign.totalImpressions / 1000).toFixed(1)}K</p>
            <p className="text-xs text-muted-foreground">Impressions</p>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <p className="text-lg font-bold">{campaign.totalEngagement}</p>
            <p className="text-xs text-muted-foreground">Engagements</p>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <p className="text-lg font-bold">{campaign.totalClicks}</p>
            <p className="text-xs text-muted-foreground">Clicks</p>
          </div>
        </div>
        
        {/* Goal Progress */}
        {hasGoals && (
          <div className="space-y-2">
            {goals.impressions && (
              <GoalProgress 
                label="Impressions"
                current={campaign.totalImpressions}
                target={goals.impressions}
                icon={Eye}
              />
            )}
            {goals.engagement && (
              <GoalProgress 
                label="Engagements"
                current={campaign.totalEngagement}
                target={goals.engagement}
                icon={Heart}
              />
            )}
            {goals.clicks && (
              <GoalProgress 
                label="Clicks"
                current={campaign.totalClicks}
                target={goals.clicks}
                icon={MousePointer}
              />
            )}
          </div>
        )}
        
        {/* Hashtags */}
        {campaign.hashtags && campaign.hashtags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Hash className="h-3 w-3 text-muted-foreground" />
            {campaign.hashtags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {campaign.hashtags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{campaign.hashtags.length - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function GoalProgress({
  label,
  current,
  target,
  icon: Icon,
}: {
  label: string
  current: number
  target: number
  icon: LucideIcon
}) {
  const percentage = Math.min(100, Math.round((current / target) * 100))
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          <span>{label}</span>
        </div>
        <span className="text-muted-foreground">
          {current.toLocaleString()} / {target.toLocaleString()} ({percentage}%)
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
