/**
 * Merge Contacts Dialog
 * 
 * CRM Enhancement: Duplicate Detection & Contact Merging
 * Finds and merges duplicate contacts.
 * Industry-leader pattern: HubSpot Merge Tool, Salesforce Merge Contacts
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  GitMerge, Search, Loader2, AlertTriangle, CheckCircle2,
  ArrowRight, Users, Mail, Phone,
} from 'lucide-react'
import { findDuplicateContacts, mergeContacts } from '../../actions/bulk-actions'
import type { MergeCandidate, Contact } from '../../types/crm-types'

interface MergeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  onMerged?: () => void
}

function ContactCard({ contact, isPrimary }: { contact: Contact; isPrimary?: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${isPrimary ? 'border-primary bg-primary/5' : 'bg-muted/50'}`}>
      {isPrimary && (
        <Badge variant="default" className="mb-2 text-xs">Primary (Kept)</Badge>
      )}
      <div className="font-medium text-sm">
        {contact.first_name} {contact.last_name}
      </div>
      {contact.email && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <Mail className="h-3 w-3" /> {contact.email}
        </div>
      )}
      {contact.phone && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <Phone className="h-3 w-3" /> {contact.phone}
        </div>
      )}
      {contact.company && (
        <div className="text-xs text-muted-foreground mt-0.5">
          {contact.company}
        </div>
      )}
    </div>
  )
}

export function MergeContactsDialog({ open, onOpenChange, siteId, onMerged }: MergeDialogProps) {
  const [duplicates, setDuplicates] = useState<MergeCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPairs, setSelectedPairs] = useState<Set<number>>(new Set())
  const [merging, setMerging] = useState(false)
  const [mergedCount, setMergedCount] = useState(0)

  const loadDuplicates = useCallback(async () => {
    setLoading(true)
    try {
      const data = await findDuplicateContacts(siteId)
      setDuplicates(data)
    } catch (err) {
      toast.error('Failed to find duplicates')
    } finally {
      setLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    if (open) {
      loadDuplicates()
      setSelectedPairs(new Set())
      setMergedCount(0)
    }
  }, [open, loadDuplicates])

  const togglePair = (index: number) => {
    const newSet = new Set(selectedPairs)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setSelectedPairs(newSet)
  }

  const selectAll = () => {
    if (selectedPairs.size === duplicates.length) {
      setSelectedPairs(new Set())
    } else {
      setSelectedPairs(new Set(duplicates.map((_, i) => i)))
    }
  }

  const handleMerge = async () => {
    if (selectedPairs.size === 0) {
      toast.error('Select at least one duplicate pair to merge')
      return
    }

    setMerging(true)
    let merged = 0

    for (const index of selectedPairs) {
      const pair = duplicates[index]
      if (!pair) continue

      try {
        await mergeContacts(siteId, {
          primaryContactId: pair.primary.id,
          secondaryContactIds: pair.duplicates.map(d => d.id),
        })
        merged++
      } catch (err) {
        toast.error(`Failed to merge: ${pair.primary.email}`)
      }
    }

    setMergedCount(merged)
    setMerging(false)
    
    if (merged > 0) {
      toast.success(`Merged ${merged} duplicate group${merged > 1 ? 's' : ''}`)
      onMerged?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Find & Merge Duplicates
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <Search className="h-8 w-8 animate-pulse mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Scanning for duplicates...</p>
            </div>
            {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : mergedCount > 0 && !merging ? (
          <div className="py-12 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Merge Complete</h3>
            <p className="text-muted-foreground">
              {mergedCount} duplicate group{mergedCount > 1 ? 's' : ''} merged successfully
            </p>
            <Button onClick={() => { setMergedCount(0); loadDuplicates() }}>
              Scan Again
            </Button>
          </div>
        ) : duplicates.length === 0 ? (
          <div className="py-12 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">No Duplicates Found</h3>
            <p className="text-muted-foreground">
              Your contact database looks clean!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 inline mr-1 text-yellow-500" />
                Found {duplicates.length} potential duplicate group{duplicates.length > 1 ? 's' : ''}
              </p>
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedPairs.size === duplicates.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {duplicates.map((pair, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedPairs.has(index) ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'
                  }`}
                  onClick={() => togglePair(index)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedPairs.has(index)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(pair.confidence * 100)}% match
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Matched by: {pair.matchField}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <ContactCard contact={pair.primary} isPrimary />
                        {pair.duplicates.map((dup) => (
                          <ContactCard key={dup.id} contact={dup} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleMerge}
                disabled={merging || selectedPairs.size === 0}
                variant="destructive"
              >
                {merging ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Merging...
                  </>
                ) : (
                  <>
                    <GitMerge className="h-4 w-4 mr-2" />
                    Merge {selectedPairs.size} Group{selectedPairs.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
