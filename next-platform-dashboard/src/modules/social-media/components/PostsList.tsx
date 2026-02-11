'use client'

/**
 * Social Media Posts List Component
 * 
 * Phase SM-07: Missing Pages & Full Navigation
 * Comprehensive posts management with filters, search, bulk actions
 */

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { toast } from 'sonner'
import {
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  ExternalLink,
  FileText,
  Calendar,
  Send,
  Filter,
  CheckSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { DEFAULT_TIMEZONE } from '@/lib/locale-config'
import type { SocialPost, SocialAccount, PostStatus } from '@/modules/social-media/types'

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending_approval', label: 'Pending Approval' },
]

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  publishing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  partially_published: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pending_approval: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  archived: 'bg-muted text-muted-foreground',
}

interface PostsListProps {
  siteId: string
  posts: SocialPost[]
  accounts: SocialAccount[]
  onDelete: (postId: string) => Promise<{ success: boolean; error: string | null }>
  onDuplicate: (postId: string) => Promise<{ post: SocialPost | null; error: string | null }>
  onBulkDelete: (postIds: string[]) => Promise<{ successCount: number; failCount: number; error: string | null }>
}

export function PostsList({ siteId, posts, accounts, onDelete, onDuplicate, onBulkDelete }: PostsListProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value)
  }, 300)

  const filteredPosts = useMemo(() => {
    let result = posts

    // Status filter
    if (activeTab !== 'all') {
      result = result.filter(p => p.status === activeTab)
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        (p.content?.toLowerCase().includes(q))
      )
    }

    // Platform filter
    if (platformFilter !== 'all') {
      result = result.filter(p =>
        p.targetAccounts?.some((a: any) => {
          const account = accounts.find(acc => acc.id === (typeof a === 'string' ? a : a.accountId))
          return account?.platform === platformFilter
        })
      )
    }

    return result
  }, [posts, activeTab, searchQuery, platformFilter, accounts])

  const handleDelete = useCallback(async (postId: string) => {
    setIsDeleting(true)
    const result = await onDelete(postId)
    setIsDeleting(false)
    if (result.error) {
      toast.error('Failed to delete post', { description: result.error })
    } else {
      toast.success('Post deleted')
    }
    setPostToDelete(null)
    setDeleteDialogOpen(false)
  }, [onDelete])

  const handleBulkDelete = useCallback(async () => {
    setIsDeleting(true)
    const result = await onBulkDelete(Array.from(selectedPosts))
    setIsDeleting(false)
    if (result.error) {
      toast.error('Failed to delete some posts', { description: result.error })
    } else {
      toast.success(`Deleted ${result.successCount} post(s)`)
    }
    setSelectedPosts(new Set())
    setBulkDeleteDialogOpen(false)
  }, [onBulkDelete, selectedPosts])

  const handleDuplicate = useCallback(async (postId: string) => {
    const result = await onDuplicate(postId)
    if (result.error) {
      toast.error('Failed to duplicate post', { description: result.error })
    } else {
      toast.success('Post duplicated as draft')
    }
  }, [onDuplicate])

  const toggleSelect = useCallback((postId: string) => {
    setSelectedPosts(prev => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set())
    } else {
      setSelectedPosts(new Set(filteredPosts.map(p => p.id)))
    }
  }, [filteredPosts, selectedPosts.size])

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—'
    return new Intl.DateTimeFormat('en-ZM', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: DEFAULT_TIMEZONE,
    }).format(new Date(dateStr))
  }

  const getContentPreview = (post: SocialPost) => {
    const content = post.content || ''
    return content.length > 120 ? content.substring(0, 120) + '…' : content
  }

  const platforms = useMemo(() => {
    const set = new Set<string>()
    accounts.forEach(a => set.add(a.platform))
    return Array.from(set)
  }, [accounts])

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" strokeWidth={1.5} />
        <h3 className="text-lg font-semibold">No posts yet</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Create your first social media post to get started.
        </p>
        <Link href={`/dashboard/sites/${siteId}/social/compose`}>
          <Button className="mt-4" size="sm">
            <Send className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Create your first post
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Posts</h2>
          <p className="text-muted-foreground">Manage all your social media posts</p>
        </div>
        <Link href={`/dashboard/sites/${siteId}/social/compose`}>
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" strokeWidth={1.5} />
            New Post
          </Button>
        </Link>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={activeTab} onValueChange={setActiveTab} aria-label="Post status filter">
          <TabsList>
            {STATUS_TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                {tab.value !== 'all' && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {posts.filter(p => p.status === tab.value).length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex-1" />

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Input
            placeholder="Search posts..."
            className="pl-9"
            onChange={e => debouncedSearch(e.target.value)}
            aria-label="Search posts"
          />
        </div>

        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-40" aria-label="Filter by platform">
            <Filter className="h-4 w-4 mr-2" strokeWidth={1.5} />
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {platforms.map(p => (
              <SelectItem key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-9 w-9 rounded-r-none"
            onClick={() => setViewMode('table')}
            aria-label="Table view"
          >
            <List className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-9 w-9 rounded-l-none"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedPosts.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <CheckSquare className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-sm font-medium">{selectedPosts.size} selected</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleteDialogOpen(true)}
            aria-label="Delete selected posts"
          >
            <Trash2 className="h-4 w-4 mr-1" strokeWidth={1.5} />
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedPosts(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Results info */}
      {filteredPosts.length === 0 && posts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No posts match your filters. Try adjusting the search or status filter.
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredPosts.length > 0 && (
        <div className="rounded-md border">
          <table className="w-full" role="table" aria-label="Posts list">
            <thead>
              <tr className="border-b bg-muted/50">
                <th scope="col" className="p-3 w-10">
                  <Checkbox
                    checked={selectedPosts.size === filteredPosts.length && filteredPosts.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all posts"
                  />
                </th>
                <th scope="col" className="p-3 text-left text-sm font-medium text-muted-foreground">Content</th>
                <th scope="col" className="p-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th scope="col" className="p-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th scope="col" className="p-3 text-right text-sm font-medium text-muted-foreground">Engagement</th>
                <th scope="col" className="p-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map(post => (
                <tr
                  key={post.id}
                  className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/dashboard/sites/${siteId}/social/compose?edit=${post.id}`)}
                >
                  <td className="p-3" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedPosts.has(post.id)}
                      onCheckedChange={() => toggleSelect(post.id)}
                      aria-label={`Select post: ${getContentPreview(post).substring(0, 30)}`}
                    />
                  </td>
                  <td className="p-3">
                    <p className="text-sm line-clamp-2">{getContentPreview(post)}</p>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[post.status] || ''}
                      aria-label={`Status: ${post.status}`}
                    >
                      {post.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(post.scheduledAt || post.publishedAt || post.createdAt)}
                  </td>
                  <td className="p-3 text-sm text-right text-muted-foreground">
                    {post.status === 'published' ? (
                      <span>{(post.totalImpressions || 0).toLocaleString()} imp</span>
                    ) : '—'}
                  </td>
                  <td className="p-3" onClick={e => e.stopPropagation()}>
                    <PostActions
                      post={post}
                      siteId={siteId}
                      onDelete={(id) => { setPostToDelete(id); setDeleteDialogOpen(true) }}
                      onDuplicate={handleDuplicate}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredPosts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map(post => (
            <Card
              key={post.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/dashboard/sites/${siteId}/social/compose?edit=${post.id}`)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <Badge
                    variant="outline"
                    className={STATUS_COLORS[post.status] || ''}
                    aria-label={`Status: ${post.status}`}
                  >
                    {post.status.replace(/_/g, ' ')}
                  </Badge>
                  <div onClick={e => e.stopPropagation()}>
                    <PostActions
                      post={post}
                      siteId={siteId}
                      onDelete={(id) => { setPostToDelete(id); setDeleteDialogOpen(true) }}
                      onDuplicate={handleDuplicate}
                    />
                  </div>
                </div>
                <p className="text-sm line-clamp-3">{getContentPreview(post)}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" strokeWidth={1.5} />
                    {formatDate(post.scheduledAt || post.publishedAt || post.createdAt)}
                  </span>
                  {post.status === 'published' && (
                    <span>{(post.totalImpressions || 0).toLocaleString()} imp</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => postToDelete && handleDelete(postToDelete)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedPosts.size} post(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All selected posts will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : `Delete ${selectedPosts.size} post(s)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PostActions({
  post,
  siteId,
  onDelete,
  onDuplicate,
}: {
  post: SocialPost
  siteId: string
  onDelete: (postId: string) => void
  onDuplicate: (postId: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Post actions">
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/sites/${siteId}/social/compose?edit=${post.id}`}>
            <Eye className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(post.id)}>
          <Copy className="h-4 w-4 mr-2" strokeWidth={1.5} />
          Duplicate
        </DropdownMenuItem>
        {post.status === 'published' && post.publishResults?.[0]?.url && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={post.publishResults[0].url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" strokeWidth={1.5} />
                View on Platform
              </a>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => onDelete(post.id)}
        >
          <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
