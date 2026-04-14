"use server";

/**
 * Invoicing Module - AI Actions
 *
 * Phase INV-11: AI Financial Intelligence & Insights
 *
 * 8 server actions for AI-powered financial intelligence:
 * - Cash flow forecasting (Sonnet)
 * - Payment prediction (Sonnet)
 * - Client risk scoring (Sonnet)
 * - Invoice optimization suggestions (Sonnet)
 * - Expense auto-categorization (Haiku)
 * - Financial natural language Q&A (Sonnet)
 * - Invoice description generation (Haiku)
 * - Financial summary generation (Sonnet)
 *
 * Rate limited: 50 queries/day/site.
 * Caching: forecasts 24h, risk scores 1h.
 * All amounts in CENTS (integers).
 */

import { createClient } from "@/lib/supabase/server";
import { anthropic, AI_MODELS } from "@/lib/ai/config";
import { INV_TABLES } from "../lib/invoicing-constants";
import type {
  CashFlowForecast,
  CashFlowForecastMonth,
  PaymentPrediction,
  ClientRiskScore,
  ClientRiskFactors,
  Optimization,
  ExpenseCategorization,
  FinancialAnswer,
  AiInsight,
  AiUsageStatus,
} from "../types/ai-types";

// ============================================================================
// CONSTANTS
// ============================================================================

const AI_DAILY_LIMIT = 50;
const FORECAST_CACHE_HOURS = 24;
const RISK_SCORE_CACHE_HOURS = 1;

// ============================================================================
// HELPERS
// ============================================================================

async function getModuleClient() {
  return (await createClient()) as any;
}

/**
 * Simple in-memory cache with TTL (per server instance).
 * Falls back gracefully — no external cache dependency.
 */
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttlHours: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlHours * 60 * 60 * 1000,
  });
}

/**
 * Check and increment AI usage for a site (daily limit).
 * Uses invoicing metadata table via a simple counter pattern.
 */
async function checkAiUsage(
  siteId: string,
): Promise<{ allowed: boolean; usage: AiUsageStatus }> {
  const supabase = await getModuleClient();
  const todayKey = new Date().toISOString().split("T")[0];
  const cacheKey = `ai_usage_${siteId}_${todayKey}`;

  // Check cache first
  const cached = getCached<number>(cacheKey);
  const currentCount = cached ?? 0;

  if (currentCount >= AI_DAILY_LIMIT) {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return {
      allowed: false,
      usage: {
        queriesUsed: currentCount,
        queriesLimit: AI_DAILY_LIMIT,
        queriesRemaining: 0,
        resetsAt: tomorrow.toISOString(),
      },
    };
  }

  // Track usage in settings metadata
  try {
    const { data: settings } = await supabase
      .from(INV_TABLES.settings)
      .select("metadata")
      .eq("site_id", siteId)
      .single();

    const metadata = (settings?.metadata as Record<string, unknown>) || {};
    const aiUsage = (metadata.ai_usage as Record<string, number>) || {};
    const todayCount = aiUsage[todayKey] || 0;

    if (todayCount >= AI_DAILY_LIMIT) {
      setCache(cacheKey, todayCount, 1);
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      return {
        allowed: false,
        usage: {
          queriesUsed: todayCount,
          queriesLimit: AI_DAILY_LIMIT,
          queriesRemaining: 0,
          resetsAt: tomorrow.toISOString(),
        },
      };
    }

    // Increment
    const newCount = todayCount + 1;
    const updatedUsage = { ...aiUsage, [todayKey]: newCount };
    // Keep only last 7 days
    const keys = Object.keys(updatedUsage).sort().slice(-7);
    const trimmed: Record<string, number> = {};
    for (const k of keys) trimmed[k] = updatedUsage[k];

    await supabase
      .from(INV_TABLES.settings)
      .update({ metadata: { ...metadata, ai_usage: trimmed } })
      .eq("site_id", siteId);

    setCache(cacheKey, newCount, 1);

    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    return {
      allowed: true,
      usage: {
        queriesUsed: newCount,
        queriesLimit: AI_DAILY_LIMIT,
        queriesRemaining: AI_DAILY_LIMIT - newCount,
        resetsAt: tomorrow.toISOString(),
      },
    };
  } catch {
    // Fail open
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return {
      allowed: true,
      usage: {
        queriesUsed: 0,
        queriesLimit: AI_DAILY_LIMIT,
        queriesRemaining: AI_DAILY_LIMIT,
        resetsAt: tomorrow.toISOString(),
      },
    };
  }
}

