'use client'

/**
 * CannedResponsesPageWrapper — Quick-reply template management
 */

import { useState, useCallback, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Plus, Search, Zap, Pencil, Trash2, Hash, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { LiveChatEmptyState } from '../shared/LiveChatEmptyState'
import {
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
} from '@/modules/live-chat/actions/canned-response-actions'
import type { CannedResponse } from '@/modules/live-chat/types'

interface CannedResponsesPageWrapperProps {
  responses: CannedResponse[]
  siteId: string
}

export function CannedResponsesPageWrapper({
  responses: initialResponses,
  siteId,
}: CannedResponsesPageWrapperProps) {
  const [isPending, startTransition] = useTransition()
  const [responses, setResponses] = useState(initialResponses)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    content: '',
    shortcut: '',
    category: '',
    tags: '',
  })

  const resetForm = () => {
    setForm({ title: '', content: '', shortcut: '', category: '', tags: '' })
  }

  const handleCreate = useCallback(() => {
    if (!form.title || !form.content) {
      toast.error('Title and content are required')
      return
    }
    startTransition(async () => {
      const result = await createCannedResponse({
        siteId,
        title: form.title,
        content: form.content,
        shortcut: form.shortcut || undefined,
        category: form.category || undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
      })
      if (result.error) {
        toast.error(result.error)
      } else if (result.response) {
        setResponses((prev) => [result.response!, ...prev])
        setShowCreate(false)
        resetForm()
        toast.success('Canned response created')
      }
    })
  }, [form, siteId])

  const handleEdit = useCallback(() => {
    if (!editingId || !form.title || !form.content) return
    startTransition(async () => {
      const result = await updateCannedResponse(editingId, {
        title: form.title,
        content: form.content,
        shortcut: form.shortcut || undefined,
        category: form.category || undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
      })
      if (result.error) {
        toast.error(result.error)
      } else if (result.success) {
        setResponses((prev) =>
          prev.map((r) =>
            r.id === editingId
              ? {
                  ...r,
                  title: form.title,
                  content: form.content,
                  shortcut: form.shortcut || null,
                  category: form.category || null,
                  tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : r.tags,
                }
              : r
          )
        )
        setEditingId(null)
        resetForm()
        toast.success('Canned response updated')
      }
    })
  }, [editingId, form])

  const handleDelete = useCallback(() => {
    if (!deleteId) return
    startTransition(async () => {
      const result = await deleteCannedResponse(deleteId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setResponses((prev) => prev.filter((r) => r.id !== deleteId))
        setDeleteId(null)
        toast.success('Canned response deleted')
      }
    })
  }, [deleteId])

  const startEdit = (cr: CannedResponse) => {
    setForm({
      title: cr.title,
      content: cr.content,
      shortcut: cr.shortcut || '',
      category: cr.category || '',
      tags: cr.tags?.join(', ') || '',
    })
    setEditingId(cr.id)
  }

  const filteredResponses = searchQuery
    ? responses.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.shortcut?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : responses

  // Group by category
  const categories = Array.from(
    new Set(filteredResponses.map((r) => r.category || 'Uncategorized'))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Canned Responses
          </h2>
          <p className="text-muted-foreground">
            Quick reply templates — type / in chat to use
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Response
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Canned Response</DialogTitle>
            </DialogHeader>
            <CannedResponseForm
              form={form}
              setForm={setForm}
              onSubmit={handleCreate}
              isPending={isPending}
              submitLabel="Create"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search responses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Responses */}
      {filteredResponses.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <LiveChatEmptyState
              icon={Zap}
              title="No canned responses"
              description="Create quick reply templates to speed up agent responses"
              action={{
                label: 'Create First Response',
                onClick: () => setShowCreate(true),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredResponses
                  .filter(
                    (r) => (r.category || 'Uncategorized') === category
                  )
                  .map((cr) => (
                    <Card key={cr.id} className="group">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium">{cr.title}</h4>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => startEdit(cr)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setDeleteId(cr.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {cr.shortcut && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] mt-1 font-mono"
                          >
                            /{cr.shortcut}
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                          {cr.content}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <Hash className="h-3 w-3" />
                          Used {cr.usageCount} times
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog
        open={!!editingId}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null)
            resetForm()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Canned Response</DialogTitle>
          </DialogHeader>
          <CannedResponseForm
            form={form}
            setForm={setForm}
            onSubmit={handleEdit}
            isPending={isPending}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete canned response?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Shared form component ────────────────────────────────────────────────────

function CannedResponseForm({
  form,
  setForm,
  onSubmit,
  isPending,
  submitLabel,
}: {
  form: { title: string; content: string; shortcut: string; category: string; tags: string }
  setForm: (f: typeof form) => void
  onSubmit: () => void
  isPending: boolean
  submitLabel: string
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Greeting"
        />
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="Hi! How can I help you today?"
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Shortcut</Label>
          <Input
            value={form.shortcut}
            onChange={(e) => setForm({ ...form, shortcut: e.target.value })}
            placeholder="greeting"
          />
          <p className="text-xs text-muted-foreground">
            Type /{form.shortcut || 'shortcut'} in chat to use
          </p>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. General, Sales"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tags (comma-separated)</Label>
        <Input
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder="welcome, first-contact"
        />
      </div>
      <Button onClick={onSubmit} disabled={isPending} className="w-full">
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  )
}
