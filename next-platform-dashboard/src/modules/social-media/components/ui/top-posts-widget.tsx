'use client'

/**
 * Top Posts Widget Component
 * 
 * PHASE-UI-11A: Social Media Dashboard UI Overhaul
 * Enhanced display of top performing posts with detailed metrics
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  BarChart2,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { SocialPost, SocialAccount, SocialPlatform } from '../../types'

// =============================================================================
// TYPES
// =============================================================================

export interface TopPostsWidgetProps {
  /** Posts to display (should be sorted by performance) */
  posts: SocialPost[]
  /** Accounts for platform info */
  accounts: SocialAccount[]
  /** Maximum number of posts to show */
  maxPosts?: number
  /** View all callback */
  onViewAll?: () => void
  /** Post click callback */
  onPostClick?: (post: SocialPost) => void
  /** Loading state */
  isLoading?: boolean
  /** Additional class names */
  className?: string
}

interface PostMetrics {
  impressions: number
  likes: number
  comments: number
  shares: number
  engagementRate: number
}

// =============================================================================
// PLATFORM CONFIG
// =============================================================================

const PLATFORM_CONFIG: Record<SocialPlatform, { color: string; icon: string }> = {
  facebook: { color: '#1877F2', icon: '📘' },
  instagram: { color: '#E4405F', icon: '📷' },
  twitter: { color: '#1DA1F2', icon: '🐦' },
  linkedin: { color: '#0A66C2', icon: '💼' },
  tiktok: { color: '#000000', icon: '🎵' },
  youtube: { color: '#FF0000', icon: '📺' },
  pinterest: { color: '#E60023', icon: '📌' },
  threads: { color: '#000000', icon: '🧵' },
  bluesky: { color: '#0085FF', icon: '🦋' },
  mastodon: { color: '#6364FF', icon: '🐘' },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

function getPostMetrics(post: SocialPost): PostMetrics {
  // In a real implementation, these would come from the post object
  const postAny = post as unknown as Record<string, unknown>
  const impressions = (postAny.impressions as number) || 0
  const likes = (postAny.likes as number) || 0
  const comments = (postAny.comments as number) || 0
  const shares = (postAny.shares as number) || 0
  const engagementRate = impressions > 0 
    ? ((likes + comments + shares) / impressions) * 100 
    : 0
  
  return { impressions, likes, comments, shares, engagementRate }
}

function getRelativeTime(date: string): string {
  const now = new Date()
  const postDate = new Date(date)
  const diff = now.getTime() - postDate.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

// =============================================================================
// POST CARD COMPONENT
// =============================================================================

interface PostCardProps {
  post: SocialPost
  account?: SocialAccount
  rank: number
  isExpanded: boolean
  onToggle: () => void
  onClick?: () => void
}

function PostCard({ post, account, rank, isExpanded, onToggle, onClick }: PostCardProps) {
  const metrics = getPostMetrics(post)
  const config = account ? PLATFORM_CONFIG[account.platform] : null

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: rank * 0.05 }}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div 
          className={cn(
            'group rounded-lg border p-4 transition-all',
            'hover:shadow-md hover:border-primary/30',
            isExpanded && 'border-primary/30 shadow-sm'
          )}
        >
          {/* Header */}
          <div className="flex items-start gap-3">
            {/* Rank Badge */}
            <div 
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0',
                rank === 1 && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                rank === 2 && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                rank === 3 && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                rank > 3 && 'bg-muted text-muted-foreground'
              )}
            >
              {rank}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {account && (
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={account.accountAvatar || undefined} />
                    <AvatarFallback style={{ backgroundColor: config?.color }}>
                      <span className="text-xs">{config?.icon}</span>
                    </AvatarFallback>
                  </Avatar>
                )}
                <span className="text-sm text-muted-foreground">
                  {account?.accountName}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {post.publishedAt ? getRelativeTime(post.publishedAt) : 'Draft'}
                </span>
              </div>
              
              <p className="text-sm line-clamp-2 mb-2">{post.content}</p>

              {/* Quick Metrics */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {formatNumber(metrics.impressions)}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {formatNumber(metrics.likes)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {formatNumber(metrics.comments)}
                </span>
                <span className="flex items-center gap-1">
                  <Share2 className="h-4 w-4" />
                  {formatNumber(metrics.shares)}
                </span>
              </div>
            </div>

            {/* Media Preview */}
            {post.media && post.media.length > 0 && post.media[0].thumbnailUrl && (
              <img
                src={post.media[0].thumbnailUrl}
                alt=""
                className="h-16 w-16 rounded-lg object-cover shrink-0"
              />
            )}

            {/* Expand Toggle */}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <ChevronDown className={cn(
                  'h-4 w-4 transition-transform',
                  isExpanded && 'rotate-180'
                )} />
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pt-4 mt-4 border-t"
                >
                  {/* Detailed Metrics */}
                  <div className="grid grid-cols-5 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Eye className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                      <p className="text-lg font-semibold">{formatNumber(metrics.impressions)}</p>
                      <p className="text-xs text-muted-foreground">Impressions</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Heart className="h-5 w-5 mx-auto mb-1 text-red-500" />
                      <p className="text-lg font-semibold">{formatNumber(metrics.likes)}</p>
                      <p className="text-xs text-muted-foreground">Likes</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <MessageCircle className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                      <p className="text-lg font-semibold">{formatNumber(metrics.comments)}</p>
                      <p className="text-xs text-muted-foreground">Comments</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Share2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
                      <p className="text-lg font-semibold">{formatNumber(metrics.shares)}</p>
                      <p className="text-xs text-muted-foreground">Shares</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <TrendingUp className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                      <p className="text-lg font-semibold">{metrics.engagementRate.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Eng. Rate</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {onClick && (
                      <Button variant="outline" size="sm" onClick={onClick}>
                        <BarChart2 className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    )}
                    {(() => {
                      const postUrl = post.publishResults ? Object.values(post.publishResults)[0]?.url : null
                      return postUrl ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={postUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Original
                          </a>
                        </Button>
                      ) : null
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </motion.div>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

function PostSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
        </div>
        <div className="w-16 h-16 rounded-lg bg-muted animate-pulse" />
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TopPostsWidget({
  posts,
  accounts,
  maxPosts = 5,
  onViewAll,
  onPostClick,
  isLoading,
  className,
}: TopPostsWidgetProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const displayPosts = posts.slice(0, maxPosts)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">Top Performing Posts</CardTitle>
            <CardDescription>
              Your best posts by engagement
            </CardDescription>
          </div>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <PostSkeleton key={i} />
              ))}
            </div>
          ) : displayPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No published posts yet</p>
              <p className="text-sm">Create and publish posts to see performance data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayPosts.map((post, index) => {
                const account = accounts.find(a => a.id === post.accountId)
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    account={account}
                    rank={index + 1}
                    isExpanded={expandedId === post.id}
                    onToggle={() => setExpandedId(expandedId === post.id ? null : post.id)}
                    onClick={onPostClick ? () => onPostClick(post) : undefined}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default TopPostsWidget