/**
 * Call Claude with structured JSON output.
 */
async function callClaude<T>(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4096,
): Promise<T> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response (handles markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    text.match(/(\{[\s\S]*\})/) ||
    text.match(/(\[[\s\S]*\])/);

  if (!jsonMatch) {
    throw new Error("AI response did not contain valid JSON");
  }

  return JSON.parse(jsonMatch[1].trim()) as T;
}

/**
 * Call Claude for plain text response.
 */
async function callClaudeText(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2048,
): Promise<string> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature: 0.5,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

// ============================================================================
// DATA LOADERS
// ============================================================================

async function loadInvoiceHistory(siteId: string, monthsBack = 12) {
  const supabase = await getModuleClient();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);

  const { data: invoices } = await supabase
    .from(INV_TABLES.invoices)
    .select(
      "id, invoice_number, status, contact_id, client_name, client_email, currency, issue_date, due_date, paid_date, total, amount_paid, amount_due, late_fee_amount, late_fee_applied_at, reminder_count, source_type",
    )
    .eq("site_id", siteId)
    .gte("issue_date", cutoff.toISOString())
    .order("issue_date", { ascending: false })
    .limit(500);

  return invoices || [];
}

async function loadPaymentHistory(siteId: string, monthsBack = 12) {
  const supabase = await getModuleClient();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);

  const { data: payments } = await supabase
    .from(INV_TABLES.payments)
    .select("id, invoice_id, amount, payment_date, payment_method, status, type")
    .eq("site_id", siteId)
    .eq("type", "payment")
    .eq("status", "completed")
    .gte("payment_date", cutoff.toISOString())
    .order("payment_date", { ascending: false })
    .limit(500);

  return payments || [];
}

async function loadRecurringSchedules(siteId: string) {
  const supabase = await getModuleClient();

  const { data: recurring } = await supabase
    .from(INV_TABLES.recurringInvoices)
    .select("id, contact_id, client_name, frequency, amount, next_run_date, status")
    .eq("site_id", siteId)
    .eq("status", "active")
    .limit(100);

  return recurring || [];
}

async function loadExpenses(siteId: string, monthsBack = 12) {
  const supabase = await getModuleClient();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);

  const { data: expenses } = await supabase
    .from(INV_TABLES.expenses)
    .select("id, amount, category_id, expense_date, description, vendor_id, status")
    .eq("site_id", siteId)
    .in("status", ["approved", "paid"])
    .gte("expense_date", cutoff.toISOString())
    .limit(500);

  return expenses || [];
}

async function loadExpenseCategories(siteId: string) {
  const supabase = await getModuleClient();

  const { data: categories } = await supabase
    .from("mod_invmod01_expense_categories")
    .select("id, name, description")
    .eq("site_id", siteId)
    .eq("is_active", true)
    .order("sort_order");

  return categories || [];
}

async function loadSettings(siteId: string) {
  const supabase = await getModuleClient();

  const { data } = await supabase
    .from(INV_TABLES.settings)
    .select("default_currency, company_name, timezone")
    .eq("site_id", siteId)
    .single();

  return data || { default_currency: "ZMW", company_name: null, timezone: "Africa/Lusaka" };
}

// ============================================================================
// SERIALIZERS (prepare data for AI prompts)
// ============================================================================

function serializeMonthlyRevenue(invoices: any[]): string {
  const monthly: Record<string, { income: number; count: number }> = {};
  for (const inv of invoices) {
    if (!inv.paid_date) continue;
    const month = inv.paid_date.substring(0, 7);
    if (!monthly[month]) monthly[month] = { income: 0, count: 0 };
    monthly[month].income += inv.amount_paid || 0;
    monthly[month].count++;
  }
  const sorted = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b));
  return sorted
    .map(([month, d]) => `${month}: Revenue ${d.income} cents (${d.count} invoices paid)`)
    .join("\n");
}

function serializeMonthlyExpenses(expenses: any[]): string {
  const monthly: Record<string, number> = {};
  for (const exp of expenses) {
    if (!exp.expense_date) continue;
    const month = exp.expense_date.substring(0, 7);
    monthly[month] = (monthly[month] || 0) + (exp.amount || 0);
  }
  const sorted = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([month, amt]) => `${month}: Expenses ${amt} cents`).join("\n");
}

