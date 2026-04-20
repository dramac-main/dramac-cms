/**
 * Invoicing Module - Report Types
 *
 * Phase INV-01 + INV-07 + INVFIX-08: Financial reports, dashboards, P&L.
 *
 * Types for financial reports and dashboards.
 * ALL amounts in CENTS (integers).
 *
 * EXPORT PATTERN (INVFIX-08 Gap 7 — standardized):
 * - CSV: All reports use exportReportCSV() server action with escapeCsvCell()/serializeCsv() helpers.
 * - PDF: Browser-native print-to-PDF via window.print(). Each report has a "Print" button
 *   that triggers browser print dialog. CSS `@media print` and `.no-print` class hide
 *   non-printable UI. No server-side PDF generation is needed — this is the platform
 *   standard for all report exports.
 */

// ============================================================================
// DASHBOARD METRICS (INV-07)
// ============================================================================

export interface DashboardMetrics {
  totalRevenue: number;
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  totalExpenses: number;
  netProfit: number;
  invoicesSent: number;
  invoicesPaid: number;
  averagePaymentDays: number;
  collectionRate: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowthPercent: number;
  // Accounts Payable (INV-14)
  totalBillsOutstanding: number;
  totalBillsOverdue: number;
  totalBillsPaidThisPeriod: number;
  activePurchaseOrders: number;
  netCashPosition: number;
}

// ============================================================================
// REVENUE BY PERIOD
// ============================================================================

export interface RevenueByPeriod {
  period: string;
  invoiced: number;
  collected: number;
  expenses: number;
}

// ============================================================================
// CASH FLOW REPORT
// ============================================================================

export interface CashFlowReport {
  periods: CashFlowPeriodEntry[];
  totalIn: number;
  totalOut: number;
  netCashFlow: number;
  /** Running net position per period (cumulative) */
  hasProjectedData: boolean;
}

export interface CashFlowPeriodEntry {
  period: string;
  cashIn: number;
  cashOut: number;
  net: number;
  /** Cumulative net position up to and including this period */
  runningPosition: number;
  /** Breakdown of cash-in sources */
  invoicingIn: number;
  ecommerceIn: number;
  bookingIn: number;
}

// ============================================================================
// PROFIT & LOSS
// ============================================================================

export interface ProfitAndLoss {
  period: { start: string; end: string };
  income: {
    total: number;
    byCategory: { category: string; amount: number }[];
  };
  expenses: {
    total: number;
    byCategory: { category: string; amount: number }[];
  };
  netProfit: number;
  netProfitMargin: number;
  /**
   * Gross margin = income - expenses. For a service-based platform without
   * COGS data, this equals net profit. The assumption is made explicit so
   * consumers know no separate cost-of-goods-sold layer exists.
   */
  grossMargin: number;
  grossMarginPercent: number;
  /** Year-to-date comparison data, if available */
  ytdComparison: {
    previousYearIncome: number;
    previousYearExpenses: number;
    previousYearNetProfit: number;
    incomeGrowthPercent: number;
    expenseGrowthPercent: number;
  } | null;
}

// ============================================================================
// AR AGING REPORT
// ============================================================================

export interface ARAgingReport {
  summary: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
    total: number;
  };
  byClient: ARAgingClientRow[];
  /** Weighted average days sales outstanding across all unpaid invoices */
  weightedDSO: number;
}

export interface ARAgingClientRow {
  clientName: string;
  contactId: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
}

export interface ARAgingInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  contactId: string;
  amountDue: number;
  dueDate: string;
  daysOverdue: number;
  status: string;
}

// ============================================================================
// TAX SUMMARY
// ============================================================================

export interface TaxSummary {
  period: { start: string; end: string };
  taxCollected: number;
  taxPaid: number;
  netTaxOwed: number;
  byRate: TaxSummaryByRate[];
  /** Monthly/quarterly filing period breakdown */
  byFilingPeriod: TaxFilingPeriod[];
}

export interface TaxSummaryByRate {
  taxRateId: string;
  taxRateName: string;
  rate: number;
  collected: number;
  paid: number;
  net: number;
}

