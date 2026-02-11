'use client'

/**
 * KnowledgeBasePageWrapper — Article management for AI auto-responder
 */

import { useState, useCallback, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Plus,
  Search,
  BookOpen,
  Pencil,
  Trash2,
  Info,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { LiveChatEmptyState } from '../shared/LiveChatEmptyState'
import {
  createArticle,
  updateArticle,
  deleteArticle,
} from '@/modules/live-chat/actions/knowledge-base-actions'
import type { KnowledgeBaseArticle } from '@/modules/live-chat/types'

interface KnowledgeBasePageWrapperProps {
  articles: KnowledgeBaseArticle[]
  siteId: string
}

export function KnowledgeBasePageWrapper({
  articles: initialArticles,
  siteId,
}: KnowledgeBasePageWrapperProps) {
  const [isPending, startTransition] = useTransition()
  const [articles, setArticles] = useState(initialArticles)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
  })

  const resetForm = () => {
    setForm({ title: '', content: '', category: '', tags: '' })
  }

  const handleCreate = useCallback(() => {
    if (!form.title || !form.content) {
      toast.error('Title and content are required')
      return
    }
    startTransition(async () => {
      const result = await createArticle({
        siteId,
        title: form.title,
        content: form.content,
        category: form.category || undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
      })
      if (result.error) {
        toast.error(result.error)
      } else if (result.article) {
        setArticles((prev) => [result.article!, ...prev])
        setShowCreate(false)
        resetForm()
        toast.success('Article created')
      }
    })
  }, [form, siteId])

  const handleEdit = useCallback(() => {
    if (!editingId || !form.title || !form.content) return
    startTransition(async () => {
      const result = await updateArticle(editingId, {
        title: form.title,
        content: form.content,
        category: form.category || undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
      })
      if (result.error) {
        toast.error(result.error)
      } else if (result.success) {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === editingId
              ? {
                  ...a,
                  title: form.title,
                  content: form.content,
                  category: form.category || null,
                  tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : a.tags,
                }
              : a
          )
        )
        setEditingId(null)
        resetForm()
        toast.success('Article updated')
      }
    })
  }, [editingId, form])

  const handleDelete = useCallback(() => {
    if (!deleteId) return
    startTransition(async () => {
      const result = await deleteArticle(deleteId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setArticles((prev) => prev.filter((a) => a.id !== deleteId))
        setDeleteId(null)
        toast.success('Article deleted')
      }
    })
  }, [deleteId])

  const startEdit = (article: KnowledgeBaseArticle) => {
    setForm({
      title: article.title,
      content: article.content,
      category: article.category || '',
      tags: article.tags?.join(', ') || '',
    })
    setEditingId(article.id)
  }

  const filteredArticles = searchQuery
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles

  const categories = Array.from(
    new Set(filteredArticles.map((a) => a.category || 'Uncategorized'))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Knowledge Base</h2>
          <p className="text-muted-foreground">
            Articles for AI auto-responder and agent reference
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Knowledge Base Article</DialogTitle>
            </DialogHeader>
            <ArticleForm
              form={form}
              setForm={setForm}
              onSubmit={handleCreate}
              isPending={isPending}
              submitLabel="Create Article"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* AI info banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
            AI-Powered Responses
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
            Articles added here will be used by the AI auto-responder to answer
            common visitor questions automatically. The more detailed your
            articles, the better the AI responses.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Articles */}
      {filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <LiveChatEmptyState
              icon={BookOpen}
              title="No knowledge base articles"
              description="Add articles to help AI auto-respond to visitor questions"
              action={{
                label: 'Create First Article',
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
              <div className="space-y-3">
                {filteredArticles
                  .filter(
                    (a) => (a.category || 'Uncategorized') === category
                  )
                  .map((article) => (
                    <Card key={article.id} className="group">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium">
                              {article.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {article.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {article.tags?.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              <span className="text-xs text-muted-foreground">
                                Matched {article.usageCount} times
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => startEdit(article)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setDeleteId(article.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
          </DialogHeader>
          <ArticleForm
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
            <AlertDialogTitle>Delete article?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this article from the knowledge base.
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

// ─── Shared form ──────────────────────────────────────────────────────────────

function ArticleForm({
  form,
  setForm,
  onSubmit,
  isPending,
  submitLabel,
}: {
  form: { title: string; content: string; category: string; tags: string }
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
          placeholder="e.g. Return Policy"
        />
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="Detailed article content that AI will use to answer questions..."
          rows={8}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Policies, FAQ"
          />
        </div>
        <div className="space-y-2">
          <Label>Tags (comma-separated)</Label>
          <Input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="returns, refund, policy"
          />
        </div>
      </div>
      <Button onClick={onSubmit} disabled={isPending} className="w-full">
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  )
}