function serializeOutstanding(invoices: any[]): string {
  const outstanding = invoices.filter((inv: any) =>
    ["sent", "viewed", "partial", "overdue"].includes(inv.status),
  );
  if (outstanding.length === 0) return "No outstanding invoices.";
  return outstanding
    .slice(0, 20)
    .map(
      (inv: any) =>
        `${inv.invoice_number}: ${inv.amount_due} cents due, status=${inv.status}, due=${inv.due_date}, client=${inv.client_name}`,
    )
    .join("\n");
}

function serializeRecurring(recurring: any[]): string {
  if (recurring.length === 0) return "No active recurring invoices.";
  return recurring
    .map(
      (r: any) =>
        `${r.client_name}: ${r.amount} cents, frequency=${r.frequency}, next=${r.next_run_date}`,
    )
    .join("\n");
}

// ============================================================================
// 1. CASH FLOW FORECAST
// ============================================================================

export async function getCashFlowForecast(
  siteId: string,
  months: number = 3,
): Promise<{ data: CashFlowForecast | null; error: string | null; usage?: AiUsageStatus }> {
  try {
    // Check cache
    const cacheKey = `forecast_${siteId}_${months}`;
    const cached = getCached<CashFlowForecast>(cacheKey);
    if (cached) return { data: cached, error: null };

    // Check rate limit
    const { allowed, usage } = await checkAiUsage(siteId);
    if (!allowed) {
      return { data: null, error: "Daily AI query limit reached. Resets tomorrow.", usage };
    }

    // Load data
    const [invoices, expenses, recurring, settings] = await Promise.all([
      loadInvoiceHistory(siteId),
      loadExpenses(siteId),
      loadRecurringSchedules(siteId),
      loadSettings(siteId),
    ]);

    const systemPrompt = `You are a financial analyst for a small/medium business. Analyze financial data and predict cash flow. All monetary amounts are in CENTS (divide by 100 for display). Currency: ${settings.default_currency}. Respond ONLY with valid JSON matching the specified schema. Do not include any explanation outside the JSON.`;

    const userPrompt = `Based on the following data, predict cash flow for the next ${months} months starting from today (${new Date().toISOString().split("T")[0]}):

Historical monthly revenue (last 12 months):
${serializeMonthlyRevenue(invoices)}

Monthly expense totals:
${serializeMonthlyExpenses(expenses)}

Recurring invoices schedule:
${serializeRecurring(recurring)}

Outstanding invoices:
${serializeOutstanding(invoices)}

Respond with JSON:
{
  "months": [
    {
      "month": "YYYY-MM",
      "predictedIncome": <number in cents>,
      "predictedExpenses": <number in cents>,
      "predictedNetCash": <number in cents>,
      "confidence": <0-1>,
      "factors": ["factor 1", "factor 2"]
    }
  ],
  "summary": "<1-2 paragraph natural language summary>",
  "alerts": ["<actionable alert if any>"]
}`;

    const result = await callClaude<{
      months: CashFlowForecastMonth[];
      summary: string;
      alerts: string[];
    }>(AI_MODELS.sonnet, systemPrompt, userPrompt);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + FORECAST_CACHE_HOURS * 60 * 60 * 1000);

    const forecast: CashFlowForecast = {
      months: result.months,
      summary: result.summary,
      alerts: result.alerts || [],
      generatedAt: now.toISOString(),
      cachedUntil: expiresAt.toISOString(),
    };

    setCache(cacheKey, forecast, FORECAST_CACHE_HOURS);
    return { data: forecast, error: null, usage };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Cash flow forecast failed",
    };
  }
}

// ============================================================================
// 2. PAYMENT PREDICTION
// ============================================================================

