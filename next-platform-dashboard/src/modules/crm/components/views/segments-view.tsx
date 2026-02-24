/**
 * Segments View
 * 
 * CRM Enhancement: Smart Segments
 * Create and manage dynamic contact segments with filters.
 * Industry-leader pattern: HubSpot Active Lists, GoHighLevel Smart Lists
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Plus, Search, MoreHorizontal, Filter, Users, Trash2, Edit,
  RefreshCw, Zap, ListFilter,
} from 'lucide-react'
import { useCRM } from '../../context/crm-context'
import {
  getSegments, createSegment, updateSegment, deleteSegment, evaluateSegment,
} from '../../actions/segment-actions'
import type { Segment, SegmentFilter, FilterOperator } from '../../types/crm-types'

// ============================================================================
// FILTER BUILDER
// ============================================================================

const FILTER_FIELDS = [
  { value: 'status', label: 'Status' },
  { value: 'lead_status', label: 'Lead Status' },
  { value: 'source', label: 'Source' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'country', label: 'Country' },
  { value: 'lead_score', label: 'Lead Score' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'last_contacted_at', label: 'Last Contacted' },
]

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
]

function FilterRow({
  filter,
  index,
  onChange,
  onRemove,
}: {
  filter: SegmentFilter
  index: number
  onChange: (index: number, filter: SegmentFilter) => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      {index > 0 && (
        <Badge variant="outline" className="text-xs">AND</Badge>
      )}
      <Select
        value={filter.field}
        onValueChange={(val) => onChange(index, { ...filter, field: val })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Field" />
        </SelectTrigger>
        <SelectContent>
          {FILTER_FIELDS.map((f) => (
            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filter.operator}
        onValueChange={(val) => onChange(index, { ...filter, operator: val as FilterOperator })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filter.operator !== 'is_empty' && filter.operator !== 'is_not_empty' && (
        <Input
          value={filter.value as string || ''}
          onChange={(e) => onChange(index, { ...filter, value: e.target.value })}
          placeholder="Value"
          className="w-[160px]"
        />
      )}

      <Button variant="ghost" size="icon" onClick={() => onRemove(index)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}

// ============================================================================
// SEGMENT CREATE/EDIT DIALOG
// ============================================================================

interface SegmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  segment?: Segment | null
  siteId: string
  onSaved: () => void
}

function SegmentDialog({ open, onOpenChange, segment, siteId, onSaved }: SegmentDialogProps) {
  const [name, setName] = useState(segment?.name || '')
  const [description, setDescription] = useState(segment?.description || '')
  const [type, setType] = useState<'dynamic' | 'static'>(segment?.type || 'dynamic')
  const [filters, setFilters] = useState<SegmentFilter[]>(segment?.filters || [])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (segment) {
      setName(segment.name)
      setDescription(segment.description || '')
      setType(segment.type)
      setFilters(segment.filters || [])
    } else {
      setName('')
      setDescription('')
      setType('dynamic')
      setFilters([])
    }
  }, [segment, open])

  const addFilter = () => {
    setFilters([...filters, { field: 'status', operator: 'equals', value: '' }])
  }

  const updateFilter = (index: number, filter: SegmentFilter) => {
    const updated = [...filters]
    updated[index] = filter
    setFilters(updated)
  }

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Segment name is required')
      return
    }
    setSaving(true)
    try {
      if (segment) {
        await updateSegment(segment.id, { name, description, type, filters })
        toast.success('Segment updated')
      } else {
        await createSegment(siteId, { name, description, type, filters })
        toast.success('Segment created')
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{segment ? 'Edit Segment' : 'Create Segment'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hot Leads" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this segment targets..." rows={2} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Segment Type</Label>
              <p className="text-xs text-muted-foreground">Dynamic segments auto-update based on filters</p>
            </div>
            <Select value={type} onValueChange={(v) => setType(v as 'dynamic' | 'static')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dynamic">Dynamic</SelectItem>
                <SelectItem value="static">Static</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'dynamic' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  Filters
                </Label>
                <Button variant="outline" size="sm" onClick={addFilter}>
                  <Plus className="h-3 w-3 mr-1" /> Add Filter
                </Button>
              </div>
              {filters.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No filters added. Add filters to define this segment.
                </p>
              )}
              <div className="space-y-2">
                {filters.map((filter, i) => (
                  <FilterRow key={i} filter={filter} index={i} onChange={updateFilter} onRemove={removeFilter} />
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : segment ? 'Update Segment' : 'Create Segment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// SEGMENTS VIEW
// ============================================================================

export function SegmentsView() {
  const { siteId } = useCRM()
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)

  const loadSegments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSegments(siteId)
      setSegments(data)
    } catch (err) {
      toast.error('Failed to load segments')
    } finally {
      setLoading(false)
    }
  }, [siteId])

  useEffect(() => { loadSegments() }, [loadSegments])

  const handleDelete = async (id: string) => {
    try {
      await deleteSegment(id)
      toast.success('Segment deleted')
      loadSegments()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const handleEvaluate = async (segment: Segment) => {
    if (segment.type !== 'dynamic') return
    setEvaluatingId(segment.id)
    try {
      const result = await evaluateSegment(segment.id, siteId)
      toast.success(`Segment evaluated: ${result.length} contacts matched`)
      loadSegments()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setEvaluatingId(null)
    }
  }

  const filteredSegments = segments.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search segments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={() => { setEditingSegment(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Segment
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filteredSegments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[40vh] gap-4">
            <Filter className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-center">
              <h3 className="font-semibold text-lg">No Segments</h3>
              <p className="text-muted-foreground text-sm">Create your first segment to organize contacts</p>
            </div>
            <Button onClick={() => { setEditingSegment(null); setDialogOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" /> Create Segment
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Contacts</TableHead>
                <TableHead>Filters</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSegments.map((segment) => (
                <TableRow key={segment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{segment.name}</div>
                      {segment.description && (
                        <div className="text-xs text-muted-foreground">{segment.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={segment.type === 'dynamic' ? 'default' : 'secondary'}>
                      {segment.type === 'dynamic' ? <Zap className="h-3 w-3 mr-1" /> : null}
                      {segment.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {segment.contact_count || 0}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {segment.filters?.length || 0} rule{(segment.filters?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {segment.updated_at ? new Date(segment.updated_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingSegment(segment); setDialogOpen(true) }}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        {segment.type === 'dynamic' && (
                          <DropdownMenuItem
                            onClick={() => handleEvaluate(segment)}
                            disabled={evaluatingId === segment.id}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${evaluatingId === segment.id ? 'animate-spin' : ''}`} />
                            Re-evaluate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(segment.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Segment Dialog */}
      <SegmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        segment={editingSegment}
        siteId={siteId}
        onSaved={loadSegments}
      />
    </div>
  )
}
