/**
 * PHASE AWD-04: Component Selection Intelligence
 * Public API Exports
 */

// Types
export type {
  IndustryTemplate,
  PageRecommendation,
  ComponentPreference,
  ComponentScore,
  ScoringContext,
  RecommendedPage,
  RecommendedSection,
  PagePlanRecommendation,
  DataAvailabilityFlags,
} from "./types";

// Industry Templates
export {
  INDUSTRY_TEMPLATES,
  getIndustryTemplate,
  inferIndustry,
  getAllIndustries,
} from "./industry-templates";

// Component Scoring
export {
  scoreComponent,
  rankComponentsForSection,
  selectBestComponent,
  buildDataAvailabilityFlags,
} from "./component-scorer";

// Page Planning
export {
  generatePagePlan,
  DEFAULT_PAGE_SECTIONS,
} from "./page-planner";