export async function getPaymentPrediction(
  invoiceId: string,
): Promise<{ data: PaymentPrediction | null; error: string | null; usage?: AiUsageStatus }> {
  try {
    const supabase = await getModuleClient();

    // Get the invoice
    const { data: invoice } = await supabase
      .from(INV_TABLES.invoices)
      .select("id, invoice_number, site_id, contact_id, client_name, status, due_date, amount_due, issue_date")
      .eq("id", invoiceId)
      .single();

    if (!invoice) return { data: null, error: "Invoice not found" };

    // Check rate limit
    const { allowed, usage } = await checkAiUsage(invoice.site_id);
    if (!allowed) {
      return { data: null, error: "Daily AI query limit reached.", usage };
    }

    // Get client payment history
    const { data: clientInvoices } = await supabase
      .from(INV_TABLES.invoices)
      .select("id, status, due_date, paid_date, amount_due, amount_paid, issue_date")
      .eq("site_id", invoice.site_id)
      .eq("contact_id", invoice.contact_id)
      .in("status", ["paid", "partial", "overdue", "sent", "viewed"])
      .order("issue_date", { ascending: false })
      .limit(20);

    const history = (clientInvoices || []).map((inv: any) => {
      const daysToPay = inv.paid_date
        ? Math.floor(
            (new Date(inv.paid_date).getTime() - new Date(inv.issue_date).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;
      return `Invoice ${inv.id.substring(0, 8)}: status=${inv.status}, due=${inv.due_date}, paid=${inv.paid_date || "unpaid"}, days_to_pay=${daysToPay ?? "N/A"}`;
    });

    const systemPrompt = `You are a financial analyst. Predict when an invoice will be paid based on the client's payment history. All amounts in CENTS. Respond ONLY with valid JSON.`;

    const userPrompt = `Predict payment for this invoice:
- Invoice: ${invoice.invoice_number}
- Client: ${invoice.client_name}
- Amount due: ${invoice.amount_due} cents
- Issue date: ${invoice.issue_date}
- Due date: ${invoice.due_date}
- Current status: ${invoice.status}

Client's payment history (most recent first):
${history.length > 0 ? history.join("\n") : "No previous invoices for this client."}

Respond with JSON:
{
  "predictedPayDate": "YYYY-MM-DD",
  "confidencePercent": <0-100>,
  "reasoning": "<brief explanation>",
  "riskOfLate": "low" | "medium" | "high"
}`;

    const result = await callClaude<{
      predictedPayDate: string;
      confidencePercent: number;
      reasoning: string;
      riskOfLate: "low" | "medium" | "high";
    }>(AI_MODELS.sonnet, systemPrompt, userPrompt);

    return {
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        predictedPayDate: result.predictedPayDate,
        confidencePercent: result.confidencePercent,
        reasoning: result.reasoning,
        riskOfLate: result.riskOfLate,
      },
      error: null,
      usage,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Payment prediction failed",
    };
  }
}

// ============================================================================
// 3. CLIENT RISK SCORE
// ============================================================================

export async function getClientRiskScore(
  siteId: string,
  contactId: string,
): Promise<{ data: ClientRiskScore | null; error: string | null; usage?: AiUsageStatus }> {
  try {
    // Check cache
    const cacheKey = `risk_${siteId}_${contactId}`;
    const cached = getCached<ClientRiskScore>(cacheKey);
    if (cached) return { data: cached, error: null };

    // Check rate limit
    const { allowed, usage } = await checkAiUsage(siteId);
    if (!allowed) {
      return { data: null, error: "Daily AI query limit reached.", usage };
    }

    const supabase = await getModuleClient();

    // Get all invoices for this contact
    const { data: invoices } = await supabase
      .from(INV_TABLES.invoices)
      .select("id, status, due_date, paid_date, issue_date, total, amount_due, amount_paid, client_name")
      .eq("site_id", siteId)
      .eq("contact_id", contactId)
      .in("status", ["paid", "partial", "overdue", "sent", "viewed", "void", "cancelled"])
      .order("issue_date", { ascending: false })
      .limit(50);

    const allInvoices = invoices || [];
    if (allInvoices.length === 0) {
      return { data: null, error: "No invoices found for this client" };
    }

    const clientName = allInvoices[0]?.client_name || "Unknown";

    // Calculate factors
    const paidInvoices = allInvoices.filter((inv: any) => inv.paid_date);
    let totalDaysToPay = 0;
    let onTimeCount = 0;

    for (const inv of paidInvoices) {
      const daysToPay = Math.floor(
        (new Date(inv.paid_date).getTime() - new Date(inv.issue_date).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      totalDaysToPay += daysToPay;
      const dueDate = new Date(inv.due_date);
      const paidDate = new Date(inv.paid_date);
      if (paidDate <= dueDate) onTimeCount++;
    }

    const overdueInvoices = allInvoices.filter((inv: any) => inv.status === "overdue");
    let longestOverdueDays = 0;
    const today = new Date();
    for (const inv of overdueInvoices) {
      const days = Math.floor(
        (today.getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (days > longestOverdueDays) longestOverdueDays = days;
    }

    const factors: ClientRiskFactors = {
      averageDaysToPay: paidInvoices.length > 0 ? Math.round(totalDaysToPay / paidInvoices.length) : 0,
      onTimePaymentRate: paidInvoices.length > 0 ? Math.round((onTimeCount / paidInvoices.length) * 100) : 0,
      totalInvoiced: allInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
      totalOverdue: overdueInvoices.reduce((sum: number, inv: any) => sum + (inv.amount_due || 0), 0),
      overdueCount: overdueInvoices.length,
      longestOverdueDays,
    };

    const systemPrompt = `You are a credit risk analyst. Assess client payment risk based on their invoice history. Respond ONLY with valid JSON.`;

    const userPrompt = `Assess the risk for this client:
- Client: ${clientName}
- Total invoices: ${allInvoices.length}
- Paid on time: ${onTimeCount}/${paidInvoices.length}
- Average days to pay: ${factors.averageDaysToPay}
- On-time rate: ${factors.onTimePaymentRate}%
- Currently overdue: ${overdueInvoices.length} invoices (${factors.totalOverdue} cents)
- Longest overdue: ${longestOverdueDays} days
- Total invoiced: ${factors.totalInvoiced} cents

Respond with JSON:
{
  "riskRating": "low" | "medium" | "high",
  "score": <0-100, 100 = highest risk>,
  "recommendation": "<1-2 sentence actionable recommendation>"
}`;

    const result = await callClaude<{
      riskRating: "low" | "medium" | "high";
      score: number;
      recommendation: string;
    }>(AI_MODELS.sonnet, systemPrompt, userPrompt);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + RISK_SCORE_CACHE_HOURS * 60 * 60 * 1000);

    const riskScore: ClientRiskScore = {
      contactId,
      clientName,
      riskRating: result.riskRating,
      score: result.score,
      factors,
      recommendation: result.recommendation,
      generatedAt: now.toISOString(),
      cachedUntil: expiresAt.toISOString(),
    };

    setCache(cacheKey, riskScore, RISK_SCORE_CACHE_HOURS);
    return { data: riskScore, error: null, usage };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Risk scoring failed",
    };
  }
}

// ============================================================================
// 4. INVOICE OPTIMIZATION SUGGESTIONS
// ============================================================================

export async function suggestInvoiceOptimizations(
  siteId: string,
): Promise<{ data: Optimization[] | null; error: string | null; usage?: AiUsageStatus }> {
  try {
    const { allowed, usage } = await checkAiUsage(siteId);
    if (!allowed) {
      return { data: null, error: "Daily AI query limit reached.", usage };
    }

    const [invoices, payments, settings] = await Promise.all([
      loadInvoiceHistory(siteId),
      loadPaymentHistory(siteId),
      loadSettings(siteId),
    ]);

    // Summarize for AI
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv: any) => inv.status === "paid");
    const overdueInvoices = invoices.filter((inv: any) => inv.status === "overdue");
    const totalRevenue = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.amount_paid || 0), 0);

    const paymentMethods: Record<string, number> = {};
    for (const p of payments) {
      const method = p.payment_method || "unknown";
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    }

    // Days to pay distribution
    const daysToPay: number[] = [];
    for (const inv of paidInvoices) {
      if (inv.paid_date && inv.issue_date) {
        const days = Math.floor(
          (new Date(inv.paid_date).getTime() - new Date(inv.issue_date).getTime()) / (1000 * 60 * 60 * 24),
        );
        daysToPay.push(days);
      }
    }
    const avgDaysToPay = daysToPay.length > 0 ? Math.round(daysToPay.reduce((a, b) => a + b, 0) / daysToPay.length) : 0;

    const systemPrompt = `You are a business financial advisor. Analyze invoicing data and suggest actionable optimizations. Currency: ${settings.default_currency}. All amounts in CENTS. Respond ONLY with valid JSON.`;

    const userPrompt = `Analyze this business's invoicing and suggest improvements:

Summary (last 12 months):
- Total invoices: ${totalInvoices}
- Paid: ${paidInvoices.length}, Overdue: ${overdueInvoices.length}
- Total revenue: ${totalRevenue} cents
- Average days to pay: ${avgDaysToPay}
- Payment methods: ${JSON.stringify(paymentMethods)}
- Overdue amount: ${overdueInvoices.reduce((s: number, i: any) => s + (i.amount_due || 0), 0)} cents

Top overdue clients:
${overdueInvoices
  .slice(0, 5)
  .map((inv: any) => `${inv.client_name}: ${inv.amount_due} cents, due ${inv.due_date}`)
  .join("\n") || "None"}

Generate 3-6 actionable optimization suggestions.

Respond with JSON array:
[
  {
    "id": "<unique-id>",
    "type": "payment_terms" | "early_discount" | "follow_up" | "pricing" | "timing" | "general",
    "title": "<short title>",
    "description": "<1-2 sentence description>",
    "impact": "low" | "medium" | "high",
    "actionLabel": "<button label or null>",
    "actionData": null
  }
]`;

    const result = await callClaude<Optimization[]>(AI_MODELS.sonnet, systemPrompt, userPrompt);

    return { data: Array.isArray(result) ? result : [], error: null, usage };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Optimization suggestions failed",
    };
  }
}

