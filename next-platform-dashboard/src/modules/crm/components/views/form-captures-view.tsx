/**
 * Form Captures View
 * 
 * CRM Enhancement: Website Form Capture Tracking
 * View form submissions from website contact forms, lead captures, and newsletters.
 * Industry-leader pattern: HubSpot Form Submissions, GoHighLevel Form Submissions
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Search, FileText, Mail, Target, ExternalLink, Calendar, Globe,
  User, ArrowRight, Eye,
} from 'lucide-react'
import { useCRM } from '../../context/crm-context'
import { getFormCaptures } from '../../actions/bulk-actions'
import type { FormCapture, FormCaptureType } from '../../types/crm-types'

// ============================================================================
// CAPTURE DETAIL SHEET
// ============================================================================

function CaptureDetailSheet({
  capture,
  open,
  onOpenChange,
}: {
  capture: FormCapture | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!capture) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[450px] sm:max-w-[450px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Form Submission
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={capture.status === 'new' ? 'default' : capture.status === 'contacted' ? 'secondary' : 'outline'}>
              {capture.status}
            </Badge>
          </div>

          <Separator />

          {/* Form Type */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Form Type</span>
            <Badge variant="outline">{capture.form_type}</Badge>
          </div>

          {/* Submitted At */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Submitted</span>
            <span className="text-sm">{new Date(capture.created_at).toLocaleString()}</span>
          </div>

          <Separator />

          {/* Form Data */}
          <div>
            <h4 className="font-medium mb-3">Submitted Data</h4>
            <div className="space-y-3">
              {Object.entries(capture.form_data || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4">
                  <span className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-sm text-right max-w-[250px] break-words">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Source Info */}
          {(capture.page_url || capture.utm_source || capture.referrer) && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Source Information</h4>
                <div className="space-y-2 text-sm">
                  {capture.page_url && (
                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span className="break-all">{capture.page_url}</span>
                    </div>
                  )}
                  {capture.referrer && (
                    <div className="flex items-start gap-2">
                      <ExternalLink className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span className="break-all">{capture.referrer}</span>
                    </div>
                  )}
                  {capture.utm_source && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      <Badge variant="outline" className="text-xs">utm_source: {capture.utm_source}</Badge>
                      {capture.utm_medium && <Badge variant="outline" className="text-xs">utm_medium: {capture.utm_medium}</Badge>}
                      {capture.utm_campaign && <Badge variant="outline" className="text-xs">utm_campaign: {capture.utm_campaign}</Badge>}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Contact Link */}
          {capture.contact_id && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CRM Contact</span>
                <Button variant="outline" size="sm">
                  <User className="h-3 w-3 mr-1" />
                  View Contact
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ============================================================================
// FORM CAPTURES VIEW
// ============================================================================

export function FormCapturesView() {
  const { siteId } = useCRM()
  const [captures, setCaptures] = useState<FormCapture[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCapture, setSelectedCapture] = useState<FormCapture | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const loadCaptures = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getFormCaptures(
        siteId,
        typeFilter !== 'all' ? typeFilter as FormCaptureType : undefined,
      )
      setCaptures(data)
    } catch (err) {
      toast.error('Failed to load form captures')
    } finally {
      setLoading(false)
    }
  }, [siteId, typeFilter])

  useEffect(() => { loadCaptures() }, [loadCaptures])

  const filteredCaptures = captures.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      const data = JSON.stringify(c.form_data || {}).toLowerCase()
      return data.includes(s)
    }
    return true
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'newsletter': return <Mail className="h-4 w-4" />
      case 'lead_capture': return <Target className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'newsletter': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'lead_capture': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search submissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
              <SelectItem value="lead_capture">Lead Capture</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredCaptures.length} submission{filteredCaptures.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filteredCaptures.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[40vh] gap-4">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-center">
              <h3 className="font-semibold text-lg">No Form Submissions</h3>
              <p className="text-muted-foreground text-sm">
                Form submissions from your website will appear here
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCaptures.map((capture) => (
                <TableRow key={capture.id} className="cursor-pointer" onClick={() => { setSelectedCapture(capture); setDetailOpen(true) }}>
                  <TableCell>
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(capture.form_type)}`}>
                      {getTypeIcon(capture.form_type)}
                      {capture.form_type.replace('_', ' ')}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {capture.form_data?.name || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {capture.form_data?.email || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={capture.status === 'new' ? 'default' : 'secondary'}>
                      {capture.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {capture.utm_source || capture.referrer ? (
                      <span className="truncate max-w-[150px] block">
                        {capture.utm_source || new URL(capture.referrer || '').hostname}
                      </span>
                    ) : (
                      'Direct'
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(capture.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Detail Sheet */}
      <CaptureDetailSheet
        capture={selectedCapture}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
