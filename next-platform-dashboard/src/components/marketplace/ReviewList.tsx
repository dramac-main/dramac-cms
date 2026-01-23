// src/components/marketplace/ReviewList.tsx

"use client";

import { useState } from "react";
import {
  Star,
  ThumbsUp,
  MessageCircle,
  Flag,
  ChevronDown,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  pros: string[];
  cons: string[];
  developer_response: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  user?: {
    name?: string;
    avatar_url?: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

interface ReviewListProps {
  moduleId: string;
  reviews: Review[];
  stats: ReviewStats;
  onVote?: (reviewId: string, voteType: "helpful" | "not_helpful") => void;
  onSort?: (sortBy: string) => void;
  onFilter?: (rating: number | null) => void;
  onReport?: (reviewId: string) => void;
  isLoading?: boolean;
}

function renderStars(rating: number) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewList({
  moduleId,
  reviews,
  stats,
  onVote,
  onSort,
  onFilter,
  onReport,
  isLoading,
}: ReviewListProps) {
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const maxCount = Math.max(
    ...Object.values(stats.distribution),
    1 // Prevent division by zero
  );

  const handleFilterClick = (rating: number) => {
    const newFilter = filterRating === rating ? null : rating;
    setFilterRating(newFilter);
    onFilter?.(newFilter);
  };

  if (isLoading) {
    return <ReviewListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Average Rating */}
            <div className="text-center shrink-0">
              <div className="text-5xl font-bold">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="mt-2">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"}
              </div>
            </div>

            {/* Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleFilterClick(rating)}
                  className={`w-full flex items-center gap-2 hover:bg-muted p-1 rounded transition-colors ${
                    filterRating === rating ? "bg-muted" : ""
                  }`}
                >
                  <span className="w-3 text-sm">{rating}</span>
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <Progress
                    value={
                      maxCount > 0
                        ? (stats.distribution[rating] / maxCount) * 100
                        : 0
                    }
                    className="h-2 flex-1"
                  />
                  <span className="w-8 text-sm text-muted-foreground text-right">
                    {stats.distribution[rating] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Select defaultValue="newest" onValueChange={onSort}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
            <SelectItem value="helpful">Most Helpful</SelectItem>
          </SelectContent>
        </Select>

        {filterRating && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterRating(null);
              onFilter?.(null);
            }}
          >
            Clear filter
          </Button>
        )}
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
              <p className="text-muted-foreground">
                Be the first to review this module
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onVote={onVote}
              onReport={onReport}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  onVote?: (reviewId: string, voteType: "helpful" | "not_helpful") => void;
  onReport?: (reviewId: string) => void;
}

function ReviewCard({ review, onVote, onReport }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {review.user?.avatar_url ? (
              <img
                src={review.user.avatar_url}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {review.user?.name || "Anonymous"}
              </span>
              {review.is_verified_purchase && (
                <Badge variant="outline" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {renderStars(review.rating)}
              <span className="text-sm text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        {review.title && <h4 className="font-medium mb-2">{review.title}</h4>}

        {review.content && (
          <p className="text-sm mb-3 whitespace-pre-wrap">{review.content}</p>
        )}

        {/* Pros/Cons */}
        {(review.pros?.length > 0 || review.cons?.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 text-sm">
            {review.pros?.length > 0 && (
              <div>
                <div className="font-medium text-green-600 mb-1">Pros</div>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {review.pros.map((pro, i) => (
                    <li key={i}>{pro}</li>
                  ))}
                </ul>
              </div>
            )}
            {review.cons?.length > 0 && (
              <div>
                <div className="font-medium text-red-600 mb-1">Cons</div>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {review.cons.map((con, i) => (
                    <li key={i}>{con}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Developer Response */}
        {review.developer_response && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:underline">
              <MessageCircle className="h-4 w-4" />
              Developer Response
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-sm">{review.developer_response}</p>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote?.(review.id, "helpful")}
            className="text-muted-foreground"
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Helpful ({review.helpful_count || 0})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReport?.(review.id)}
            className="text-muted-foreground"
          >
            <Flag className="h-4 w-4 mr-1" />
            Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for loading state
function ReviewListSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-8">
            <div className="text-center">
              <div className="h-12 w-12 bg-muted rounded animate-pulse mx-auto" />
              <div className="h-4 w-20 bg-muted rounded animate-pulse mt-2" />
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { ReviewCard, ReviewListSkeleton };
