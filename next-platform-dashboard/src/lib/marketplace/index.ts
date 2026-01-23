// src/lib/marketplace/index.ts

// Review Service
export {
  createReview,
  updateReview,
  deleteReview,
  getModuleReviews,
  getReviewStats,
  addDeveloperResponse,
  voteReview,
  reportReview,
  getUserReview,
  canReviewModule,
  type Review,
  type ReviewStats,
  type CreateReviewInput,
  type UpdateReviewInput
} from "./review-service";

// Search Service
export {
  searchModules,
  getFeaturedModules,
  getRecommendations,
  getTrendingModules,
  logSearch,
  logModuleView,
  updateViewEngagement,
  getCategories,
  type SearchResult,
  type SearchFilters,
  type SearchResults
} from "./search-service";

// Developer Service
export {
  getDeveloperBySlug,
  getDeveloperByUserId,
  getCurrentDeveloperProfile,
  createDeveloperProfile,
  updateDeveloperProfile,
  getDeveloperModules,
  getDeveloperReviews,
  isSlugAvailable,
  getVerifiedDevelopers,
  getTopDevelopers,
  type DeveloperProfile,
  type CreateDeveloperProfileInput,
  type UpdateDeveloperProfileInput
} from "./developer-service";