// ============================================================================
// 5. EXPENSE CATEGORIZATION (Haiku — fast)
// ============================================================================

export async function categorizeExpense(
  siteId: string,
  description: string,
  amount: number,
): Promise<{ data: ExpenseCategorization | null; error: string | null; usage?: AiUsageStatus }> {
  try {
    const { allowed, usage } = await checkAiUsage(siteId);
    if (!allowed) {
      return { data: null, error: "Daily AI query limit reached.", usage };
    }

    const categories = await loadExpenseCategories(siteId);

    if (categories.length === 0) {
      return {
        data: {
          categoryId: null,
          categoryName: "Uncategorized",
          confidence: 0,
          alternativeCategories: [],
        },
        error: null,
        usage,
      };
    }

    const categoryList = categories
      .map((c: any) => `ID: ${c.id}, Name: ${c.name}${c.description ? ` (${c.description})` : ""}`)
      .join("\n");

    const systemPrompt = `You are an accounting assistant. Categorize expenses into the provided categories. Respond ONLY with valid JSON.`;

    const userPrompt = `Categorize this expense:
Description: "${description}"
Amount: ${amount} cents

Available categories:
${categoryList}

Respond with JSON:
{
  "categoryId": "<id of best match>",
  "categoryName": "<name of best match>",
  "confidence": <0-1>,
  "alternativeCategories": [
    { "categoryId": "<id>", "categoryName": "<name>", "confidence": <0-1> }
  ]
}

Include up to 2 alternative categories if relevant. If no good match, use the closest one with low confidence.`;

    const result = await callClaude<ExpenseCategorization>(
      AI_MODELS.haiku,
      systemPrompt,
      userPrompt,
      1024,
    );

    return { data: result, error: null, usage };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Expense categorization failed",
    };
  }
}

