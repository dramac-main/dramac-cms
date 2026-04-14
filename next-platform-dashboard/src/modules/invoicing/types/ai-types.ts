/**
 * Invoicing Module - AI Types
 *
 * Phase INV-11: AI Financial Intelligence & Insights
 *
 * Types for cash flow forecasting, client risk scoring,
 * payment predictions, and AI-powered financial insights.
 */

// ============================================================================
// CASH FLOW FORECAST
// ============================================================================

export interface CashFlowForecastMonth {
  month: string; // "2026-03"
  predictedIncome: number; // in CENTS
  predictedExpenses: number; // in CENTS
  predictedNetCash: number; // in CENTS
  confidence: number; // 0-1
  factors: string[];
}

export interface CashFlowForecast {
  months: CashFlowForecastMonth[];
  summary: string;
  alerts: string[];
  generatedAt: string;
  cachedUntil: string;
}

// ============================================================================
// CLIENT RISK SCORE
// ============================================================================

export interface ClientRiskFactors {
  averageDaysToPay: number;
  onTimePaymentRate: number; // percentage 0-100
  totalInvoiced: number; // in CENTS
  totalOverdue: number; // in CENTS
  overdueCount: number;
  longestOverdueDays: number;
}

export interface ClientRiskScore {
  contactId: string;
  clientName: string;
  riskRating: "low" | "medium" | "high";
  score: number; // 0-100 (100 = highest risk)
  factors: ClientRiskFactors;
  recommendation: string;
  generatedAt: string;
  cachedUntil: string;
}

// ============================================================================
// PAYMENT PREDICTION
// ============================================================================

export interface PaymentPrediction {
  invoiceId: string;
  invoiceNumber: string;
  predictedPayDate: string;
  confidencePercent: number;
  reasoning: string;
  riskOfLate: "low" | "medium" | "high";
}

// ============================================================================
// INVOICE OPTIMIZATIONS
// ============================================================================

export interface Optimization {
  id: string;
  type: "payment_terms" | "early_discount" | "follow_up" | "pricing" | "timing" | "general";
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  actionLabel: string | null;
  actionData: Record<string, unknown> | null;
}

// ============================================================================
// EXPENSE CATEGORIZATION
// ============================================================================

export interface ExpenseCategorization {
  categoryId: string | null;
  categoryName: string;
  confidence: number; // 0-1
  alternativeCategories: { categoryId: string | null; categoryName: string; confidence: number }[];
}

// ============================================================================
// FINANCIAL Q&A
// ============================================================================

export interface FinancialAnswer {
  answer: string;
  data?: {
    type: "chart" | "table" | "metric";
    chartType?: "line" | "bar" | "pie";
    labels?: string[];
    values?: number[];
    rows?: Record<string, unknown>[];
  };
}

// ============================================================================
// AI INSIGHTS (DASHBOARD WIDGET)
// ============================================================================

export interface AiInsight {
  id: string;
  type: "alert" | "suggestion" | "info";
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  actionLabel: string | null;
  actionHref: string | null;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export interface AiUsageStatus {
  queriesUsed: number;
  queriesLimit: number;
  queriesRemaining: number;
  resetsAt: string;
}
