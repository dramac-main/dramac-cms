// src/lib/marketplace/review-service.ts
// Phase EM-42: Module Marketplace 2.0 - Review Service

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Use 'any' type for Supabase client to handle dynamic tables
// The module_reviews table will have additional columns after migration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export interface Review {
  id: string;
  module_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  pros: string[];
  cons: string[];
  developer_response: string | null;
  developer_responded_at: string | null;
  is_verified_purchase: boolean;
  status: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      name?: string;
      avatar_url?: string;
    };
  };
  agency?: {
    name: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CreateReviewInput {
  rating: number;
  title?: string;
  content?: string;
  pros?: string[];
  cons?: string[];
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  content?: string;
  pros?: string[];
  cons?: string[];
}

/**
 * Create a new review for a module
 */
export async function createReview(
  moduleId: string,
  review: CreateReviewInput
): Promise<Review> {
  const supabase = await createClient() as AnySupabase;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  // Check if user has installed the module (verified purchase)
  const { data: installation } = await supabase
    .from("site_modules")
    .select("id")
    .eq("module_id", moduleId)
    .single();

  const isVerifiedPurchase = !!installation;

  // Check for existing review
  const { data: existing } = await supabase
    .from("module_reviews")
    .select("id")
    .eq("module_id", moduleId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    throw new Error("You have already reviewed this module");
  }

  // Get user's agency if any
  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .single();

  // Create the review
  const { data, error } = await supabase
    .from("module_reviews")
    .insert({
      module_id: moduleId,
      user_id: user.id,
      agency_id: membership?.agency_id || null,
      rating: review.rating,
      title: review.title || null,
      content: review.content || null,
      pros: review.pros || [],
      cons: review.cons || [],
      is_verified_purchase: isVerifiedPurchase,
      status: "published"
    })
    .select("*")
    .single();

  if (error) {
    console.error("[ReviewService] Error creating review:", error);
    throw new Error("Failed to create review");
  }

  return data as Review;
}

/**
 * Update an existing review
 */
export async function updateReview(
  reviewId: string,
  updates: UpdateReviewInput
): Promise<Review> {
  const supabase = await createClient() as AnySupabase;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("module_reviews")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    console.error("[ReviewService] Error updating review:", error);
    throw new Error("Failed to update review");
  }

  return data as Review;
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string): Promise<void> {
  const supabase = await createClient() as AnySupabase;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  const { error } = await supabase
    .from("module_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[ReviewService] Error deleting review:", error);
    throw new Error("Failed to delete review");
  }
}

/**
 * Get reviews for a module
 */
export async function getModuleReviews(
  moduleId: string,
  options: {
    page?: number;
    limit?: number;
    sortBy?: "newest" | "oldest" | "highest" | "lowest" | "helpful";
    filterRating?: number;
  } = {}
): Promise<{ reviews: Review[]; total: number }> {
  const supabase = await createClient() as AnySupabase;
  
  const page = options.page || 1;
  const limit = options.limit || 10;
  const from = (page - 1) * limit;

  let query = supabase
    .from("module_reviews")
    .select("*", { count: "exact" })
    .eq("module_id", moduleId)
    .eq("status", "published");

  // Filter by rating
  if (options.filterRating) {
    query = query.eq("rating", options.filterRating);
  }

  // Sorting
  switch (options.sortBy) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "highest":
      query = query.order("rating", { ascending: false });
      break;
    case "lowest":
      query = query.order("rating", { ascending: true });
      break;
    case "helpful":
      query = query.order("helpful_count", { ascending: false });
      break;
    default: // newest
      query = query.order("created_at", { ascending: false });
  }

  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("[ReviewService] Error fetching reviews:", error);
    throw new Error("Failed to fetch reviews");
  }

  return {
    reviews: (data || []) as Review[],
    total: count || 0
  };
}

/**
 * Get review statistics for a module
 */
export async function getReviewStats(moduleId: string): Promise<ReviewStats> {
  const supabase = await createClient() as AnySupabase;

  const { data, error } = await supabase
    .from("module_reviews")
    .select("rating")
    .eq("module_id", moduleId)
    .eq("status", "published");

  if (error) {
    console.error("[ReviewService] Error fetching review stats:", error);
    throw new Error("Failed to fetch review stats");
  }

  const reviews = (data || []) as Array<{ rating: number }>;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach((r) => {
    const rating = r.rating as 1 | 2 | 3 | 4 | 5;
    distribution[rating]++;
  });

  const total = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);

  return {
    averageRating: total > 0 ? sum / total : 0,
    totalReviews: total,
    distribution
  };
}

