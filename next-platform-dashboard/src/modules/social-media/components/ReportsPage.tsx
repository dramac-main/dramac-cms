'use client'

/**
 * Social Media Reports Page Component
 * 
 * Phase SM-08: Reports Engine
 * Report management, creation, and viewing
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  FileBarChart,
  Trash2,
  Copy,
  Clock,
  Calendar,
  Printer,
  MoreHorizontal,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { DEFAULT_TIMEZONE } from '@/lib/locale-config'
import type { Report, ReportType } from '@/modules/social-media/types'

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: 'performance', label: 'Performance', description: 'Followers, impressions, reach' },
  { value: 'engagement', label: 'Engagement', description: 'Likes, comments, shares, rates' },
  { value: 'audience', label: 'Audience', description: 'Growth, demographics' },
  { value: 'competitor', label: 'Competitor', description: 'Competitor benchmarking' },
  { value: 'campaign', label: 'Campaign', description: 'Campaign performance vs goals' },
  { value: 'custom', label: 'Custom', description: 'Choose your own metrics' },
]

const DATE_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 14 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

const REPORT_TYPE_COLORS: Record<string, string> = {
  performance: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  engagement: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  audience: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  competitor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  campaign: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  team: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  custom: 'bg-muted text-muted-foreground',
}

interface ReportsPageProps {
  siteId: string
  reports: Report[]
  onCreate: (data: {
    name: string
    description?: string
    reportType: ReportType
    metrics?: string[]
    dateRangeType?: string
  }) => Promise<{ report: Report | null; error: string | null }>
  onDelete: (reportId: string) => Promise<{ success: boolean; error: string | null }>
  onDuplicate: (reportId: string) => Promise<{ report: Report | null; error: string | null }>
}

export function ReportsPage({
  siteId,
  reports,
  onCreate,
  onDelete,
  onDuplicate,
}: ReportsPageProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formType, setFormType] = useState<ReportType>('performance')
  const [formDateRange, setFormDateRange] = useState('30d')

  const handleCreate = useCallback(async () => {
    if (!formName.trim()) return
    setIsCreating(true)
    const result = await onCreate({
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      reportType: formType,
      dateRangeType: formDateRange,
    })
    setIsCreating(false)
    if (result.error) {
      toast.error('Failed to create report', { description: result.error })
    } else {
      toast.success(`Report "${formName}" created`)
      setFormName('')
      setFormDescription('')
      setFormType('performance')
      setFormDateRange('30d')
      setCreateDialogOpen(false)
    }
  }, [formName, formDescription, formType, formDateRange, onCreate])

  const handleDelete = useCallback(async () => {
    if (!reportToDelete) return
    setIsDeleting(true)
    const result = await onDelete(reportToDelete)
    setIsDeleting(false)
    if (result.error) {
      toast.error('Failed to delete report', { description: result.error })
    } else {
      toast.success('Report deleted')
    }
    setReportToDelete(null)
    setDeleteDialogOpen(false)
  }, [reportToDelete, onDelete])

  const handleDuplicate = useCallback(async (reportId: string) => {
    const result = await onDuplicate(reportId)
    if (result.error) {
      toast.error('Failed to duplicate report', { description: result.error })
    } else {
      toast.success('Report duplicated')
    }
  }, [onDuplicate])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Never'
    return new Intl.DateTimeFormat('en-ZM', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: DEFAULT_TIMEZONE,
    }).format(new Date(dateStr))
  }

  // Empty state
  if (reports.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
            <p className="text-muted-foreground">Generate and schedule social media performance reports</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileBarChart className="h-12 w-12 text-muted-foreground/50 mb-4" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold">No saved reports</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Create your first report to track social media performance over time.
          </p>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4" size="sm">
                <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Create your first report
              </Button>
            </DialogTrigger>
            <CreateReportDialog
              formName={formName}
              formDescription={formDescription}
              formType={formType}
              formDateRange={formDateRange}
              setFormName={setFormName}
              setFormDescription={setFormDescription}
              setFormType={setFormType}
              setFormDateRange={setFormDateRange}
              isCreating={isCreating}
              onCreate={handleCreate}
              onClose={() => setCreateDialogOpen(false)}
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
          <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">Generate and schedule social media performance reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} aria-label="Print reports">
            <Printer className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Print
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                New Report
              </Button>
            </DialogTrigger>
            <CreateReportDialog
              formName={formName}
              formDescription={formDescription}
              formType={formType}
              formDateRange={formDateRange}
              setFormName={setFormName}
              setFormDescription={setFormDescription}
              setFormType={setFormType}
              setFormDateRange={setFormDateRange}
              isCreating={isCreating}
              onCreate={handleCreate}
              onClose={() => setCreateDialogOpen(false)}
            />
          </Dialog>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map(report => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{report.name}</CardTitle>
                  {report.description && (
                    <CardDescription className="line-clamp-2">{report.description}</CardDescription>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Report actions">
                      <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDuplicate(report.id)}>
                      <Copy className="h-4 w-4 mr-2" strokeWidth={1.5} />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => { setReportToDelete(report.id); setDeleteDialogOpen(true) }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={REPORT_TYPE_COLORS[report.reportType] || ''}
                  aria-label={`Report type: ${report.reportType}`}
                >
                  {report.reportType}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" strokeWidth={1.5} />
                  {report.dateRangeType || '30d'}
                </Badge>
                {report.isScheduled && (
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <Clock className="h-3 w-3 mr-1" strokeWidth={1.5} />
                    Scheduled
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                <span>Last generated: {formatDate(report.lastGeneratedAt)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The report configuration will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CreateReportDialog({
  formName,
  formDescription,
  formType,
  formDateRange,
  setFormName,
  setFormDescription,
  setFormType,
  setFormDateRange,
  isCreating,
  onCreate,
  onClose,
}: {
  formName: string
  formDescription: string
  formType: ReportType
  formDateRange: string
  setFormName: (v: string) => void
  setFormDescription: (v: string) => void
  setFormType: (v: ReportType) => void
  setFormDateRange: (v: string) => void
  isCreating: boolean
  onCreate: () => void
  onClose: () => void
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Report</DialogTitle>
        <DialogDescription>
          Configure a new social media performance report.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <label htmlFor="report-name" className="text-sm font-medium">Report Name</label>
          <Input
            id="report-name"
            placeholder="Monthly Performance Report..."
            value={formName}
            onChange={e => setFormName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="report-desc" className="text-sm font-medium">Description (optional)</label>
          <Textarea
            id="report-desc"
            placeholder="Report description..."
            value={formDescription}
            onChange={e => setFormDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div>
          <label htmlFor="report-type" className="text-sm font-medium">Report Type</label>
          <Select value={formType} onValueChange={(v) => setFormType(v as ReportType)}>
            <SelectTrigger id="report-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  <div className="flex flex-col">
                    <span>{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="report-range" className="text-sm font-medium">Date Range</label>
          <Select value={formDateRange} onValueChange={setFormDateRange}>
            <SelectTrigger id="report-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map(d => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onCreate} disabled={isCreating || !formName.trim()}>
          {isCreating ? 'Creating...' : 'Create Report'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
