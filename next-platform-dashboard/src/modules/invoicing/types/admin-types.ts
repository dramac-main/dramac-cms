/**
 * Invoicing Module — Admin Types (INV-12)
 *
 * Types for super admin platform-level invoicing management.
 * All monetary amounts in CENTS (integers).
 */

// ─── Platform Stats ────────────────────────────────────────────

export interface PlatformInvoicingStats {
  totalSitesUsingInvoicing: number;
  totalInvoicesCreated: number;
  totalRevenueProcessed: number; // CENTS
  averageInvoicesPerSite: number;
  invoicesByStatus: Record<string, number>;
  topSitesByRevenue: {
    siteName: string;
    agencyName: string;
    revenue: number; // CENTS
  }[];
  monthlyGrowthRate: number; // percentage
}

// ─── Site Overview ─────────────────────────────────────────────

export interface SiteInvoicingOverview {
  siteId: string;
  siteName: string;
  agencyName: string;
  invoiceCount: number;
  totalRevenue: number; // CENTS
  totalOutstanding: number; // CENTS
  statusDistribution: Record<string, number>;
  lastInvoiceDate: string | null;
  isActive: boolean;
}

// ─── Usage Trends ──────────────────────────────────────────────

export interface UsageTrend {
  period: string; // e.g. "2026-01", "2026-W03"
  invoicesCreated: number;
  revenueProcessed: number; // CENTS
  paymentsReceived: number; // CENTS
  activeSites: number;
}

// ─── Feature Flags ─────────────────────────────────────────────

export interface InvoicingFeatureFlag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  category: "core" | "ai" | "integrations" | "advanced";
}

// ─── Global Defaults ───────────────────────────────────────────

export interface GlobalInvoicingDefaults {
  defaultCurrency: string;
  defaultTaxRate: number; // percentage, e.g. 16
  defaultPaymentTermsDays: number;
  defaultLateFeeEnabled: boolean;
  defaultLateFeeType: "percentage" | "fixed";
  defaultLateFeeAmount: number; // CENTS or percentage
  defaultLateFeeGraceDays: number;
}
