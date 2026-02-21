/**
 * Reviews View Component
 * 
 * Phase ECOM-60: Product Reviews & Ratings
 * 
 * Dashboard admin view for moderating product reviews.
 * Supports filtering, bulk actions, admin responses, and status management.
 */
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useEcommerce } from '../../context/ecommerce-context'
import {
  getReviews,
  getReviewCounts,
  updateReviewStatus,
  bulkUpdateReviewStatus,
  addAdminResponse,
  deleteReview,
} from '../../actions/review-actions'
import {
  Star,
  Search,
  CheckCircle,
  XCircle,
  Flag,
  Clock,
  Trash2,
  MessageSquare,
  Filter,
  MoreHorizontal,
  BadgeCheck,
  ThumbsUp,
  Eye,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { Review, ReviewStatus } from '../../types/ecommerce-types'

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<ReviewStatus, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: 'Approved', icon: CheckCircle, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  flagged: { label: 'Flagged', icon: Flag, className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
}

// ============================================================================
// COMPONENT
// ============================================================================

interface ReviewsViewProps {
  searchQuery?: string
}

export function ReviewsView({ searchQuery = '' }: ReviewsViewProps) {
  const { siteId } = useEcommerce()
  const [reviews, setReviews] = useState<Review[]>([])
  const [counts, setCounts] = useState<Record<ReviewStatus | 'all', number>>({
    all: 0, pending: 0, approved: 0, rejected: 0, flagged: 0,
  })
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all')
  const [ratingFilter, setRatingFilter] = useState<number | 0>(0)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [respondDialogOpen, setRespondDialogOpen] = useState(false)
  const [respondingReview, setRespondingReview] = useState<Review | null>(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [detailReview, setDetailReview] = useState<Review | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const pageSize = 20

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    if (!siteId) return
    setIsLoading(true)
    try {
      const [reviewsResult, countsResult] = await Promise.all([
        getReviews(siteId, {
          status: statusFilter,
          rating: ratingFilter || undefined,
          search: searchQuery || undefined,
          page,
          pageSize,
        }),
        getReviewCounts(siteId),
      ])
      setReviews(reviewsResult.reviews)
      setTotal(reviewsResult.total)
      setCounts(countsResult)
    } catch (err) {
      console.error('[ReviewsView] Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [siteId, statusFilter, ratingFilter, searchQuery, page])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, ratingFilter, searchQuery])

  // Actions
  const handleStatusChange = async (reviewId: string, status: ReviewStatus) => {
    const result = await updateReviewStatus(reviewId, status)
    if (result.success) {
      fetchReviews()
    }
  }

  const handleBulkAction = async (status: ReviewStatus) => {
    if (selectedIds.length === 0) return
    const result = await bulkUpdateReviewStatus(selectedIds, status)
    if (result.success) {
      setSelectedIds([])
      fetchReviews()
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This cannot be undone.')) return
    const result = await deleteReview(reviewId)
    if (result.success) {
      fetchReviews()
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Delete ${selectedIds.length} selected reviews? This cannot be undone.`)) return
    // Delete one by one (no bulk delete action)
    for (const id of selectedIds) {
      await deleteReview(id)
    }
    setSelectedIds([])
    fetchReviews()
  }

  const handleRespondSubmit = async () => {
    if (!respondingReview || !adminResponse.trim()) return
    const result = await addAdminResponse(respondingReview.id, adminResponse.trim())
    if (result.success) {
      setRespondDialogOpen(false)
      setRespondingReview(null)
      setAdminResponse('')
      fetchReviews()
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === reviews.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(reviews.map(r => r.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Product Reviews</h2>
          <p className="text-sm text-muted-foreground">
            Moderate and manage customer reviews
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReviews} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto">
        {(['all', 'pending', 'approved', 'rejected', 'flagged'] as const).map((status) => {
          const config = status === 'all' ? null : statusConfig[status]
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap',
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {status === 'all' ? 'All' : config?.label}
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {counts[status]}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Rating Filter */}
        <Select value={String(ratingFilter)} onValueChange={(v) => setRatingFilter(Number(v))}>
          <SelectTrigger className="w-[130px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </span>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('approved')}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('rejected')}>
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Reviews Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">No reviews found</h3>
          <p className="text-sm text-muted-foreground">
            {statusFilter !== 'all' ? 'Try changing the status filter' : 'Reviews will appear here when customers submit them'}
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.length === reviews.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead className="w-24">Rating</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-32">Date</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => {
                  const config = statusConfig[review.status]
                  const StatusIcon = config.icon
                  return (
                    <TableRow key={review.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(review.id)}
                          onCheckedChange={() => toggleSelect(review.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{review.reviewer_name}</span>
                            {review.verified_purchase && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <BadgeCheck className="h-3 w-3" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          {review.title && (
                            <p className="text-sm font-medium">{review.title}</p>
                          )}
                          {review.body && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {review.body}
                            </p>
                          )}
                          {review.admin_response && (
                            <p className="text-xs text-primary flex items-center gap-1 mt-1">
                              <MessageSquare className="h-3 w-3" />
                              Response added
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-3.5 w-3.5',
                                i < review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-none text-muted-foreground/30'
                              )}
                            />
                          ))}
                        </div>
                        {review.helpful_count > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <ThumbsUp className="h-3 w-3" />
                            {review.helpful_count}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-xs', config.className)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setDetailReview(review); setDetailDialogOpen(true) }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {review.status !== 'approved' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(review.id, 'approved')}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {review.status !== 'rejected' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(review.id, 'rejected')}>
                                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                Reject
                              </DropdownMenuItem>
                            )}
                            {review.status !== 'flagged' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(review.id, 'flagged')}>
                                <Flag className="h-4 w-4 mr-2 text-orange-500" />
                                Flag
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setRespondingReview(review)
                              setAdminResponse(review.admin_response || '')
                              setRespondDialogOpen(true)
                            }}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {review.admin_response ? 'Edit Response' : 'Respond'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(review.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Respond Dialog */}
      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {respondingReview?.admin_response ? 'Edit' : 'Add'} Response
            </DialogTitle>
            <DialogDescription>
              Your response will be visible below the customer&apos;s review on the storefront.
            </DialogDescription>
          </DialogHeader>

          {respondingReview && (
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{respondingReview.reviewer_name}</span>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-3 w-3',
                          i < respondingReview.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-none text-muted-foreground/30'
                        )}
                      />
                    ))}
                  </div>
                </div>
                {respondingReview.title && (
                  <p className="text-sm font-medium">{respondingReview.title}</p>
                )}
                {respondingReview.body && (
                  <p className="text-sm text-muted-foreground">{respondingReview.body}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Your Response</label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Write your response..."
                  rows={4}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRespondSubmit} disabled={!adminResponse.trim()}>
              Save Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>

          {detailReview && (
            <div className="space-y-4">
              {/* Reviewer Info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{detailReview.reviewer_name}</p>
                  {detailReview.reviewer_email && (
                    <p className="text-sm text-muted-foreground">{detailReview.reviewer_email}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {detailReview.verified_purchase && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                  <Badge variant="secondary" className={cn('text-xs', statusConfig[detailReview.status].className)}>
                    {statusConfig[detailReview.status].label}
                  </Badge>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-5 w-5',
                      i < detailReview.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-none text-muted-foreground/30'
                    )}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-1">
                  {detailReview.rating}/5
                </span>
              </div>

              {/* Content */}
              {detailReview.title && (
                <h4 className="font-semibold">{detailReview.title}</h4>
              )}
              {detailReview.body && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {detailReview.body}
                </p>
              )}

              {/* Admin Response */}
              {detailReview.admin_response && (
                <div className="border-l-2 border-primary/30 bg-primary/5 rounded-r-md p-3">
                  <p className="text-xs font-semibold text-primary mb-1">Store Response</p>
                  <p className="text-sm text-muted-foreground">{detailReview.admin_response}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t text-sm">
                <div>
                  <span className="text-muted-foreground">Submitted:</span>{' '}
                  {new Date(detailReview.created_at).toLocaleString()}
                </div>
                <div>
                  <span className="text-muted-foreground">Helpful votes:</span>{' '}
                  {detailReview.helpful_count}
                </div>
                <div>
                  <span className="text-muted-foreground">Product ID:</span>{' '}
                  <span className="font-mono text-xs">{detailReview.product_id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
