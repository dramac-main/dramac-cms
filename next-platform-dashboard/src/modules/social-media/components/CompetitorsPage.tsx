'use client'

/**
 * Social Media Competitors Page Component
 * 
 * Phase SM-07: Missing Pages & Full Navigation
 * Competitor tracking and analysis dashboard
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  UsersRound,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DEFAULT_TIMEZONE, DEFAULT_LOCALE } from '@/lib/locale-config'
import type { Competitor } from '@/modules/social-media/types'

const PLATFORMS: { value: string; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'bluesky', label: 'Bluesky' },
  { value: 'mastodon', label: 'Mastodon' },
  { value: 'threads', label: 'Threads' },
]

interface CompetitorsPageProps {
  siteId: string
  competitors: Competitor[]
  comparison: Array<{
    id: string
    name: string
    platform: string
    platformHandle: string
    avatarUrl: string | null
    followersCount: number
    followingCount: number
    postsCount: number
    avgEngagementRate: number
    postingFrequency: number
  }>
  onAdd: (data: { name: string; platform: string; platformHandle: string }) => Promise<{ competitor: Competitor | null; error: string | null }>
  onRemove: (competitorId: string) => Promise<{ success: boolean; error: string | null }>
  onSync: (competitorId: string) => Promise<{ success: boolean; error: string | null }>
}

export function CompetitorsPage({
  siteId,
  competitors,
  comparison,
  onAdd,
  onRemove,
  onSync,
}: CompetitorsPageProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [competitorToRemove, setCompetitorToRemove] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  
  // Form state
  const [formName, setFormName] = useState('')
  const [formPlatform, setFormPlatform] = useState('')
  const [formHandle, setFormHandle] = useState('')

  const handleAdd = useCallback(async () => {
    if (!formName.trim() || !formPlatform || !formHandle.trim()) return
    setIsAdding(true)
    const result = await onAdd({
      name: formName.trim(),
      platform: formPlatform,
      platformHandle: formHandle.trim().replace('@', ''),
    })
    setIsAdding(false)
    if (result.error) {
      toast.error('Failed to add competitor', { description: result.error })
    } else {
      toast.success(`Added ${formName} as a competitor`)
      setFormName('')
      setFormPlatform('')
      setFormHandle('')
      setAddDialogOpen(false)
    }
  }, [formName, formPlatform, formHandle, onAdd])

  const handleRemove = useCallback(async () => {
    if (!competitorToRemove) return
    setIsRemoving(true)
    const result = await onRemove(competitorToRemove)
    setIsRemoving(false)
    if (result.error) {
      toast.error('Failed to remove competitor', { description: result.error })
    } else {
      toast.success('Competitor removed')
    }
    setCompetitorToRemove(null)
    setRemoveDialogOpen(false)
  }, [competitorToRemove, onRemove])

  const handleSync = useCallback(async (competitorId: string) => {
    setSyncingId(competitorId)
    const result = await onSync(competitorId)
    setSyncingId(null)
    if (result.error) {
      toast.error('Failed to sync competitor data', { description: result.error })
    } else {
      toast.success('Competitor data synced')
    }
  }, [onSync])

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Never'
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: DEFAULT_TIMEZONE,
    }).format(new Date(dateStr))
  }

  // Empty state
  if (competitors.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Competitors</h2>
            <p className="text-muted-foreground">Track and analyze your competitors&apos; social media performance</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UsersRound className="h-12 w-12 text-muted-foreground/50 mb-4" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold">No competitors tracked</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Add competitors to track their social media performance and compare it with yours.
          </p>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4" size="sm">
                <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Add a competitor
              </Button>
            </DialogTrigger>
            <AddCompetitorDialog
              formName={formName}
              formPlatform={formPlatform}
              formHandle={formHandle}
              setFormName={setFormName}
              setFormPlatform={setFormPlatform}
              setFormHandle={setFormHandle}
              isAdding={isAdding}
              onAdd={handleAdd}
              onClose={() => setAddDialogOpen(false)}
            />
          </Dialog>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Competitors</h2>
          <p className="text-muted-foreground">Track and analyze your competitors&apos; social media performance</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Add Competitor
            </Button>
          </DialogTrigger>
          <AddCompetitorDialog
            formName={formName}
            formPlatform={formPlatform}
            formHandle={formHandle}
            setFormName={setFormName}
            setFormPlatform={setFormPlatform}
            setFormHandle={setFormHandle}
            isAdding={isAdding}
            onAdd={handleAdd}
            onClose={() => setAddDialogOpen(false)}
          />
        </Dialog>
      </div>

      {/* Competitor Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {competitors.map(comp => (
          <Card key={comp.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <UsersRound className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-medium">{comp.name}</p>
                    <p className="text-xs text-muted-foreground">@{comp.platformHandle}</p>
                  </div>
                </div>
                <Badge variant="outline">{comp.platform}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold">{(comp.followersCount || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{comp.postsCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{comp.avgEngagementRate || 0}%</p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last synced: {formatDate(comp.lastSyncedAt)}</span>
                <span>{(comp.postingFrequency || 0).toFixed(1)} posts/day</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSync(comp.id)}
                  disabled={syncingId === comp.id}
                  aria-label={`Sync ${comp.name} data`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncingId === comp.id ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                  {syncingId === comp.id ? 'Syncing...' : 'Sync'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setCompetitorToRemove(comp.id); setRemoveDialogOpen(true) }}
                  aria-label={`Remove ${comp.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      {comparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" strokeWidth={1.5} />
              Competitor Comparison
            </CardTitle>
            <CardDescription>Side-by-side comparison of competitor metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Competitor comparison">
                <thead>
                  <tr className="border-b">
                    <th scope="col" className="text-left p-2 font-medium text-muted-foreground">Competitor</th>
                    <th scope="col" className="text-left p-2 font-medium text-muted-foreground">Platform</th>
                    <th scope="col" className="text-right p-2 font-medium text-muted-foreground">Followers</th>
                    <th scope="col" className="text-right p-2 font-medium text-muted-foreground">Posts</th>
                    <th scope="col" className="text-right p-2 font-medium text-muted-foreground">Engagement Rate</th>
                    <th scope="col" className="text-right p-2 font-medium text-muted-foreground">Posts/Day</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map(c => (
                    <tr key={c.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-xs text-muted-foreground">@{c.platformHandle}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{c.platform}</Badge>
                      </td>
                      <td className="p-2 text-right font-medium">{c.followersCount.toLocaleString()}</td>
                      <td className="p-2 text-right">{c.postsCount}</td>
                      <td className="p-2 text-right">{c.avgEngagementRate}%</td>
                      <td className="p-2 text-right">{c.postingFrequency.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remove confirmation */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove competitor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop tracking this competitor. Historical data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AddCompetitorDialog({
  formName,
  formPlatform,
  formHandle,
  setFormName,
  setFormPlatform,
  setFormHandle,
  isAdding,
  onAdd,
  onClose,
}: {
  formName: string
  formPlatform: string
  formHandle: string
  setFormName: (v: string) => void
  setFormPlatform: (v: string) => void
  setFormHandle: (v: string) => void
  isAdding: boolean
  onAdd: () => void
  onClose: () => void
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Competitor</DialogTitle>
        <DialogDescription>
          Track a competitor&apos;s social media presence and performance.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <label htmlFor="comp-name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="comp-name"
            placeholder="Competitor name..."
            value={formName}
            onChange={e => setFormName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="comp-platform" className="text-sm font-medium">
            Platform
          </label>
          <Select value={formPlatform} onValueChange={setFormPlatform}>
            <SelectTrigger id="comp-platform">
              <SelectValue placeholder="Select platform..." />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="comp-handle" className="text-sm font-medium">
            Handle / Username
          </label>
          <Input
            id="comp-handle"
            placeholder="@username"
            value={formHandle}
            onChange={e => setFormHandle(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onAdd} disabled={isAdding || !formName.trim() || !formPlatform || !formHandle.trim()}>
          {isAdding ? 'Adding...' : 'Add Competitor'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