// ============================================================================
// 6. FINANCIAL Q&A (Sonnet — complex reasoning)
// ============================================================================

export async function askFinancialQuestion(
  siteId: string,
  question: string,
): Promise<{ data: FinancialAnswer | null; error: string | null; usage?: AiUsageStatus }> {
  try {
    const { allowed, usage } = await checkAiUsage(siteId);
    if (!allowed) {
      return { data: null, error: "Daily AI query limit reached.", usage };
    }

    const [invoices, expenses, recurring, settings] = await Promise.all([
      loadInvoiceHistory(siteId),
      loadExpenses(siteId),
      loadRecurringSchedules(siteId),
      loadSettings(siteId),
    ]);

    const totalRevenue = invoices
      .filter((inv: any) => inv.status === "paid")
      .reduce((sum: number, inv: any) => sum + (inv.amount_paid || 0), 0);
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    const outstanding = invoices
      .filter((inv: any) => ["sent", "viewed", "partial", "overdue"].includes(inv.status))
      .reduce((sum: number, inv: any) => sum + (inv.amount_due || 0), 0);
    const overdueCount = invoices.filter((inv: any) => inv.status === "overdue").length;

    const systemPrompt = `You are a financial assistant for a business. Answer the following question using ONLY the provided financial data. If the data doesn't support a complete answer, say so. Currency: ${settings.default_currency}. All amounts in the data are in CENTS — convert to main currency units (divide by 100) in your answer. Be concise and include specific numbers.

If the answer would benefit from a chart or table, include a "data" field in your response.`;

    const userPrompt = `Financial data context:
- Company: ${settings.company_name || "This business"}
- Currency: ${settings.default_currency}
- Total revenue (last 12 months): ${totalRevenue} cents
- Total expenses (last 12 months): ${totalExpenses} cents
- Net profit: ${totalRevenue - totalExpenses} cents
- Outstanding invoices: ${outstanding} cents
- Overdue invoices: ${overdueCount}
- Active recurring invoices: ${recurring.length}
- Total invoices: ${invoices.length}

Monthly revenue:
${serializeMonthlyRevenue(invoices)}

Monthly expenses:
${serializeMonthlyExpenses(expenses)}

Question: ${question}

Respond with JSON:
{
  "answer": "<clear concise answer with specific numbers>",
  "data": null OR {
    "type": "chart" | "table" | "metric",
    "chartType": "line" | "bar" | "pie",
    "labels": ["label1", "label2"],
    "values": [100, 200]
  }
}`;

    const result = await callClaude<FinancialAnswer>(
      AI_MODELS.sonnet,
      systemPrompt,
      userPrompt,
    );

    return { data: result, error: null, usage };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Financial Q&A failed",
    };
  }
}