export interface TaxFilingPeriod {
  period: string;
  collected: number;
  paid: number;
  net: number;
}

// ============================================================================
// EXPENSE REPORT
// ============================================================================

export interface ExpenseReport {
  period: { start: string; end: string };
  totalExpenses: number;
  byCategory: ExpenseByCategory[];
  byVendor: ExpenseByVendor[];
  byMonth: ExpenseByMonth[];
  /** Top vendors by spend (top 5), for highlighting */
  topVendors: ExpenseByVendor[];
  /** Budget vs actual comparison for categories with budgets */
  budgetComparison: ExpenseBudgetComparison[];
  /** Year-over-year comparison, if previous year data exists */
  yoyComparison: {
    previousYearTotal: number;
    changePercent: number;
    previousByMonth: { month: string; amount: number }[];
  } | null;
}

export interface ExpenseBudgetComparison {
  categoryId: string;
  categoryName: string;
  monthlyBudget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}

export interface ExpenseByCategory {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface ExpenseByVendor {
  vendorId: string;
  vendorName: string;
  amount: number;
  count: number;
}

export interface ExpenseByMonth {
  month: string;
  amount: number;
  count: number;
}

// ============================================================================
// TOP CLIENTS
// ============================================================================

export interface TopClient {
  contactId: string;
  clientName: string;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  invoiceCount: number;
}

// ============================================================================
// CHART DATA TYPES
// ============================================================================

export interface InvoiceStatusDistribution {
  status: string;
  label: string;
  count: number;
  amount: number;
  color: string;
}

export interface PaymentMethodDistribution {
  method: string;
  label: string;
  amount: number;
  count: number;
  color: string;
}

// ============================================================================
// DATE RANGE FILTER
// ============================================================================

export type DateRangePreset =
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year"
  | "last_year"
  | "custom";

export interface DateRange {
  start: string;
  end: string;
  preset: DateRangePreset;
}

// ============================================================================
// CROSS-MODULE REPORTS (INVFIX-08)
// ============================================================================

/** Revenue comparison with growth indicators */
export interface RevenueTrendsPeriodEntry {
  period: string;
  amount: number;
}

export interface RevenueTrendsComparison {
  currentTotal: number;
  previousTotal: number;
  growthPercent: number;
  currentByPeriod: RevenueTrendsPeriodEntry[];
  previousByPeriod: RevenueTrendsPeriodEntry[];
  /** Top 10 clients vs other segmentation */
  clientSegments: {
    top10Revenue: number;
    top10Count: number;
    otherRevenue: number;
    otherCount: number;
  };
}

/** Revenue broken down by source module */
export interface RevenueBySource {
  source: "invoicing" | "ecommerce" | "booking";
  label: string;
  amount: number;
  count: number;
  color: string;
}

/** Cross-module revenue report with per-period breakdown */
export interface CrossModuleRevenue {
  period: { start: string; end: string };
  totalRevenue: number;
  bySource: RevenueBySource[];
  byPeriod: CrossModulePeriodEntry[];
}

export interface CrossModulePeriodEntry {
  period: string;
  invoicing: number;
  ecommerce: number;
  booking: number;
  total: number;
}

/** Cross-module client activity report */
export interface CrossModuleClientReport {
  clients: CrossModuleClientRow[];
  totalClients: number;
  totalRevenue: number;
}

export interface CrossModuleClientRow {
  clientName: string;
  clientEmail: string;
  invoicingRevenue: number;
  ecommerceRevenue: number;
  bookingRevenue: number;
  totalRevenue: number;
  invoiceCount: number;
  orderCount: number;
  bookingCount: number;
  lastActivity: string;
}

// ============================================================================
// DEPRECATED (kept for backward compatibility)
// ============================================================================

export interface CashFlowEntry {
  date: string;
  type: "in" | "out";
  amount: number;
  description: string;
  entityType: string;
  entityId: string;
}

export interface RevenuePeriodEntry {
  period: string;
  invoiced: number;
  collected: number;
  outstanding: number;
}
