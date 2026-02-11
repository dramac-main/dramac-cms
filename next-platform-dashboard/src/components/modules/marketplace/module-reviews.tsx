'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  CircleCheck,
  Send
} from 'lucide-react';
import { 
  submitModuleReview, 
  voteOnReview,
  type ModuleReview 
} from '@/lib/modules/marketplace-search';
import { toast } from 'sonner';

interface ModuleReviewsProps {
  moduleId: string;
  reviews: ModuleReview[];
}

export function ModuleReviews({ moduleId, reviews: initialReviews }: ModuleReviewsProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votingReviewId, setVotingReviewId] = useState<string | null>(null);

  const handleSubmitReview = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a review comment');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitModuleReview(
        moduleId, 
        newRating, 
        newComment.trim(),
        newTitle.trim() || undefined
      );

      if (result.success) {
        toast.success('Your review has been submitted');
        setShowReviewForm(false);
        setNewRating(5);
        setNewTitle('');
        setNewComment('');
        // In a real app, you'd refetch reviews here
      } else {
        toast.error(result.error || 'Failed to submit review');
      }
    } catch (_error) {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    setVotingReviewId(reviewId);
    try {
      const result = await voteOnReview(reviewId, isHelpful);
      if (result.success) {
        // Update local state
        setReviews(prev => prev.map(r => 
          r.id === reviewId 
            ? { ...r, helpful_count: r.helpful_count + (isHelpful ? 1 : 0) }
            : r
        ));
        toast.success('Your feedback has been recorded');
      }
    } catch (error) {
      console.error('Vote error:', error);
    } finally {
      setVotingReviewId(null);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => Math.floor(r.rating) === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => Math.floor(r.rating) === rating).length / reviews.length) * 100
      : 0
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Reviews ({reviews.length})
          </CardTitle>
          <Button 
            variant={showReviewForm ? 'secondary' : 'default'}
            size="sm"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            {showReviewForm ? 'Cancel' : 'Write a Review'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Summary */}
        {reviews.length > 0 && (
          <div className="flex gap-8 items-start">
            <div className="text-center">
              <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {reviews.length} reviews
              </p>
            </div>
            <div className="flex-1 space-y-1">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-12">{rating} stars</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= newRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Title (optional)</label>
                <Input
                  placeholder="Summarize your experience..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Your Review</label>
                <Textarea
                  placeholder="Share your experience with this module..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                />
              </div>
              
              <Button 
                onClick={handleSubmitReview}
                disabled={submitting || !newComment.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review}
                onVote={(isHelpful) => handleVote(review.id, isHelpful)}
                isVoting={votingReviewId === review.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reviews yet</p>
            <p className="text-sm mt-1">Be the first to review this module!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ReviewCardProps {
  review: ModuleReview;
  onVote: (isHelpful: boolean) => void;
  isVoting: boolean;
}

function ReviewCard({ review, onVote, isVoting }: ReviewCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            {review.verified_purchase && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <CircleCheck className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          {review.title && (
            <h4 className="font-semibold mt-1">{review.title}</h4>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Content */}
      {review.comment && (
        <p className="text-sm">{review.comment}</p>
      )}

      {/* Agency name */}
      {review.agency_name && (
        <p className="text-xs text-muted-foreground">
          — {review.agency_name}
        </p>
      )}

      {/* Author response */}
      {review.response && (
        <div className="bg-muted/50 rounded-lg p-3 mt-2">
          <p className="text-xs font-medium mb-1">Developer Response</p>
          <p className="text-sm">{review.response}</p>
          {review.response_at && (
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(review.response_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onVote(true)}
          disabled={isVoting}
          className="text-muted-foreground hover:text-foreground"
        >
          <ThumbsUp className="h-4 w-4 mr-1" />
          Helpful ({review.helpful_count})
        </Button>
      </div>
    </div>
  );
}