// ============================================================================
// 7. INVOICE DESCRIPTION GENERATION (Haiku — fast)
// ============================================================================

export async function generateInvoiceDescription(
  siteId: string,
  context: { itemName: string; clientType?: string; quantity?: number },
): Promise<{ data: string | null; error: string | null; usage?: AiUsageStatus }> {
  try {
    const { allowed, usage } = await checkAiUsage(siteId);
    if (!allowed) {
      return { data: null, error: "Daily AI query limit reached.", usage };
    }

    const systemPrompt = `You are a professional invoice writer. Generate a clear, professional line item description for an invoice. Keep it to 1-2 sentences. Do not include pricing.`;

    const userPrompt = `Generate a professional invoice line item description:
- Item/Service: ${context.itemName}
${context.clientType ? `- Client type: ${context.clientType}` : ""}
${context.quantity ? `- Quantity: ${context.quantity}` : ""}

Respond with just the description text, no JSON wrapping, no quotes.`;

    const result = await callClaudeText(AI_MODELS.haiku, systemPrompt, userPrompt, 256);

    return { data: result.trim(), error: null, usage };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Description generation failed",
    };
  }
}

// ============================================================================
// 8. FINANCIAL SUMMARY
// ============================================================================

export async function getFinancialSummary(
  siteId: string,
  period: "month" | "quarter" | "year" = "month",
): Promise<{ data: string | null; error: string | null; usage?: AiUsageStatus }> {
  try {
    const { allowed, usage } = await checkAiUsage(siteId);
    if (!allowed) {
      return { data: null, error: "Daily AI query limit reached.", usage };
    }

    const [invoices, expenses, settings] = await Promise.all([
      loadInvoiceHistory(siteId),
      loadExpenses(siteId),
      loadSettings(siteId),
    ]);

    // Filter to period
    const now = new Date();
    let cutoff: Date;
    switch (period) {
      case "month":
        cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        cutoff = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case "year":
        cutoff = new Date(now.getFullYear(), 0, 1);
        break;
    }
    const cutoffStr = cutoff.toISOString();

    const periodInvoices = invoices.filter((inv: any) => inv.issue_date >= cutoffStr);
    const periodExpenses = expenses.filter((exp: any) => exp.expense_date >= cutoffStr);

    const paidInvoices = periodInvoices.filter((inv: any) => inv.status === "paid");
    const revenue = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.amount_paid || 0), 0);
    const expenseTotal = periodExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    const outstanding = periodInvoices
      .filter((inv: any) => ["sent", "viewed", "partial", "overdue"].includes(inv.status))
      .reduce((sum: number, inv: any) => sum + (inv.amount_due || 0), 0);
    const overdueCount = periodInvoices.filter((inv: any) => inv.status === "overdue").length;

    const periodLabel = period === "month" ? "this month" : period === "quarter" ? "this quarter" : "this year";

    const systemPrompt = `You are a CFO writing a financial summary for a business owner. Be concise, use specific numbers (convert cents to main currency by dividing by 100), and highlight key trends and concerns. Currency: ${settings.default_currency}. Write 2-3 paragraphs.`;

    const userPrompt = `Write a financial summary for ${periodLabel}:

Company: ${settings.company_name || "This business"}
Period: ${cutoffStr.split("T")[0]} to ${now.toISOString().split("T")[0]}
Revenue collected: ${revenue} cents
Expenses: ${expenseTotal} cents
Net profit: ${revenue - expenseTotal} cents
Invoices created: ${periodInvoices.length}
Invoices paid: ${paidInvoices.length}
Outstanding: ${outstanding} cents
Overdue: ${overdueCount} invoices

Previous period monthly revenue for comparison:
${serializeMonthlyRevenue(invoices)}

Write a natural language summary.`;

    const result = await callClaudeText(AI_MODELS.sonnet, systemPrompt, userPrompt, 1024);

    return { data: result.trim(), error: null, usage };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Financial summary failed",
    };
  }
}