/**
 * Add developer response to a review
 */
export async function addDeveloperResponse(
  reviewId: string,
  response: string
): Promise<void> {
  const supabase = await createClient() as AnySupabase;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  // Get the review and verify the user is the module developer
  const { data: review, error: reviewError } = await supabase
    .from("module_reviews")
    .select(`
      id,
      module_id
    `)
    .eq("id", reviewId)
    .single();

  if (reviewError || !review) {
    throw new Error("Review not found");
  }

  // Get the module and check if user is the creator
  const { data: module, error: moduleError } = await supabase
    .from("modules_v2")
    .select("created_by")
    .eq("id", review.module_id)
    .single();

  if (moduleError || !module) {
    throw new Error("Module not found");
  }

  if (module.created_by !== user.id) {
    throw new Error("Not authorized to respond to this review");
  }

  const { error } = await supabase
    .from("module_reviews")
    .update({
      developer_response: response,
      developer_responded_at: new Date().toISOString()
    })
    .eq("id", reviewId);

  if (error) {
    console.error("[ReviewService] Error adding developer response:", error);
    throw new Error("Failed to add developer response");
  }
}

/**
 * Vote on review helpfulness
 */
export async function voteReview(
  reviewId: string,
  voteType: "helpful" | "not_helpful"
): Promise<void> {
  const supabase = await createClient() as AnySupabase;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  // Check for existing vote
  const { data: existing } = await supabase
    .from("review_votes")
    .select("id, vote_type")
    .eq("review_id", reviewId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    if (existing.vote_type === voteType) {
      // Remove vote (toggle off)
      await supabase
        .from("review_votes")
        .delete()
        .eq("id", existing.id);
    } else {
      // Update vote
      await supabase
        .from("review_votes")
        .update({ vote_type: voteType })
        .eq("id", existing.id);
    }
  } else {
    // New vote
    const { error } = await supabase
      .from("review_votes")
      .insert({
        review_id: reviewId,
        user_id: user.id,
        vote_type: voteType
      });

    if (error) {
      console.error("[ReviewService] Error voting:", error);
      throw new Error("Failed to vote");
    }
  }
}

/**
 * Report a review for moderation
 */
export async function reportReview(
  reviewId: string,
  reason: string,
  details?: string
): Promise<void> {
  const supabase = await createClient() as AnySupabase;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  // Log the report for moderation
  const { error } = await supabase
    .from("moderation_reports")
    .insert({
      type: "review",
      target_id: reviewId,
      reported_by: user.id,
      reason,
      details
    });

  if (error) {
    console.error("[ReviewService] Error creating moderation report:", error);
    throw new Error("Failed to report review");
  }
}

/**
 * Get user's review for a module (if exists)
 */
export async function getUserReview(moduleId: string): Promise<Review | null> {
  const supabase = await createClient() as AnySupabase;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("module_reviews")
    .select("*")
    .eq("module_id", moduleId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    // Not found is expected
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("[ReviewService] Error fetching user review:", error);
    return null;
  }

  return data as Review;
}

/**
 * Check if user can review a module
 */
export async function canReviewModule(moduleId: string): Promise<{
  canReview: boolean;
  hasExistingReview: boolean;
  isVerifiedPurchase: boolean;
}> {
  const supabase = await createClient() as AnySupabase;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      canReview: false,
      hasExistingReview: false,
      isVerifiedPurchase: false
    };
  }

  // Check for existing review
  const { data: existing } = await supabase
    .from("module_reviews")
    .select("id")
    .eq("module_id", moduleId)
    .eq("user_id", user.id)
    .single();

  // Check for installation (verified purchase)
  const { data: installation } = await supabase
    .from("site_modules")
    .select("id")
    .eq("module_id", moduleId)
    .single();

  return {
    canReview: !existing,
    hasExistingReview: !!existing,
    isVerifiedPurchase: !!installation
  };
}
