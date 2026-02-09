/**
 * Enhanced Contacts Table Component
 * 
 * PHASE-UI-10A: CRM Module UI Overhaul
 * 
 * Modern data table with sorting, selection, bulk actions, and inline quick actions.
 */
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Building2, 
  Edit, 
  Trash2, 
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Copy,
  UserPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Contact, LeadStatus } from '../../types/crm-types'

import { DEFAULT_LOCALE } from '@/lib/locale-config'
// =============================================================================
// TYPES
// =============================================================================

export type SortDirection = 'asc' | 'desc' | null
export type SortField = 'name' | 'email' | 'company' | 'lead_status' | 'lead_score' | 'created_at' | 'last_contacted_at'

export interface ContactsTableProps {
  contacts: Contact[]
  loading?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  onView?: (contact: Contact) => void
  onEdit?: (contact: Contact) => void
  onDelete?: (contact: Contact) => void
  onEmail?: (contact: Contact) => void
  onCall?: (contact: Contact) => void
  onSort?: (field: SortField, direction: SortDirection) => void
  sortField?: SortField
  sortDirection?: SortDirection
  onBulkDelete?: (ids: string[]) => void
  onBulkExport?: (ids: string[]) => void
  onBulkAssign?: (ids: string[]) => void
  className?: string
}

// =============================================================================
// HELPERS
// =============================================================================

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0) || ''
  const last = lastName?.charAt(0) || ''
  return (first + last).toUpperCase() || '?'
}

