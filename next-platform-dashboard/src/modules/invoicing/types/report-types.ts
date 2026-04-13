/**
 * Invoicing Module - Report Types
 *
 * Phase INV-01: Database Foundation
 *
 * Types for financial reports and dashboards.
 */

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface ProfitAndLoss {
  period: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  revenueByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

export interface ARAgingReport {
  current: number;
  overdue1to30: number;
  overdue31to60: number;
  overdue61to90: number;
  overdue90Plus: number;
  totalOutstanding: number;
  invoices: ARAgingInvoice[];
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

export interface TaxSummary {
  period: string;
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

export interface ExpenseReport {
  period: string;
  totalExpenses: number;
  byCategory: ExpenseByCategory[];
  byVendor: ExpenseByVendor[];
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

export interface RevenueByPeriod {
  periods: RevenuePeriodEntry[];
  total: number;
  average: number;
}

export interface RevenuePeriodEntry {
  period: string;
  invoiced: number;
  collected: number;
  outstanding: number;
}

export interface CashFlowReport {
  period: string;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
  entries: CashFlowEntry[];
}

export interface CashFlowEntry {
  date: string;
  type: "in" | "out";
  amount: number;
  description: string;
  entityType: string;
  entityId: string;
}

// ============================================================================
// DASHBOARD METRICS
// ============================================================================

export interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalOutstanding: number;
  totalOverdue: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  overdueInvoiceCount: number;
  averagePaymentDays: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowthPercent: number;
}
