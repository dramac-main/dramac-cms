/**
 * Invoicing Module - Report Types
 *
 * Phase INV-01 + INV-07: Financial reports, dashboards, P&L.
 *
 * Types for financial reports and dashboards.
 * ALL amounts in CENTS (integers).
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
}

export interface CashFlowPeriodEntry {
  period: string;
  cashIn: number;
  cashOut: number;
  net: number;
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
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  amountDue: number;
  dueDate: string;
  daysOverdue: number;
  bucket: "current" | "1-30" | "31-60" | "61-90" | "90+";
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
}

export interface TaxSummaryByRate {
  taxRateId: string;
  taxRateName: string;
  rate: number;
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