function getLeadStatusConfig(status?: LeadStatus | null): { label: string; color: string; bgColor: string } {
  const configs: Record<string, { label: string; color: string; bgColor: string }> = {
    new: { label: 'New', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    contacted: { label: 'Contacted', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
    qualified: { label: 'Qualified', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
    unqualified: { label: 'Unqualified', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
    converted: { label: 'Converted', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  }
  return configs[status || ''] || { label: 'Unknown', color: 'text-gray-600', bgColor: 'bg-gray-100' }
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString(DEFAULT_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

// =============================================================================
// SORTABLE HEADER
// =============================================================================

interface SortableHeaderProps {
  label: string
  field: SortField
  currentField?: SortField
  direction?: SortDirection
  onSort?: (field: SortField, direction: SortDirection) => void
}

function SortableHeader({ label, field, currentField, direction, onSort }: SortableHeaderProps) {
  const isActive = currentField === field
  
  const handleClick = () => {
    if (!onSort) return
    if (!isActive) {
      onSort(field, 'asc')
    } else if (direction === 'asc') {
      onSort(field, 'desc')
    } else {
      onSort(field, null)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      {isActive && direction === 'asc' && <ArrowUp className="h-3.5 w-3.5" />}
      {isActive && direction === 'desc' && <ArrowDown className="h-3.5 w-3.5" />}
      {(!isActive || !direction) && <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />}
    </button>
  )
}

// =============================================================================
// CONTACT ROW
// =============================================================================

interface ContactRowProps {
  contact: Contact
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onEmail?: () => void
  onCall?: () => void
}

function ContactRow({
  contact,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onEmail,
  onCall,
}: ContactRowProps) {
  const leadStatusConfig = getLeadStatusConfig(contact.lead_status)
  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unnamed'

  return (
    <TableRow 
      className={cn(
        "group transition-colors",
        isSelected && "bg-muted/50"
      )}
    >
      {/* Selection */}
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(!!checked)}
        />
      </TableCell>

      {/* Contact Info */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getInitials(contact.first_name, contact.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <button 
              onClick={onView}
              className="font-medium text-left hover:text-primary transition-colors"
            >
              {fullName}
            </button>
            {contact.job_title && (
              <span className="text-xs text-muted-foreground">{contact.job_title}</span>
            )}
          </div>
        </div>
      </TableCell>

      {/* Email */}
      <TableCell>
        {contact.email ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={onEmail}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[180px]">{contact.email}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send email to {contact.email}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Phone */}
      <TableCell>
        {contact.phone ? (
          <button 
            onClick={onCall}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            {contact.phone}
          </button>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Company */}
      <TableCell>
        {contact.company ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{contact.company.name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Lead Status */}
      <TableCell>
        <Badge className={cn("font-normal", leadStatusConfig.bgColor, leadStatusConfig.color)}>
          {leadStatusConfig.label}
        </Badge>
      </TableCell>

      {/* Lead Score */}
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all",
                contact.lead_score >= 80 ? "bg-green-500" :
                contact.lead_score >= 50 ? "bg-yellow-500" :
                "bg-red-500"
              )}
              style={{ width: `${contact.lead_score}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-8">{contact.lead_score}</span>
        </div>
      </TableCell>

      {/* Last Contacted */}
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatDate(contact.last_contacted_at)}
        </span>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View details</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {contact.email && (
                <DropdownMenuItem onClick={onEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </DropdownMenuItem>
              )}
              {contact.phone && (
                <DropdownMenuItem onClick={onCall}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(contact.email || '')}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}

// =============================================================================
// BULK ACTIONS BAR
// =============================================================================

interface BulkActionsBarProps {
  selectedCount: number
  onDelete?: () => void
  onExport?: () => void
  onAssign?: () => void
  onClearSelection: () => void
}

function BulkActionsBar({ 
  selectedCount, 
  onDelete, 
  onExport, 
  onAssign,
  onClearSelection 
}: BulkActionsBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center justify-between bg-muted/50 border rounded-lg px-4 py-2 mb-2"
    >
      <span className="text-sm font-medium">
        {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <div className="flex items-center gap-2">
        {onAssign && (
          <Button variant="outline" size="sm" onClick={onAssign}>
            <UserPlus className="h-4 w-4 mr-2" />
            Assign
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
        {onDelete && (
          <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
      </div>
    </motion.div>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

function ContactsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"><Skeleton className="h-4 w-4" /></TableHead>
          <TableHead><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead><Skeleton className="h-4 w-16" /></TableHead>
          <TableHead><Skeleton className="h-4 w-16" /></TableHead>
          <TableHead><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead><Skeleton className="h-4 w-16" /></TableHead>
          <TableHead><Skeleton className="h-4 w-12" /></TableHead>
          <TableHead><Skeleton className="h-4 w-16" /></TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-36" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-8 w-16" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ContactsTable({
  contacts,
  loading = false,
  selectedIds = [],
  onSelectionChange,
  onView,
  onEdit,
  onDelete,
  onEmail,
  onCall,
  onSort,
  sortField,
  sortDirection,
  onBulkDelete,
  onBulkExport,
  onBulkAssign,
  className,
}: ContactsTableProps) {
  const isAllSelected = contacts.length > 0 && selectedIds.length === contacts.length
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < contacts.length

  const handleSelectAll = (checked: boolean) => {
    onSelectionChange?.(checked ? contacts.map(c => c.id) : [])
  }

  const handleSelectOne = (contactId: string, selected: boolean) => {
    if (selected) {
      onSelectionChange?.([...selectedIds, contactId])
    } else {
      onSelectionChange?.(selectedIds.filter(id => id !== contactId))
    }
  }

  const handleClearSelection = () => {
    onSelectionChange?.([])
  }

  if (loading) {
    return <ContactsTableSkeleton />
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <div className="rounded-full bg-muted p-4 mb-4">
          <UserPlus className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No contacts found</h3>
        <p className="text-muted-foreground max-w-sm">
          Get started by adding your first contact or adjust your filters.
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.length}
            onDelete={onBulkDelete ? () => onBulkDelete(selectedIds) : undefined}
            onExport={onBulkExport ? () => onBulkExport(selectedIds) : undefined}
            onAssign={onBulkAssign ? () => onBulkAssign(selectedIds) : undefined}
            onClearSelection={handleClearSelection}
          />
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) (el as HTMLInputElement).indeterminate = isSomeSelected
                  }}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>
                <SortableHeader 
                  label="Contact" 
                  field="name" 
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>
                <SortableHeader 
                  label="Email" 
                  field="email" 
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>
                <SortableHeader 
                  label="Company" 
                  field="company" 
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>
                <SortableHeader 
                  label="Lead Status" 
                  field="lead_status" 
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>
                <SortableHeader 
                  label="Score" 
                  field="lead_score" 
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>
                <SortableHeader 
                  label="Last Contacted" 
                  field="last_contacted_at" 
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                isSelected={selectedIds.includes(contact.id)}
                onSelect={(selected) => handleSelectOne(contact.id, selected)}
                onView={onView ? () => onView(contact) : undefined}
                onEdit={onEdit ? () => onEdit(contact) : undefined}
                onDelete={onDelete ? () => onDelete(contact) : undefined}
                onEmail={onEmail ? () => onEmail(contact) : undefined}
                onCall={onCall ? () => onCall(contact) : undefined}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ContactsTable
