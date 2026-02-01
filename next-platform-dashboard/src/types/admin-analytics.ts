/**
 * Admin Analytics Types
 * 
 * PHASE-DS-04A: Admin Dashboard - Platform Overview
 * PHASE-DS-04B: Admin Dashboard - Agency Metrics
 * PHASE-DS-05: Billing & Revenue Dashboards
 * 
 * Type definitions for platform-wide analytics, agency metrics, and billing dashboards.
 */

// ============================================================================
// Time & Filtering Types
// ============================================================================

export type AdminTimeRange = '24h' | '7d' | '30d' | '90d' | '12m' | '1y' | 'all' | 'custom';

export interface AdminDateRange {
  start: Date;
  end: Date;
}

export interface AdminFilters {
  timeRange: AdminTimeRange;
  customRange?: AdminDateRange;
  agencyId?: string;
  plan?: string;
  status?: string;
}

// ============================================================================
// Platform Overview Types (PHASE-DS-04A)
// ============================================================================

export interface PlatformOverviewMetrics {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    growthPercent: number;
    byRole: {
      superAdmin: number;
      admin: number;
      member: number;
    };
  };
  agencies: {
    total: number;
    active: number;
    trial: number;
    churned: number;
    newThisMonth: number;
    growthPercent: number;
    byPlan: {
      free: number;
      starter: number;
      professional: number;
      enterprise: number;
    };
  };
  sites: {
    total: number;
    published: number;
    draft: number;
    publishedPercent: number;
    totalPages: number;
    avgPagesPerSite: number;
    newThisMonth: number;
  };
  modules: {
    totalAvailable: number;
    totalInstallations: number;
    avgPerAgency: number;
    topModules: ModuleStats[];
  };
}

export interface ModuleStats {
  id: string;
  name: string;
  slug: string;
  installations: number;
  activeUsage: number;
  revenue?: number;
}

export interface SystemHealthMetrics {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number; // percentage
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
  };
  errorRate: number; // percentage
  activeSessions: number;
  requestsPerMinute: number;
  databaseStatus: 'connected' | 'slow' | 'error';
  storageUsed: number; // bytes
  storageLimit: number; // bytes
  apiCalls: {
    today: number;
    thisMonth: number;
    limit: number;
  };
  services: ServiceStatus[];
}

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  latency?: number;
  lastChecked: string;
}

export interface PlatformTrendData {
  label: string;
  date: string;
  users: number;
  agencies: number;
  sites: number;
  revenue: number;
  pageViews?: number;
}

export interface PlatformActivityItem {
  id: string;
  type: 'signup' | 'subscription' | 'publish' | 'module_install' | 'payment' | 'cancellation' | 'upgrade' | 'error';
  title: string;
  description?: string;
  timestamp: string;
  metadata?: {
    agencyId?: string;
    agencyName?: string;
    userId?: string;
    userName?: string;
    amount?: number;
    plan?: string;
    module?: string;
    siteId?: string;
    siteName?: string;
  };
}

// ============================================================================
// Agency Metrics Types (PHASE-DS-04B)
// ============================================================================

