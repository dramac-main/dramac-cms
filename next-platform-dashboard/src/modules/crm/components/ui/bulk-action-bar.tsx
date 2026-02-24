/**
 * Bulk Action Bar Component
 * 
 * CRM Enhancement: Bulk Operations
 * Floating toolbar for bulk actions on selected contacts.
 * Industry-leader pattern: HubSpot Bulk Actions, Salesforce Mass Actions
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Trash2, Tag, UserCheck, X, MoreHorizontal, Loader2,
  ChevronDown, Shield, AlertTriangle,
} from 'lucide-react'
import {
  bulkDeleteContacts,
  bulkUpdateContactStatus,
  bulkUpdateLeadStatus,
  bulkAddTags,
  bulkRemoveTags,
} from '../../actions/bulk-actions'
import type { ContactStatus } from '../../types/crm-types'

interface BulkActionBarProps {
  selectedIds: string[]
  siteId: string
  onClearSelection: () => void
  onActionsComplete: () => void
}

export function BulkActionBar({
  selectedIds,
  siteId,
  onClearSelection,
  onActionsComplete,
}: BulkActionBarProps) {
  const [processing, setProcessing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (selectedIds.length === 0) return null

  const handleBulkDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }

    setProcessing(true)
    try {
      const result = await bulkDeleteContacts(siteId, selectedIds)
      toast.success(`Deleted ${result.successCount} contact${result.successCount !== 1 ? 's' : ''}`)
      onClearSelection()
      onActionsComplete()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setProcessing(false)
      setConfirmDelete(false)
    }
  }

  const handleBulkStatus = async (status: ContactStatus) => {
    setProcessing(true)
    try {
      const result = await bulkUpdateContactStatus(siteId, selectedIds, status)
      toast.success(`Updated ${result.successCount} contact${result.successCount !== 1 ? 's' : ''}`)
      onActionsComplete()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setProcessing(false)
    }
  }

  const handleBulkLeadStatus = async (leadStatus: string) => {
    setProcessing(true)
    try {
      const result = await bulkUpdateLeadStatus(siteId, selectedIds, leadStatus)
      toast.success(`Updated ${result.successCount} contact${result.successCount !== 1 ? 's' : ''}`)
      onActionsComplete()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setProcessing(false)
    }
  }

  const handleBulkTag = async (tagName: string) => {
    setProcessing(true)
    try {
      const result = await bulkAddTags(siteId, selectedIds, [tagName])
      toast.success(`Tagged ${result.successCount} contact${result.successCount !== 1 ? 's' : ''}`)
      onActionsComplete()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-3 px-4 py-3 bg-card border shadow-xl rounded-xl">
        {/* Count */}
        <div className="flex items-center gap-2">
          <Badge variant="default">{selectedIds.length}</Badge>
          <span className="text-sm font-medium">selected</span>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Status Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={processing}>
              <UserCheck className="h-3.5 w-3.5 mr-1.5" />
              Status
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleBulkStatus('active')}>Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkStatus('inactive')}>Inactive</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkStatus('archived')}>Archived</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleBulkLeadStatus('new')}>Lead: New</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkLeadStatus('qualified')}>Lead: Qualified</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkLeadStatus('unqualified')}>Lead: Unqualified</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tag Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={processing}>
              <Tag className="h-3.5 w-3.5 mr-1.5" />
              Tag
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleBulkTag('VIP')}>Add: VIP</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkTag('Hot Lead')}>Add: Hot Lead</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkTag('Follow Up')}>Add: Follow Up</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkTag('Newsletter')}>Add: Newsletter</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete */}
        <Button
          variant={confirmDelete ? 'destructive' : 'outline'}
          size="sm"
          onClick={handleBulkDelete}
          disabled={processing}
        >
          {processing ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : confirmDelete ? (
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
          ) : (
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          )}
          {confirmDelete ? 'Confirm Delete' : 'Delete'}
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Clear */}
        <Button variant="ghost" size="sm" onClick={onClearSelection} disabled={processing}>
          <X className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  )
}
