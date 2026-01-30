'use client'

/**
 * Approvals Page Wrapper Component
 * 
 * Client component for managing post approvals workflow
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Card, 
  CardContent, 
  CardHeader 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  User,
  Image,
  AlertCircle
} from 'lucide-react'
import { approvePost, rejectPost } from '../actions/post-actions'
import type { SocialPost } from '../types'
import { toast } from 'sonner'

interface ApprovalsPageWrapperProps {
  siteId: string
  userId: string
  pendingPosts: SocialPost[]
  totalPending?: number
}

export function ApprovalsPageWrapper({
  siteId,
  userId,
  pendingPosts,
  totalPending: _totalPending,
}: ApprovalsPageWrapperProps) {
  const router = useRouter()
  const [posts, setPosts] = useState(pendingPosts)
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const handleApprove = async (postId: string) => {
    setIsProcessing(true)
    
    try {
      const { success: _success, error } = await approvePost(postId, siteId, userId)
      
      if (error) throw new Error(error)
      
      setPosts(prev => prev.filter(p => p.id !== postId))
      toast.success('Post approved successfully')
      router.refresh()
    } catch (error) {
      toast.error((error as Error).message || 'Failed to approve post')
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleReject = async () => {
    if (!selectedPost || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    
    setIsProcessing(true)
    
    try {
      const { success: _success2, error } = await rejectPost(selectedPost.id, siteId, userId, rejectReason)
      
      if (error) throw new Error(error)
      
      setPosts(prev => prev.filter(p => p.id !== selectedPost.id))
      toast.success('Post rejected and returned to draft')
      setIsRejectDialogOpen(false)
      setSelectedPost(null)
      setRejectReason('')
      router.refresh()
    } catch (error) {
      toast.error((error as Error).message || 'Failed to reject post')
    } finally {
      setIsProcessing(false)
    }
  }
  
  const openRejectDialog = (post: SocialPost) => {
    setSelectedPost(post)
    setIsRejectDialogOpen(true)
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pending Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve posts before they are published
          </p>
        </div>
        
        {posts.length > 0 && (
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {posts.length} pending
          </Badge>
        )}
      </div>
      
      {/* Empty State */}
      {posts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              There are no posts waiting for approval
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Pending Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <ApprovalCard 
            key={post.id}
            post={post}
            onApprove={() => handleApprove(post.id)}
            onReject={() => openRejectDialog(post)}
            isProcessing={isProcessing}
          />
        ))}
      </div>
      
      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Post</DialogTitle>
            <DialogDescription>
              Provide feedback for the content creator. The post will be returned to draft status.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection (e.g., 'Please update the image' or 'Needs brand voice adjustment')..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRejectDialogOpen(false)
                setRejectReason('')
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectReason.trim()}
            >
              {isProcessing ? 'Rejecting...' : 'Reject Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ApprovalCard({
  post,
  onApprove,
  onReject,
  isProcessing,
}: {
  post: SocialPost
  onApprove: () => void
  onReject: () => void
  isProcessing: boolean
}) {
  // Get platform icons for target accounts
  const _platforms = new Set<string>()
  // In real implementation, we'd look up account platforms
  // For now, show a generic indicator
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Submitted by: Creator</span>
              <span>•</span>
              <Clock className="h-4 w-4" />
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
            {post.scheduledAt && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Calendar className="h-4 w-4" />
                <span>Scheduled for: {new Date(post.scheduledAt).toLocaleString()}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {post.targetAccounts?.length || 0} accounts
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Post Content */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>
        
        {/* Media Preview */}
        {post.media && post.media.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image className="h-4 w-4" />
            <span>{post.media.length} media attachment{post.media.length > 1 ? 's' : ''}</span>
          </div>
        )}
        
        {/* Link URL */}
        {post.linkUrl && (
          <div className="text-sm">
            <span className="text-muted-foreground">Link: </span>
            <a 
              href={post.linkUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {post.linkUrl}
            </a>
          </div>
        )}
        
        {/* Labels */}
        {post.labels && post.labels.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {post.labels.map((label) => (
              <Badge key={label} variant="secondary">
                {label}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Review carefully before approving</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onReject}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={onApprove}
              disabled={isProcessing}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