export interface AgencyMetrics {
  id: string;
  name: string;
  plan: string;
  status: 'active' | 'trial' | 'churned' | 'suspended';
  createdAt: string;
  metrics: {
    sites: number;
    publishedSites: number;
    totalPages: number;
    teamMembers: number;
    clients: number;
    modulesInstalled: number;
    storageUsed: number;
  };
  billing: {
    mrr: number;
    totalRevenue: number;
    lastPayment?: string;
    nextBilling?: string;
    paymentStatus: 'current' | 'overdue' | 'failed';
  };
  engagement: {
    lastActive: string;
    loginCount30d: number;
    pagesCreated30d: number;
    postsPublished30d: number;
  };
  health: {
    score: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

export interface AgencyLeaderboard {
  topByRevenue: AgencyRankItem[];
  topBySites: AgencyRankItem[];
  topByEngagement: AgencyRankItem[];
  atRisk: AgencyRankItem[];
  newlyOnboarded: AgencyRankItem[];
}

export interface AgencyRankItem {
  id: string;
  name: string;
  plan: string;
  value: number;
  valueLabel: string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface AgencyGrowthData {
  period: string;
  newAgencies: number;
  churnedAgencies: number;
  netGrowth: number;
  conversionRate: number;
  avgLifetimeValue: number;
}

export interface AgencySegmentation {
  byPlan: {
    plan: string;
    count: number;
    revenue: number;
    avgMrr: number;
    percentage: number;
  }[];
  bySize: {
    segment: 'small' | 'medium' | 'large' | 'enterprise';
    size: string;
    count: number;
    criteria: string;
    percentage: number;
  }[];
  byIndustry: {
    industry: string;
    count: number;
    percentage: number;
  }[];
  byRegion: {
    region: string;
    count: number;
    percentage: number;
  }[];
}

// ============================================================================
// Billing & Revenue Types (PHASE-DS-05)
// ============================================================================

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  mrrGrowth: number;
  arrGrowth: number;
  revenueToday: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  projectedMonthEnd: number;
  totalRevenue: number;
  revenueGrowth: number;
  avgRevenuePerAccount: number;
  arpaGrowth: number;
}

export interface SubscriptionMetrics {
  total: number;
  active: number;
  trial: number;
  cancelled: number;
  pastDue: number;
  churnRate: number;
  churnedThisMonth: number;
  newThisMonth: number;
  netGrowth: number;
  conversionRate: number;
  trialToPayRate: number;
  // Additional fields used by components
  totalActive: number;
  activeGrowth: number;
  newThisPeriod: number;
  churnedThisPeriod: number;
  trialActive: number;
  trialConversionRate: number;
  avgSubscriptionValue: number;
}

export interface RevenueByPlan {
  plan: string;
  planName: string;
  subscribers: number;
  mrr: number;
  percentage: number;
  avgRevenuePerUser: number;
  churnRate: number;
  // Additional fields used by components
  revenue: number;
  count: number;
}

export interface RevenueByModule {
  moduleId: string;
  moduleName: string;
  subscribers: number;
  mrr: number;
  percentage: number;
  growth: number;
}

export interface RevenueTrendData {
  date: string;
  mrr: number;
  arr: number;
  newMrr: number;
  churnedMrr: number;
  expansionMrr: number;
  subscriptions: number;
  trials: number;
}

export interface PaymentMetrics {
  totalProcessed: number;
  successRate: number;
  failedPayments: number;
  pendingPayments: number;
  refunds: number;
  refundRate: number;
  avgTransactionValue: number;
  paymentMethods: {
    method: string;
    count: number;
    percentage: number;
  }[];
  // Additional fields used by components
  successfulPayments: number;
  failureRate: number;
  refundedAmount: number;
}

export interface CustomerMetrics {
  ltv: number; // Lifetime Value
  arpu: number; // Average Revenue Per User
  cac: number; // Customer Acquisition Cost (estimated)
  ltvCacRatio: number;
  paybackPeriod: number; // months
  avgSubscriptionLength: number; // months
  expansionRevenue: number;
  contractionRevenue: number;
  // Additional fields for dashboard components
  healthy: number;
  atRisk: number;
  churning: number;
  avgCustomerAge: number;
  npsScore: number;
}

export interface BillingActivityItem {
  id: string;
  type: 'payment' | 'subscription' | 'refund' | 'failed' | 'upgrade' | 'downgrade' | 'cancellation' | 'invoice';
  agencyId: string;
  agencyName: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded' | 'success';
  plan?: string;
  previousPlan?: string;
  timestamp: string;
  description?: string;
}

export interface InvoiceMetrics {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  avgDaysToPayment: number;
  // Additional fields for dashboard components
  paid: number;
  pending: number;
  overdue: number;
  draft: number;
  avgInvoiceAmount: number;
}

// ============================================================================
// Dashboard Configuration Types
// ============================================================================

export interface AdminDashboardConfig {
  id: string;
  name: string;
  refreshInterval?: number;
  defaultTimeRange: AdminTimeRange;
  widgets: AdminDashboardWidget[];
  layout: {
    columns: number;
    rows?: number;
  };
}

export interface AdminDashboardWidget {
  id: string;
  type: 'stat' | 'chart' | 'table' | 'list' | 'gauge' | 'map';
  title: string;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position: { row: number; col: number; colSpan?: number };
  dataKey: string;
  config?: Record<string, unknown>;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AdminAnalyticsResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    timeRange: AdminTimeRange;
    generatedAt: string;
    cached?: boolean;
  };
}

export type PlatformOverviewResponse = AdminAnalyticsResponse<PlatformOverviewMetrics>;
export type SystemHealthResponse = AdminAnalyticsResponse<SystemHealthMetrics>;
export type AgencyMetricsResponse = AdminAnalyticsResponse<AgencyMetrics[]>;
export type RevenueMetricsResponse = AdminAnalyticsResponse<RevenueMetrics>;