// ============================================================================
// BONUS: GET AI INSIGHTS (for dashboard widget)
// ============================================================================

export async function getAiInsights(
  siteId: string,
): Promise<{ data: AiInsight[] | null; error: string | null; usage?: AiUsageStatus }> {
  try {
    const { allowed, usage } = await checkAiUsage(siteId);
    if (!allowed) {
      return { data: null, error: "Daily AI query limit reached.", usage };
    }

    const [invoices, expenses, settings] = await Promise.all([
      loadInvoiceHistory(siteId, 6),
      loadExpenses(siteId, 6),
      loadSettings(siteId),
    ]);

    const overdueInvoices = invoices.filter((inv: any) => inv.status === "overdue");
    const totalOverdue = overdueInvoices.reduce((sum: number, inv: any) => sum + (inv.amount_due || 0), 0);
    const paidInvoices = invoices.filter((inv: any) => inv.status === "paid");
    const revenue = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.amount_paid || 0), 0);
    const expenseTotal = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);

    const systemPrompt = `You are a financial advisor. Generate 2-4 actionable insights based on the business data. Focus on the most important items. Be specific with numbers (convert cents to main currency by dividing by 100). Currency: ${settings.default_currency}. Respond ONLY with valid JSON.`;

    const userPrompt = `Generate financial insights for this business:
- Revenue (6 months): ${revenue} cents
- Expenses (6 months): ${expenseTotal} cents
- Overdue invoices: ${overdueInvoices.length} totaling ${totalOverdue} cents
- Total invoices (6 months): ${invoices.length}

Monthly revenue:
${serializeMonthlyRevenue(invoices)}

Respond with JSON array:
[
  {
    "id": "<unique-id>",
    "type": "alert" | "suggestion" | "info",
    "title": "<short title>",
    "description": "<actionable 1-2 sentence description>",
    "severity": "low" | "medium" | "high",
    "actionLabel": "<button label or null>",
    "actionHref": "<relative link or null>"
  }
]`;

    const result = await callClaude<AiInsight[]>(AI_MODELS.sonnet, systemPrompt, userPrompt, 2048);

    return { data: Array.isArray(result) ? result : [], error: null, usage };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "AI insights failed",
    };
  }
}

// ============================================================================
// AI USAGE STATUS
// ============================================================================

export async function getAiUsageStatus(
  siteId: string,
): Promise<AiUsageStatus> {
  const supabase = await getModuleClient();
  const todayKey = new Date().toISOString().split("T")[0];

  try {
    const { data: settings } = await supabase
      .from(INV_TABLES.settings)
      .select("metadata")
      .eq("site_id", siteId)
      .single();

    const metadata = (settings?.metadata as Record<string, unknown>) || {};
    const aiUsage = (metadata.ai_usage as Record<string, number>) || {};
    const todayCount = aiUsage[todayKey] || 0;

    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    return {
      queriesUsed: todayCount,
      queriesLimit: AI_DAILY_LIMIT,
      queriesRemaining: Math.max(0, AI_DAILY_LIMIT - todayCount),
      resetsAt: tomorrow.toISOString(),
    };
  } catch {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return {
      queriesUsed: 0,
      queriesLimit: AI_DAILY_LIMIT,
      queriesRemaining: AI_DAILY_LIMIT,
      resetsAt: tomorrow.toISOString(),
    };
  }
}
