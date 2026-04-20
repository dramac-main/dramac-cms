"use server";

/**
 * Invoicing Module - Report Actions
 *
 * Phase INV-07: Financial Dashboard, Reports & P&L Statements
 *
 * 10 server actions for financial reporting and dashboard metrics.
 * ALL amounts returned in CENTS (integers).
 */

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import type {
  DashboardMetrics,
  RevenueByPeriod,
  CashFlowReport,
  CashFlowPeriodEntry,
  ProfitAndLoss,
  ARAgingReport,
  ARAgingClientRow,
  ARAgingInvoice,
  TaxSummary,
  TaxSummaryByRate,
  TaxFilingPeriod,
  ExpenseReport,
  ExpenseByCategory,
  ExpenseByVendor,
  ExpenseByMonth,
  ExpenseBudgetComparison,
  TopClient,
  InvoiceStatusDistribution,
  PaymentMethodDistribution,
  DateRange,
  CrossModuleRevenue,
  RevenueBySource,
  CrossModulePeriodEntry,
  CrossModuleClientReport,
  CrossModuleClientRow,
  RevenueTrendsComparison,
} from "../types/report-types";

// ─── Helpers ───────────────────────────────────────────────────

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

function getDateRangeFilter(dateRange?: DateRange): {
  start: string;
  end: string;
} {
  if (dateRange?.start && dateRange?.end) {
    return { start: dateRange.start, end: dateRange.end };
  }
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  ).toISOString();
  return { start, end };
}

function escapeCsvCell(
  value: string | number | boolean | null | undefined,
): string {
  const text = value == null ? "" : String(value);
  const escaped = text.replace(/"/g, '""');

  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function serializeCsv(
  rows: Array<Array<string | number | boolean | null | undefined>>,
): string {
  return rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

function getMonthStart(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

function getMonthEnd(date: Date): string {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
  ).toISOString();
}

// ─── 1. Dashboard Metrics ──────────────────────────────────────

export async function getDashboardMetrics(
  siteId: string,
): Promise<DashboardMetrics> {
  const supabase = await getModuleClient();
  const now = new Date();
  const thisMonthStart = getMonthStart(now);
  const thisMonthEnd = getMonthEnd(now);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = getMonthStart(lastMonth);
  const lastMonthEnd = getMonthEnd(lastMonth);

  // Total revenue: sum of completed payments
  const { data: revenueData } = await supabase
    .from(INV_TABLES.payments)
    .select("amount")
    .eq("site_id", siteId)
    .eq("type", "payment")
    .eq("status", "completed");

  const totalRevenue = (revenueData || []).reduce(
    (sum: number, r: any) => sum + (r.amount || 0),
    0,
  );

  // Outstanding: sum of amount_due on unpaid invoices
  const { data: outstandingData } = await supabase
    .from(INV_TABLES.invoices)
    .select("amount_due, due_date, status")
    .eq("site_id", siteId)
    .in("status", ["sent", "viewed", "partial", "overdue"]);

  const outstandingInvoices = outstandingData || [];
  const totalOutstanding = outstandingInvoices.reduce(
    (sum: number, inv: any) => sum + (inv.amount_due || 0),
    0,
  );

  const todayStr = now.toISOString().split("T")[0];
  const overdueInvoices = outstandingInvoices.filter(
    (inv: any) => inv.due_date && inv.due_date < todayStr,
  );
  const totalOverdue = overdueInvoices.reduce(
    (sum: number, inv: any) => sum + (inv.amount_due || 0),
    0,
  );
  const overdueCount = overdueInvoices.length;

  // Total expenses (approved + paid)
  const { data: expenseData } = await supabase
    .from(INV_TABLES.expenses)
    .select("amount")
    .eq("site_id", siteId)
    .in("status", ["approved", "paid"]);

  const totalExpenses = (expenseData || []).reduce(
    (sum: number, e: any) => sum + (e.amount || 0),
    0,
  );

  const netProfit = totalRevenue - totalExpenses;

  // Invoice counts
  const { data: sentInvoices } = await supabase
    .from(INV_TABLES.invoices)
    .select("id")
    .eq("site_id", siteId)
    .in("status", ["sent", "viewed", "partial", "paid", "overdue"]);

  const invoicesSent = (sentInvoices || []).length;

  const { data: paidInvoices } = await supabase
    .from(INV_TABLES.invoices)
    .select("id")
    .eq("site_id", siteId)
    .eq("status", "paid");

  const invoicesPaid = (paidInvoices || []).length;

  // Average payment days: avg(payment_date - invoice.issue_date) for completed payments
  const { data: paymentDaysData } = await supabase
    .from(INV_TABLES.payments)
    .select("payment_date, invoice_id")
    .eq("site_id", siteId)
    .eq("type", "payment")
    .eq("status", "completed")
    .limit(100);

  let averagePaymentDays = 0;
  if (paymentDaysData && paymentDaysData.length > 0) {
    const invoiceIds = [
      ...new Set(paymentDaysData.map((p: any) => p.invoice_id)),
    ];
    const { data: invoiceDates } = await supabase
      .from(INV_TABLES.invoices)
      .select("id, issue_date")
      .in("id", invoiceIds);

    const dateMap = new Map(
      (invoiceDates || []).map((i: any) => [i.id, i.issue_date]),
    );
    let totalDays = 0;
    let count = 0;
    for (const p of paymentDaysData) {
      const issueDate = dateMap.get(p.invoice_id);
      if (issueDate && p.payment_date) {
        const diff = Math.floor(
          (new Date(p.payment_date as string).getTime() -
            new Date(issueDate as string).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (diff >= 0) {
          totalDays += diff;
          count++;
        }
      }
    }
    averagePaymentDays = count > 0 ? Math.round(totalDays / count) : 0;
  }

  // Collection rate: total paid / total invoiced * 100
  const { data: allInvoices } = await supabase
    .from(INV_TABLES.invoices)
    .select("total")
    .eq("site_id", siteId)
    .not("status", "in", '("draft","void","cancelled")');

  const totalInvoiced = (allInvoices || []).reduce(
    (sum: number, inv: any) => sum + (inv.total || 0),
    0,
  );
  const collectionRate =
    totalInvoiced > 0 ? Math.round((totalRevenue / totalInvoiced) * 100) : 0;

  // Revenue this month
  const { data: thisMonthPayments } = await supabase
    .from(INV_TABLES.payments)
    .select("amount")
    .eq("site_id", siteId)
    .eq("type", "payment")
    .eq("status", "completed")
    .gte("payment_date", thisMonthStart)
    .lte("payment_date", thisMonthEnd);

  const revenueThisMonth = (thisMonthPayments || []).reduce(
    (sum: number, p: any) => sum + (p.amount || 0),
    0,
  );

  // Revenue last month
  const { data: lastMonthPayments } = await supabase
    .from(INV_TABLES.payments)
    .select("amount")
    .eq("site_id", siteId)
    .eq("type", "payment")
    .eq("status", "completed")
    .gte("payment_date", lastMonthStart)
    .lte("payment_date", lastMonthEnd);

  const revenueLastMonth = (lastMonthPayments || []).reduce(
    (sum: number, p: any) => sum + (p.amount || 0),
    0,
  );

  const revenueGrowthPercent =
    revenueLastMonth > 0
      ? Math.round(
          ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100,
        )
      : revenueThisMonth > 0
        ? 100
        : 0;

  // ── Accounts Payable (INV-14) ────────────────────────────────
  const { data: billsOutstanding } = await supabase
    .from(INV_TABLES.bills)
    .select("amount_due, due_date, status")
    .eq("site_id", siteId)
    .in("status", ["received", "partial", "overdue"]);

  const billsRows = billsOutstanding || [];
  const totalBillsOutstanding = billsRows.reduce(
    (sum: number, b: any) => sum + (b.amount_due || 0),
    0,
  );
  const totalBillsOverdue = billsRows
    .filter((b: any) => b.due_date && b.due_date < todayStr)
    .reduce((sum: number, b: any) => sum + (b.amount_due || 0), 0);

  const { data: billsPaidData } = await supabase
    .from(INV_TABLES.bills)
    .select("total")
    .eq("site_id", siteId)
    .eq("status", "paid")
    .gte("updated_at", thisMonthStart)
    .lte("updated_at", thisMonthEnd);

  const totalBillsPaidThisPeriod = (billsPaidData || []).reduce(
    (sum: number, b: any) => sum + (b.total || 0),
    0,
  );

  const { count: activePOCount } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .in("status", ["sent", "acknowledged", "partially_received"]);

  const activePurchaseOrders = activePOCount || 0;
  const netCashPosition = totalOutstanding - totalBillsOutstanding;

  return {
    totalRevenue,
    totalOutstanding,
    totalOverdue,
    overdueCount,
    totalExpenses,
    netProfit,
    invoicesSent,
    invoicesPaid,
    averagePaymentDays,
    collectionRate,
    revenueThisMonth,
    revenueLastMonth,
    revenueGrowthPercent,
    totalBillsOutstanding,
    totalBillsOverdue,
    totalBillsPaidThisPeriod,
    activePurchaseOrders,
    netCashPosition,
  };
}

// ─── 2. Revenue By Period ──────────────────────────────────────

export async function getRevenueByPeriod(
  siteId: string,
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" = "monthly",
  dateRange?: DateRange,
): Promise<RevenueByPeriod[]> {
  const supabase = await getModuleClient();
  const { start, end } = dateRange
    ? getDateRangeFilter(dateRange)
    : (() => {
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), 0, 1).toISOString(),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString(),
        };
      })();

  // Get invoices in range
  const { data: invoices } = await supabase
    .from(INV_TABLES.invoices)
    .select("id, total, issue_date, status")
    .eq("site_id", siteId)
    .not("status", "in", '("draft","void","cancelled")')
    .gte("issue_date", start)
    .lte("issue_date", end);

  // Get payments in range
  const { data: payments } = await supabase
    .from(INV_TABLES.payments)
    .select("amount, payment_date")
    .eq("site_id", siteId)
    .eq("type", "payment")
    .eq("status", "completed")
    .gte("payment_date", start)
    .lte("payment_date", end);

  // Get expenses in range
  const { data: expenses } = await supabase
    .from(INV_TABLES.expenses)
    .select("amount, date")
    .eq("site_id", siteId)
    .in("status", ["approved", "paid"])
    .gte("date", start)
    .lte("date", end);

  // Group by period
  const getPeriodKey = (dateStr: string): string => {
    const d = new Date(dateStr);
    switch (period) {
      case "daily":
        return d.toISOString().split("T")[0];
      case "weekly": {
        const week = getWeekNumber(d);
        return `${d.getFullYear()}-W${week.toString().padStart(2, "0")}`;
      }
      case "monthly":
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      case "quarterly": {
        const q = Math.floor(d.getMonth() / 3) + 1;
        return `${d.getFullYear()}-Q${q}`;
      }
      case "yearly":
        return `${d.getFullYear()}`;
      default:
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    }
  };

  const periodMap = new Map<
    string,
    { invoiced: number; collected: number; expenses: number }
  >();

  for (const inv of invoices || []) {
    const key = getPeriodKey(inv.issue_date);
    const existing = periodMap.get(key) || {
      invoiced: 0,
      collected: 0,
      expenses: 0,
    };
    existing.invoiced += inv.total || 0;
    periodMap.set(key, existing);
  }

  for (const pay of payments || []) {
    const key = getPeriodKey(pay.payment_date);
    const existing = periodMap.get(key) || {
      invoiced: 0,
      collected: 0,
      expenses: 0,
    };
    existing.collected += pay.amount || 0;
    periodMap.set(key, existing);
  }

  for (const exp of expenses || []) {
    const key = getPeriodKey(exp.date);
    const existing = periodMap.get(key) || {
      invoiced: 0,
      collected: 0,
      expenses: 0,
    };
    existing.expenses += exp.amount || 0;
    periodMap.set(key, existing);
  }

  const sorted = [...periodMap.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  return sorted.map(([p, data]) => ({
    period: p,
    invoiced: data.invoiced,
    collected: data.collected,
    expenses: data.expenses,
  }));
}

function getWeekNumber(d: Date): number {
  const onejan = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (d.getTime() - onejan.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.ceil((dayOfYear + onejan.getDay() + 1) / 7);
}

// ─── 3. Cash Flow Report ───────────────────────────────────────

export async function getCashFlowReport(
  siteId: string,
  dateRange?: DateRange,
): Promise<CashFlowReport> {
  const supabase = await getModuleClient();
  const { start, end } = dateRange
    ? getDateRangeFilter(dateRange)
    : (() => {
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), 0, 1).toISOString(),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString(),
        };
      })();

  // Cash IN: invoicing completed payments
  const { data: payments } = await supabase
    .from(INV_TABLES.payments)
    .select("amount, payment_date")
    .eq("site_id", siteId)
    .eq("type", "payment")
    .eq("status", "completed")
    .gte("payment_date", start)
    .lte("payment_date", end);

  // Cash IN: e-commerce revenue (paid/completed orders)
  const { data: ecomOrders } = await supabase
    .from("mod_ecommod01_orders")
    .select("total, created_at")
    .eq("site_id", siteId)
    .in("payment_status", ["paid", "completed"])
    .gte("created_at", start)
    .lte("created_at", end);

  // Cash IN: booking revenue (paid appointments)
  const { data: bookings } = await supabase
    .from("mod_bookmod01_appointments")
    .select("payment_amount, start_time")
    .eq("site_id", siteId)
    .eq("payment_status", "paid")
    .gte("start_time", start)
    .lte("start_time", end);

  // Cash OUT: approved/paid expenses
  const { data: expenses } = await supabase
    .from(INV_TABLES.expenses)
    .select("amount, date")
    .eq("site_id", siteId)
    .in("status", ["approved", "paid"])
    .gte("date", start)
    .lte("date", end);

  // Group into monthly periods
  const periodMap = new Map<
    string,
    { invoicingIn: number; ecommerceIn: number; bookingIn: number; cashOut: number }
  >();

  for (const pay of payments || []) {
    const d = new Date(pay.payment_date);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    const existing = periodMap.get(key) || { invoicingIn: 0, ecommerceIn: 0, bookingIn: 0, cashOut: 0 };
    existing.invoicingIn += pay.amount || 0;
    periodMap.set(key, existing);
  }

  for (const o of ecomOrders || []) {
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    const existing = periodMap.get(key) || { invoicingIn: 0, ecommerceIn: 0, bookingIn: 0, cashOut: 0 };
    existing.ecommerceIn += o.total || 0;
    periodMap.set(key, existing);
  }

  for (const b of bookings || []) {
    const d = new Date(b.start_time);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    const existing = periodMap.get(key) || { invoicingIn: 0, ecommerceIn: 0, bookingIn: 0, cashOut: 0 };
    existing.bookingIn += b.payment_amount || 0;
    periodMap.set(key, existing);
  }

  for (const exp of expenses || []) {
    const d = new Date(exp.date);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    const existing = periodMap.get(key) || { invoicingIn: 0, ecommerceIn: 0, bookingIn: 0, cashOut: 0 };
    existing.cashOut += exp.amount || 0;
    periodMap.set(key, existing);
  }

  const sorted = [...periodMap.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  let runningPosition = 0;
  const periods: CashFlowPeriodEntry[] = sorted.map(([period, data]) => {
    const cashIn = data.invoicingIn + data.ecommerceIn + data.bookingIn;
    const net = cashIn - data.cashOut;
    runningPosition += net;
    return {
      period,
      cashIn,
      cashOut: data.cashOut,
      net,
      runningPosition,
      invoicingIn: data.invoicingIn,
      ecommerceIn: data.ecommerceIn,
      bookingIn: data.bookingIn,
    };
  });

  const totalIn = periods.reduce((s, p) => s + p.cashIn, 0);
  const totalOut = periods.reduce((s, p) => s + p.cashOut, 0);

  return {
    periods,
    totalIn,
    totalOut,
    netCashFlow: totalIn - totalOut,
    // Projected cash flow requires a reliable AI forecast source.
    // The AI insights module (ai-actions.ts getCashFlowForecast) exists but
    // is rate-limited and async — not suitable for embedding in a synchronous
    // report action. Set structural flag for UI to show/hide projected section.
    hasProjectedData: false,
  };
}

// ─── 4. Profit & Loss Statement ────────────────────────────────

export async function getProfitAndLoss(
  siteId: string,
  dateRange?: DateRange,
): Promise<ProfitAndLoss> {
  const supabase = await getModuleClient();
  const { start, end } = dateRange
    ? getDateRangeFilter(dateRange)
    : (() => {
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), 0, 1).toISOString(),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString(),
        };
      })();

  // Income: completed payments within date range
  const { data: payments } = await supabase
    .from(INV_TABLES.payments)
    .select("amount, invoice_id")
    .eq("site_id", siteId)
    .eq("type", "payment")
    .eq("status", "completed")
    .gte("payment_date", start)
    .lte("payment_date", end);

  const totalIncome = (payments || []).reduce(
    (sum: number, p: any) => sum + (p.amount || 0),
    0,
  );

  // Income by category: join payment → invoice → line items → items
  const invoiceIds = [
    ...new Set((payments || []).map((p: any) => p.invoice_id)),
  ];
  const incomeByCategory: { category: string; amount: number }[] = [];

  if (invoiceIds.length > 0) {
    const { data: lineItems } = await supabase
      .from(INV_TABLES.invoiceLineItems)
      .select("name, total")
      .in("invoice_id", invoiceIds);

    const categoryMap = new Map<string, number>();
    for (const li of lineItems || []) {
      const cat = "Services"; // Default category for income
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + (li.total || 0));
    }
    for (const [category, amount] of categoryMap) {
      incomeByCategory.push({ category, amount });
    }
  }

  if (incomeByCategory.length === 0 && totalIncome > 0) {
    incomeByCategory.push({ category: "Services", amount: totalIncome });
  }

  // Expenses: approved/paid within date range, grouped by category
  const { data: expenses } = await supabase
    .from(INV_TABLES.expenses)
    .select("amount, category_id")
    .eq("site_id", siteId)
    .in("status", ["approved", "paid"])
    .gte("date", start)
    .lte("date", end);

  const totalExpenses = (expenses || []).reduce(
    (sum: number, e: any) => sum + (e.amount || 0),
    0,
  );

  // Get category names
  const categoryIds = [
    ...new Set(
      (expenses || [])
        .filter((e: any) => e.category_id)
        .map((e: any) => e.category_id),
    ),
  ];
  let categoryNameMap = new Map<string, string>();
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from(INV_TABLES.expenseCategories)
      .select("id, name")
      .in("id", categoryIds);
    categoryNameMap = new Map(
      (categories || []).map((c: any) => [c.id, c.name]),
    );
  }

  const expByCatMap = new Map<string, number>();
  for (const exp of expenses || []) {
    const catName = exp.category_id
      ? categoryNameMap.get(exp.category_id) || "Uncategorized"
      : "Uncategorized";
    expByCatMap.set(
      catName,
      (expByCatMap.get(catName) || 0) + (exp.amount || 0),
    );
  }

  const expensesByCategory = [...expByCatMap.entries()].map(
    ([category, amount]) => ({
      category,
      amount,
    }),
  );

  const netProfit = totalIncome - totalExpenses;
  const netProfitMargin =
    totalIncome > 0 ? Math.round((netProfit / totalIncome) * 10000) / 100 : 0;

  // Gross margin: for a service-based platform without COGS, gross margin equals
  // net profit (all expenses are operating expenses). Made explicit so consumers
  // are aware no cost-of-goods-sold layer exists in the data model.
  const grossMargin = totalIncome - totalExpenses;
  const grossMarginPercent =
    totalIncome > 0 ? Math.round((grossMargin / totalIncome) * 10000) / 100 : 0;

  // YTD comparison: fetch the same date range from the previous year
  let ytdComparison: ProfitAndLoss["ytdComparison"] = null;
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const prevStart = new Date(startDate);
    prevStart.setFullYear(prevStart.getFullYear() - 1);
    const prevEnd = new Date(endDate);
    prevEnd.setFullYear(prevEnd.getFullYear() - 1);

    const { data: prevPayments } = await supabase
      .from(INV_TABLES.payments)
      .select("amount")
      .eq("site_id", siteId)
      .eq("type", "payment")
      .eq("status", "completed")
      .gte("payment_date", prevStart.toISOString())
      .lte("payment_date", prevEnd.toISOString());

    const previousYearIncome = (prevPayments || []).reduce(
      (sum: number, p: any) => sum + (p.amount || 0),
      0,
    );

    const { data: prevExpenses } = await supabase
      .from(INV_TABLES.expenses)
      .select("amount")
      .eq("site_id", siteId)
      .in("status", ["approved", "paid"])
      .gte("date", prevStart.toISOString())
      .lte("date", prevEnd.toISOString());

    const previousYearExpenses = (prevExpenses || []).reduce(
      (sum: number, e: any) => sum + (e.amount || 0),
      0,
    );

    const previousYearNetProfit = previousYearIncome - previousYearExpenses;

    // Only provide YTD comparison if previous year actually had data
    if (previousYearIncome > 0 || previousYearExpenses > 0) {
      const incomeGrowthPercent =
        previousYearIncome > 0
          ? Math.round(
              ((totalIncome - previousYearIncome) / previousYearIncome) * 10000,
            ) / 100
          : totalIncome > 0
            ? 100
            : 0;
      const expenseGrowthPercent =
        previousYearExpenses > 0
          ? Math.round(
              ((totalExpenses - previousYearExpenses) / previousYearExpenses) *
                10000,
            ) / 100
          : totalExpenses > 0
            ? 100
            : 0;

      ytdComparison = {
        previousYearIncome,
        previousYearExpenses,
        previousYearNetProfit,
        incomeGrowthPercent,
        expenseGrowthPercent,
      };
    }
  } catch {
    // YTD comparison is non-critical; degrade gracefully
  }

  return {
    period: { start, end },
    income: {
      total: totalIncome,
      byCategory: incomeByCategory,
    },
    expenses: {
      total: totalExpenses,
      byCategory: expensesByCategory,
    },
    netProfit,
    netProfitMargin,
    grossMargin,
    grossMarginPercent,
    ytdComparison,
  };
}

// ─── 5. AR Aging Report ────────────────────────────────────────

export async function getARAgingReport(siteId: string): Promise<ARAgingReport> {
  const supabase = await getModuleClient();

  // Get all unpaid invoices
  const { data: invoices } = await supabase
    .from(INV_TABLES.invoices)
    .select(
      "id, invoice_number, client_name, contact_id, amount_due, due_date, status",
    )
    .eq("site_id", siteId)
    .in("status", ["sent", "viewed", "partial", "overdue"])
    .gt("amount_due", 0);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  let current = 0;
  let days1to30 = 0;
  let days31to60 = 0;
  let days61to90 = 0;
  let days90plus = 0;

  const clientMap = new Map<
    string,
    {
      clientName: string;
      contactId: string;
      current: number;
      days1to30: number;
      days31to60: number;
      days61to90: number;
      days90plus: number;
      total: number;
    }
  >();

  for (const inv of invoices || []) {
    const dueDate = inv.due_date || todayStr;
    const daysOverdue = Math.max(
      0,
      Math.floor(
        (today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const amount = inv.amount_due || 0;
    const clientKey = inv.contact_id || inv.client_name || "Unknown";
    const clientName = inv.client_name || "Unknown Client";

    if (!clientMap.has(clientKey)) {
      clientMap.set(clientKey, {
        clientName,
        contactId: inv.contact_id || "",
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days90plus: 0,
        total: 0,
      });
    }

    const client = clientMap.get(clientKey)!;
    client.total += amount;

    if (daysOverdue === 0) {
      current += amount;
      client.current += amount;
    } else if (daysOverdue <= 30) {
      days1to30 += amount;
      client.days1to30 += amount;
    } else if (daysOverdue <= 60) {
      days31to60 += amount;
      client.days31to60 += amount;
    } else if (daysOverdue <= 90) {
      days61to90 += amount;
      client.days61to90 += amount;
    } else {
      days90plus += amount;
      client.days90plus += amount;
    }
  }

  const total = current + days1to30 + days31to60 + days61to90 + days90plus;
  const byClient: ARAgingClientRow[] = [...clientMap.values()].sort(
    (a, b) => b.total - a.total,
  );

  // Weighted DSO: sum(amount * daysOverdue) / sum(amount)
  // Gives a dollar-weighted average of how late receivables are
  let weightedNumerator = 0;
  let weightedDenominator = 0;
  for (const inv of invoices || []) {
    const dueDate = inv.due_date || todayStr;
    const daysOverdue = Math.max(
      0,
      Math.floor(
        (today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const amount = inv.amount_due || 0;
    weightedNumerator += amount * daysOverdue;
    weightedDenominator += amount;
  }
  const weightedDSO =
    weightedDenominator > 0
      ? Math.round((weightedNumerator / weightedDenominator) * 100) / 100
      : 0;

  return {
    summary: { current, days1to30, days31to60, days61to90, days90plus, total },
    byClient,
    weightedDSO,
  };
}

/**
 * AR Aging drilldown: fetch individual invoices for a specific aging bucket.
 * Buckets: "current" | "1-30" | "31-60" | "61-90" | "90+"
 */
export async function getARAgingInvoices(
  siteId: string,
  bucket: "current" | "1-30" | "31-60" | "61-90" | "90+",
): Promise<ARAgingInvoice[]> {
  const supabase = await getModuleClient();

  const { data: invoices } = await supabase
    .from(INV_TABLES.invoices)
    .select(
      "id, invoice_number, client_name, contact_id, amount_due, due_date, status, issue_date",
    )
    .eq("site_id", siteId)
    .in("status", ["sent", "viewed", "partial", "overdue"])
    .gt("amount_due", 0);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const results: ARAgingInvoice[] = [];
  for (const inv of invoices || []) {
    const dueDate = inv.due_date || todayStr;
    const daysOverdue = Math.max(
      0,
      Math.floor(
        (today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    let invBucket: string;
    if (daysOverdue === 0) invBucket = "current";
    else if (daysOverdue <= 30) invBucket = "1-30";
    else if (daysOverdue <= 60) invBucket = "31-60";
    else if (daysOverdue <= 90) invBucket = "61-90";
    else invBucket = "90+";

    if (invBucket === bucket) {
      results.push({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        clientName: inv.client_name || "Unknown Client",
        contactId: inv.contact_id || "",
        amountDue: inv.amount_due,
        dueDate: inv.due_date,
        daysOverdue,
        status: inv.status,
      });
    }
  }

  return results.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

// ─── 6. Tax Summary ────────────────────────────────────────────

export async function getTaxSummary(
  siteId: string,
  dateRange?: DateRange,
): Promise<TaxSummary> {
  const supabase = await getModuleClient();
  const { start, end } = dateRange
    ? getDateRangeFilter(dateRange)
    : (() => {
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), 0, 1).toISOString(),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString(),
        };
      })();

  // Tax collected: from paid invoices' line items
  const { data: paidInvoices } = await supabase
    .from(INV_TABLES.invoices)
    .select("id, tax_total, issue_date")
    .eq("site_id", siteId)
    .eq("status", "paid")
    .gte("issue_date", start)
    .lte("issue_date", end);

  const taxCollected = (paidInvoices || []).reduce(
    (sum: number, inv: any) => sum + (inv.tax_total || 0),
    0,
  );

  // Tax collected by rate
  const paidInvoiceIds = (paidInvoices || []).map((i: any) => i.id);
  const taxByRateMap = new Map<
    string,
    { name: string; rate: number; collected: number; paid: number }
  >();

  if (paidInvoiceIds.length > 0) {
    const { data: lineItems } = await supabase
      .from(INV_TABLES.invoiceLineItems)
      .select("tax_rate_id, tax_rate, tax_amount")
      .in("invoice_id", paidInvoiceIds);

    // Get tax rate names
    const taxRateIds = [
      ...new Set(
        (lineItems || [])
          .filter((li: any) => li.tax_rate_id)
          .map((li: any) => li.tax_rate_id),
      ),
    ];
    let taxRateNameMap = new Map<string, { name: string; rate: number }>();
    if (taxRateIds.length > 0) {
      const { data: taxRates } = await supabase
        .from(INV_TABLES.taxRates)
        .select("id, name, rate")
        .in("id", taxRateIds);
      taxRateNameMap = new Map(
        (taxRates || []).map((tr: any) => [
          tr.id,
          { name: tr.name, rate: tr.rate },
        ]),
      );
    }

    for (const li of lineItems || []) {
      const rateId = li.tax_rate_id || "default";
      if (!taxByRateMap.has(rateId)) {
        const info = taxRateNameMap.get(rateId);
        taxByRateMap.set(rateId, {
          name: info?.name || "Default Tax",
          rate: info?.rate || li.tax_rate || 1600,
          collected: 0,
          paid: 0,
        });
      }
      taxByRateMap.get(rateId)!.collected += li.tax_amount || 0;
    }
  }

  // Tax paid: from expenses with tax_amount
  const { data: expenses } = await supabase
    .from(INV_TABLES.expenses)
    .select("tax_amount, tax_rate_id, date")
    .eq("site_id", siteId)
    .in("status", ["approved", "paid"])
    .gte("date", start)
    .lte("date", end);

  const taxPaid = (expenses || []).reduce(
    (sum: number, e: any) => sum + (e.tax_amount || 0),
    0,
  );

  for (const exp of expenses || []) {
    if (exp.tax_amount > 0) {
      const rateId = exp.tax_rate_id || "expense_default";
      if (!taxByRateMap.has(rateId)) {
        taxByRateMap.set(rateId, {
          name: "Expense Tax",
          rate: 1600,
          collected: 0,
          paid: 0,
        });
      }
      taxByRateMap.get(rateId)!.paid += exp.tax_amount || 0;
    }
  }

  const byRate: TaxSummaryByRate[] = [...taxByRateMap.entries()].map(
    ([taxRateId, data]) => ({
      taxRateId,
      taxRateName: data.name,
      rate: data.rate,
      collected: data.collected,
      paid: data.paid,
      net: data.collected - data.paid,
    }),
  );

  // Filing period breakdown: group collected and paid taxes by month
  const filingPeriodMap = new Map<
    string,
    { collected: number; paid: number }
  >();

  for (const inv of paidInvoices || []) {
    const d = new Date(inv.issue_date || start);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    const existing = filingPeriodMap.get(key) || { collected: 0, paid: 0 };
    existing.collected += inv.tax_total || 0;
    filingPeriodMap.set(key, existing);
  }

  for (const exp of expenses || []) {
    if ((exp.tax_amount || 0) > 0) {
      const d = new Date(exp.date || start);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const existing = filingPeriodMap.get(key) || { collected: 0, paid: 0 };
      existing.paid += exp.tax_amount || 0;
      filingPeriodMap.set(key, existing);
    }
  }

  const byFilingPeriod: TaxFilingPeriod[] = [...filingPeriodMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, data]) => ({
      period,
      collected: data.collected,
      paid: data.paid,
      net: data.collected - data.paid,
    }));

  return {
    period: { start, end },
    taxCollected,
    taxPaid,
    netTaxOwed: taxCollected - taxPaid,
    byRate,
    byFilingPeriod,
  };
}

// ─── 7. Expense Report ─────────────────────────────────────────

export async function getExpenseReport(
  siteId: string,
  dateRange?: DateRange,
  groupBy: "category" | "vendor" | "month" = "category",
): Promise<ExpenseReport> {
  const supabase = await getModuleClient();
  const { start, end } = dateRange
    ? getDateRangeFilter(dateRange)
    : (() => {
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), 0, 1).toISOString(),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString(),
        };
      })();

  const { data: expenses } = await supabase
    .from(INV_TABLES.expenses)
    .select("id, amount, category_id, vendor_id, date, status")
    .eq("site_id", siteId)
    .in("status", ["approved", "paid"])
    .gte("date", start)
    .lte("date", end);

  const allExpenses = expenses || [];
  const totalExpenses = allExpenses.reduce(
    (s: number, e: any) => s + (e.amount || 0),
    0,
  );

  // By Category
  const categoryIds = [
    ...new Set(
      allExpenses
        .filter((e: any) => e.category_id)
        .map((e: any) => e.category_id),
    ),
  ];
  let catNameMap = new Map<string, string>();
  if (categoryIds.length > 0) {
    const { data: cats } = await supabase
      .from(INV_TABLES.expenseCategories)
      .select("id, name")
      .in("id", categoryIds);
    catNameMap = new Map((cats || []).map((c: any) => [c.id, c.name]));
  }

  const catMap = new Map<string, { amount: number; count: number }>();
  for (const exp of allExpenses) {
    const catId = exp.category_id || "uncategorized";
    const existing = catMap.get(catId) || { amount: 0, count: 0 };
    existing.amount += exp.amount || 0;
    existing.count++;
    catMap.set(catId, existing);
  }

  const byCategory: ExpenseByCategory[] = [...catMap.entries()]
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: catNameMap.get(categoryId) || "Uncategorized",
      amount: data.amount,
      count: data.count,
      percentage:
        totalExpenses > 0
          ? Math.round((data.amount / totalExpenses) * 10000) / 100
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // By Vendor
  const vendorIds = [
    ...new Set(
      allExpenses.filter((e: any) => e.vendor_id).map((e: any) => e.vendor_id),
    ),
  ];
  let vendorNameMap = new Map<string, string>();
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabase
      .from(INV_TABLES.vendors)
      .select("id, name")
      .in("id", vendorIds);
    vendorNameMap = new Map((vendors || []).map((v: any) => [v.id, v.name]));
  }

  const vendorMap = new Map<string, { amount: number; count: number }>();
  for (const exp of allExpenses) {
    const vId = exp.vendor_id || "unknown";
    const existing = vendorMap.get(vId) || { amount: 0, count: 0 };
    existing.amount += exp.amount || 0;
    existing.count++;
    vendorMap.set(vId, existing);
  }

  const byVendor: ExpenseByVendor[] = [...vendorMap.entries()]
    .map(([vendorId, data]) => ({
      vendorId,
      vendorName: vendorNameMap.get(vendorId) || "Unknown Vendor",
      amount: data.amount,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  // By Month
  const monthMap = new Map<string, { amount: number; count: number }>();
  for (const exp of allExpenses) {
    const d = new Date(exp.date);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    const existing = monthMap.get(key) || { amount: 0, count: 0 };
    existing.amount += exp.amount || 0;
    existing.count++;
    monthMap.set(key, existing);
  }

  const byMonth: ExpenseByMonth[] = [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({
      month,
      amount: data.amount,
      count: data.count,
    }));

  // Top 5 vendors by spend
  const topVendors = byVendor.slice(0, 5);

  // Budget comparison: compare actual spend per category against budgets
  // Uses the same budget data structure as getCategoryBudgetSpending
  const budgetComparison: ExpenseBudgetComparison[] = [];
  try {
    // Fetch budgets for all categories that have spending
    if (categoryIds.length > 0) {
      const { data: budgets } = await supabase
        .from(INV_TABLES.expenseCategories)
        .select("id, name, monthly_budget")
        .in("id", categoryIds);

      for (const budget of budgets || []) {
        if (budget.monthly_budget && budget.monthly_budget > 0) {
          const catSpend = catMap.get(budget.id);
          const spent = catSpend?.amount || 0;
          // Scale monthly budget to the number of months in the selected range
          const startDate = new Date(start);
          const endDate = new Date(end);
          const months = Math.max(
            1,
            (endDate.getFullYear() - startDate.getFullYear()) * 12 +
              (endDate.getMonth() - startDate.getMonth()) +
              1,
          );
          const scaledBudget = budget.monthly_budget * months;
          budgetComparison.push({
            categoryId: budget.id,
            categoryName: budget.name,
            monthlyBudget: budget.monthly_budget,
            spent,
            remaining: scaledBudget - spent,
            percentUsed:
              scaledBudget > 0
                ? Math.round((spent / scaledBudget) * 10000) / 100
                : 0,
            isOverBudget: spent > scaledBudget,
          });
        }
      }
    }
  } catch {
    // Budget comparison is non-critical
  }

  // Year-over-year comparison
  let yoyComparison: ExpenseReport["yoyComparison"] = null;
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const prevStart = new Date(startDate);
    prevStart.setFullYear(prevStart.getFullYear() - 1);
    const prevEnd = new Date(endDate);
    prevEnd.setFullYear(prevEnd.getFullYear() - 1);

    const { data: prevExpenses } = await supabase
      .from(INV_TABLES.expenses)
      .select("amount, date")
      .eq("site_id", siteId)
      .in("status", ["approved", "paid"])
      .gte("date", prevStart.toISOString())
      .lte("date", prevEnd.toISOString());

    const previousYearTotal = (prevExpenses || []).reduce(
      (s: number, e: any) => s + (e.amount || 0),
      0,
    );

    if (previousYearTotal > 0 || totalExpenses > 0) {
      // Group previous year by month
      const prevMonthMap = new Map<string, number>();
      for (const exp of prevExpenses || []) {
        const d = new Date(exp.date);
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        prevMonthMap.set(key, (prevMonthMap.get(key) || 0) + (exp.amount || 0));
      }
      const previousByMonth = [...prevMonthMap.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, amount]) => ({ month, amount }));

      yoyComparison = {
        previousYearTotal,
        changePercent:
          previousYearTotal > 0
            ? Math.round(
                ((totalExpenses - previousYearTotal) / previousYearTotal) *
                  10000,
              ) / 100
            : totalExpenses > 0
              ? 100
              : 0,
        previousByMonth,
      };
    }
  } catch {
    // YoY comparison is non-critical
  }

  return {
    period: { start, end },
    totalExpenses,
    byCategory,
    byVendor,
    byMonth,
    topVendors,
    budgetComparison,
    yoyComparison,
  };
}

// ─── 7b. Revenue Trends Comparison ─────────────────────────────

/**
 * Compare revenue between two periods with client segment analysis.
 * Returns current vs previous period totals, growth, period breakdowns,
 * and top-10 vs others client segments.
 */
export async function getRevenueTrendsComparison(
  siteId: string,
  dateRange: DateRange,
): Promise<RevenueTrendsComparison> {
  const supabase = await getModuleClient();
  const { start, end } = getDateRangeFilter(dateRange);

  // Calculate the equivalent previous period
  const startDate = new Date(start);
  const endDate = new Date(end);
  const durationMs = endDate.getTime() - startDate.getTime();
  const prevEnd = new Date(startDate.getTime() - 1); // 1ms before current start
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  // Current period payments
  const { data: currentPayments } = await supabase
    .from(INV_TABLES.payments)
    .select("amount, payment_date, invoice_id")
    .eq("site_id", siteId)
    .eq("type", "payment")
    .eq("status", "completed")
    .gte("payment_date", start)
    .lte("payment_date", end);

  // Previous period payments
  const { data: prevPayments } = await supabase
    .from(INV_TABLES.payments)
    .select("amount, payment_date")
    .eq("site_id", siteId)
    .eq("type", "payment")
    .eq("status", "completed")
    .gte("payment_date", prevStart.toISOString())
    .lte("payment_date", prevEnd.toISOString());

  const currentTotal = (currentPayments || []).reduce(
    (s: number, p: any) => s + (p.amount || 0),
    0,
  );
  const previousTotal = (prevPayments || []).reduce(
    (s: number, p: any) => s + (p.amount || 0),
    0,
  );
  const growthPercent =
    previousTotal > 0
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 10000) /
        100
      : currentTotal > 0
        ? 100
        : 0;

  // Group current period by month
  const currentMonthMap = new Map<string, number>();
  for (const p of currentPayments || []) {
    const d = new Date(p.payment_date);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    currentMonthMap.set(key, (currentMonthMap.get(key) || 0) + (p.amount || 0));
  }
  const currentByPeriod = [...currentMonthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, amount]) => ({ period, amount }));

  // Group previous period by month
  const prevMonthMap = new Map<string, number>();
  for (const p of prevPayments || []) {
    const d = new Date(p.payment_date);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    prevMonthMap.set(key, (prevMonthMap.get(key) || 0) + (p.amount || 0));
  }
  const previousByPeriod = [...prevMonthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, amount]) => ({ period, amount }));

  // Client segment analysis: top 10 vs rest
  const invoiceIdSet = new Set<string>();
  for (const p of currentPayments || []) {
    if (p.invoice_id) invoiceIdSet.add(p.invoice_id as string);
  }
  const invoiceIds = [...invoiceIdSet];

  let clientSegments = {
    top10Revenue: 0,
    top10Count: 0,
    otherRevenue: 0,
    otherCount: 0,
  };

  if (invoiceIds.length > 0) {
    // Batch invoice lookups in chunks of 100 to stay within Supabase limits
    const chunks: string[][] = [];
    for (let i = 0; i < invoiceIds.length; i += 100) {
      chunks.push(invoiceIds.slice(i, i + 100));
    }

    const clientRevenueMap = new Map<string, number>();
    for (const chunk of chunks) {
      const { data: invoiceClients } = await supabase
        .from(INV_TABLES.invoices)
        .select("id, contact_id, client_name")
        .in("id", chunk);

      const invoiceClientMap = new Map<string, string>();
      for (const inv of invoiceClients || []) {
        invoiceClientMap.set(
          inv.id,
          inv.contact_id || inv.client_name || "unknown",
        );
      }

      for (const p of currentPayments || []) {
        if (chunk.includes(p.invoice_id)) {
          const clientKey = invoiceClientMap.get(p.invoice_id) || "unknown";
          clientRevenueMap.set(
            clientKey,
            (clientRevenueMap.get(clientKey) || 0) + (p.amount || 0),
          );
        }
      }
    }

    const sortedClients = [...clientRevenueMap.entries()].sort(
      (a, b) => b[1] - a[1],
    );
    const top10 = sortedClients.slice(0, 10);
    const rest = sortedClients.slice(10);

    clientSegments = {
      top10Revenue: top10.reduce((s, [, amt]) => s + amt, 0),
      top10Count: top10.length,
      otherRevenue: rest.reduce((s, [, amt]) => s + amt, 0),
      otherCount: rest.length,
    };
  }

  return {
    currentTotal,
    previousTotal,
    growthPercent,
    currentByPeriod,
    previousByPeriod,
    clientSegments,
  };
}

// ─── 8. Top Clients ────────────────────────────────────────────

export async function getTopClients(
  siteId: string,
  limit: number = 10,
  dateRange?: DateRange,
): Promise<TopClient[]> {
  const supabase = await getModuleClient();

  // Get all non-draft/void invoices (optionally filtered by date)
  let query = supabase
    .from(INV_TABLES.invoices)
    .select(
      "id, contact_id, client_name, total, amount_due, amount_paid, status",
    )
    .eq("site_id", siteId)
    .not("status", "in", '("draft","void","cancelled")');

  if (dateRange?.start && dateRange?.end) {
    query = query
      .gte("issue_date", dateRange.start)
      .lte("issue_date", dateRange.end);
  }

  const { data: invoices } = await query;

  const clientMap = new Map<
    string,
    {
      clientName: string;
      contactId: string;
      totalInvoiced: number;
      totalPaid: number;
      outstanding: number;
      invoiceCount: number;
    }
  >();

  for (const inv of invoices || []) {
    const key = inv.contact_id || inv.client_name || "Unknown";
    if (!clientMap.has(key)) {
      clientMap.set(key, {
        clientName: inv.client_name || "Unknown Client",
        contactId: inv.contact_id || "",
        totalInvoiced: 0,
        totalPaid: 0,
        outstanding: 0,
        invoiceCount: 0,
      });
    }
    const client = clientMap.get(key)!;
    client.totalInvoiced += inv.total || 0;
    client.totalPaid += inv.amount_paid || 0;
    client.outstanding += inv.amount_due || 0;
    client.invoiceCount++;
  }

  return [...clientMap.values()]
    .sort((a, b) => b.totalInvoiced - a.totalInvoiced)
    .slice(0, limit);
}

// ─── 9. Payment Method Distribution ────────────────────────────

export async function getPaymentMethodDistribution(
  siteId: string,
  dateRange?: DateRange,
): Promise<PaymentMethodDistribution[]> {
  const supabase = await getModuleClient();

  let query = supabase
    .from(INV_TABLES.payments)
    .select("payment_method, amount")
    .eq("site_id", siteId)
    .eq("type", "payment")
    .eq("status", "completed");

  if (dateRange?.start && dateRange?.end) {
    query = query
      .gte("payment_date", dateRange.start)
      .lte("payment_date", dateRange.end);
  }

  const { data: payments } = await query;

  const methodMap = new Map<string, { amount: number; count: number }>();
  for (const p of payments || []) {
    const method = p.payment_method || "other";
    const existing = methodMap.get(method) || { amount: 0, count: 0 };
    existing.amount += p.amount || 0;
    existing.count++;
    methodMap.set(method, existing);
  }

  const PAYMENT_METHOD_COLORS: Record<string, string> = {
    bank_transfer: "#3b82f6",
    cash: "#22c55e",
    mobile_money: "#f59e0b",
    card: "#8b5cf6",
    cheque: "#6b7280",
    paypal: "#0070ba",
    online: "#06b6d4",
    other: "#9ca3af",
  };

  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    mobile_money: "Mobile Money",
    card: "Card",
    cheque: "Cheque",
    paypal: "PayPal",
    online: "Online",
    other: "Other",
  };

  return [...methodMap.entries()]
    .map(([method, data]) => ({
      method,
      label: PAYMENT_METHOD_LABELS[method] || method,
      amount: data.amount,
      count: data.count,
      color: PAYMENT_METHOD_COLORS[method] || "#9ca3af",
    }))
    .sort((a, b) => b.amount - a.amount);
}

// ─── 10. Invoice Status Distribution ───────────────────────────

export async function getInvoiceStatusDistribution(
  siteId: string,
): Promise<InvoiceStatusDistribution[]> {
  const supabase = await getModuleClient();

  const { data: invoices } = await supabase
    .from(INV_TABLES.invoices)
    .select("status, total")
    .eq("site_id", siteId);

  const statusMap = new Map<string, { count: number; amount: number }>();
  for (const inv of invoices || []) {
    const status = inv.status || "draft";
    const existing = statusMap.get(status) || { count: 0, amount: 0 };
    existing.count++;
    existing.amount += inv.total || 0;
    statusMap.set(status, existing);
  }

  const STATUS_COLORS: Record<string, string> = {
    draft: "#9ca3af",
    sent: "#3b82f6",
    viewed: "#6366f1",
    partial: "#f59e0b",
    paid: "#22c55e",
    overdue: "#ef4444",
    void: "#6b7280",
    cancelled: "#dc2626",
  };

  const STATUS_LABELS: Record<string, string> = {
    draft: "Draft",
    sent: "Sent",
    viewed: "Viewed",
    partial: "Partial",
    paid: "Paid",
    overdue: "Overdue",
    void: "Void",
    cancelled: "Cancelled",
  };

  return [...statusMap.entries()]
    .map(([status, data]) => ({
      status,
      label: STATUS_LABELS[status] || status,
      count: data.count,
      amount: data.amount,
      color: STATUS_COLORS[status] || "#9ca3af",
    }))
    .sort((a, b) => b.count - a.count);
}

// ─── CSV Export Utility ────────────────────────────────────────

export async function exportReportCSV(
  reportType: "pnl" | "aging" | "tax" | "expenses" | "top_clients",
  siteId: string,
  dateRange?: DateRange,
): Promise<string> {
  switch (reportType) {
    case "pnl": {
      const data = await getProfitAndLoss(siteId, dateRange);
      const rows = [
        ["Profit & Loss Statement"],
        [`Period: ${data.period.start} to ${data.period.end}`],
        [],
        ["INCOME"],
        ["Category", "Amount (K)"],
        ...data.income.byCategory.map((c) => [
          c.category,
          (c.amount / 100).toFixed(2),
        ]),
        ["Total Income", (data.income.total / 100).toFixed(2)],
        [],
        ["EXPENSES"],
        ["Category", "Amount (K)"],
        ...data.expenses.byCategory.map((c) => [
          c.category,
          (c.amount / 100).toFixed(2),
        ]),
        ["Total Expenses", (data.expenses.total / 100).toFixed(2)],
        [],
        ["Net Profit", (data.netProfit / 100).toFixed(2)],
        ["Profit Margin", `${data.netProfitMargin}%`],
      ];
      return serializeCsv(rows);
    }

    case "aging": {
      const data = await getARAgingReport(siteId);
      const rows = [
        ["Accounts Receivable Aging Report"],
        [],
        [
          "Client",
          "Current (K)",
          "1-30 Days (K)",
          "31-60 Days (K)",
          "61-90 Days (K)",
          "90+ Days (K)",
          "Total (K)",
        ],
        ...data.byClient.map((c) => [
          c.clientName,
          (c.current / 100).toFixed(2),
          (c.days1to30 / 100).toFixed(2),
          (c.days31to60 / 100).toFixed(2),
          (c.days61to90 / 100).toFixed(2),
          (c.days90plus / 100).toFixed(2),
          (c.total / 100).toFixed(2),
        ]),
        [
          "TOTAL",
          (data.summary.current / 100).toFixed(2),
          (data.summary.days1to30 / 100).toFixed(2),
          (data.summary.days31to60 / 100).toFixed(2),
          (data.summary.days61to90 / 100).toFixed(2),
          (data.summary.days90plus / 100).toFixed(2),
          (data.summary.total / 100).toFixed(2),
        ],
      ];
      return serializeCsv(rows);
    }

    case "tax": {
      const data = await getTaxSummary(siteId, dateRange);
      const rows = [
        ["Tax Summary Report"],
        [`Period: ${data.period.start} to ${data.period.end}`],
        [],
        ["Tax Rate", "Rate (%)", "Collected (K)", "Paid (K)", "Net (K)"],
        ...data.byRate.map((r) => [
          r.taxRateName,
          (r.rate / 100).toFixed(2),
          (r.collected / 100).toFixed(2),
          (r.paid / 100).toFixed(2),
          (r.net / 100).toFixed(2),
        ]),
        [],
        ["Total Collected", (data.taxCollected / 100).toFixed(2)],
        ["Total Paid", (data.taxPaid / 100).toFixed(2)],
        ["Net Tax Owed", (data.netTaxOwed / 100).toFixed(2)],
      ];
      return serializeCsv(rows);
    }

    case "expenses": {
      const data = await getExpenseReport(siteId, dateRange);
      const rows = [
        ["Expense Report"],
        [`Period: ${data.period.start} to ${data.period.end}`],
        [],
        ["Category", "Amount (K)", "Count", "% of Total"],
        ...data.byCategory.map((c) => [
          c.categoryName,
          (c.amount / 100).toFixed(2),
          c.count.toString(),
          `${c.percentage}%`,
        ]),
        [],
        ["Total Expenses", (data.totalExpenses / 100).toFixed(2)],
      ];
      return serializeCsv(rows);
    }

    case "top_clients": {
      const data = await getTopClients(siteId, 50, dateRange);
      const rows = [
        ["Top Clients by Revenue"],
        [],
        [
          "Client",
          "Total Invoiced (K)",
          "Total Paid (K)",
          "Outstanding (K)",
          "Invoices",
        ],
        ...data.map((c) => [
          c.clientName,
          (c.totalInvoiced / 100).toFixed(2),
          (c.totalPaid / 100).toFixed(2),
          (c.outstanding / 100).toFixed(2),
          c.invoiceCount.toString(),
        ]),
      ];
      return serializeCsv(rows);
    }

    default:
      return "";
  }
}

// ─── Recent Invoices (for dashboard widget) ────────────────────

export async function fetchRecentInvoices(siteId: string) {
  const supabase = await getModuleClient();
  const { data } = await supabase
    .from(INV_TABLES.invoices)
    .select("id, invoice_number, client_name, total, status, issue_date")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!data) return [];
  return (data as any[]).map((r) => ({
    id: r.id as string,
    invoiceNumber: r.invoice_number as string,
    clientName: (r.client_name || "Unknown Client") as string,
    total: (r.total ?? 0) as number,
    status: r.status as string,
    issueDate: r.issue_date as string,
  }));
}

// ─── Cross-Module Revenue Report (INVFIX-08) ──────────────────

export async function getCrossModuleRevenue(
  siteId: string,
  dateRange?: DateRange,
): Promise<CrossModuleRevenue> {
  const supabase = await getModuleClient();
  const { start, end } = getDateRangeFilter(dateRange);

  // 1. Invoicing revenue (completed payments)
  const { data: invPayments } = await supabase
    .from(INV_TABLES.payments)
    .select("amount, payment_date")
    .eq("site_id", siteId)
    .eq("type", "payment")
    .eq("status", "completed")
    .gte("payment_date", start)
    .lte("payment_date", end);

  // 2. E-commerce revenue (paid/completed orders)
  const { data: ecomOrders } = await supabase
    .from("mod_ecommod01_orders")
    .select("total, created_at")
    .eq("site_id", siteId)
    .in("payment_status", ["paid", "completed"])
    .gte("created_at", start)
    .lte("created_at", end);

  // 3. Booking revenue (paid appointments)
  const { data: bookings } = await supabase
    .from("mod_bookmod01_appointments")
    .select("payment_amount, start_time")
    .eq("site_id", siteId)
    .eq("payment_status", "paid")
    .gte("start_time", start)
    .lte("start_time", end);

  const invTotal = (invPayments || []).reduce(
    (s: number, p: any) => s + (p.amount || 0),
    0,
  );
  const ecomTotal = (ecomOrders || []).reduce(
    (s: number, o: any) => s + (o.total || 0),
    0,
  );
  const bookTotal = (bookings || []).reduce(
    (s: number, b: any) => s + (b.payment_amount || 0),
    0,
  );

  const bySource: RevenueBySource[] = [
    {
      source: "invoicing",
      label: "Invoicing",
      amount: invTotal,
      count: (invPayments || []).length,
      color: "#3b82f6",
    },
    {
      source: "ecommerce",
      label: "E-Commerce",
      amount: ecomTotal,
      count: (ecomOrders || []).length,
      color: "#22c55e",
    },
    {
      source: "booking",
      label: "Bookings",
      amount: bookTotal,
      count: (bookings || []).length,
      color: "#f59e0b",
    },
  ];

  // Build monthly breakdown
  const periodMap = new Map<
    string,
    { invoicing: number; ecommerce: number; booking: number }
  >();

  for (const p of invPayments || []) {
    const month = (p.payment_date as string).substring(0, 7);
    const entry = periodMap.get(month) || {
      invoicing: 0,
      ecommerce: 0,
      booking: 0,
    };
    entry.invoicing += p.amount || 0;
    periodMap.set(month, entry);
  }
  for (const o of ecomOrders || []) {
    const month = (o.created_at as string).substring(0, 7);
    const entry = periodMap.get(month) || {
      invoicing: 0,
      ecommerce: 0,
      booking: 0,
    };
    entry.ecommerce += o.total || 0;
    periodMap.set(month, entry);
  }
  for (const b of bookings || []) {
    const month = (b.start_time as string).substring(0, 7);
    const entry = periodMap.get(month) || {
      invoicing: 0,
      ecommerce: 0,
      booking: 0,
    };
    entry.booking += b.payment_amount || 0;
    periodMap.set(month, entry);
  }

  const byPeriod: CrossModulePeriodEntry[] = [...periodMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => ({
      period,
      invoicing: data.invoicing,
      ecommerce: data.ecommerce,
      booking: data.booking,
      total: data.invoicing + data.ecommerce + data.booking,
    }));

  return {
    period: { start, end },
    totalRevenue: invTotal + ecomTotal + bookTotal,
    bySource,
    byPeriod,
  };
}

// ─── Cross-Module Client Report (INVFIX-08) ───────────────────

export async function getCrossModuleClients(
  siteId: string,
  dateRange?: DateRange,
  limit = 50,
): Promise<CrossModuleClientReport> {
  const supabase = await getModuleClient();
  const { start, end } = getDateRangeFilter(dateRange);

  // 1. Invoicing: revenue per client
  const { data: invData } = await supabase
    .from(INV_TABLES.invoices)
    .select("client_name, client_email, total, status, created_at")
    .eq("site_id", siteId)
    .gte("created_at", start)
    .lte("created_at", end);

  // 2. E-commerce: revenue per customer
  const { data: ecomData } = await supabase
    .from("mod_ecommod01_orders")
    .select("customer_name, customer_email, total, created_at")
    .eq("site_id", siteId)
    .in("payment_status", ["paid", "completed"])
    .gte("created_at", start)
    .lte("created_at", end);

  // 3. Booking: revenue per customer
  const { data: bookData } = await supabase
    .from("mod_bookmod01_appointments")
    .select("customer_name, customer_email, payment_amount, start_time")
    .eq("site_id", siteId)
    .eq("payment_status", "paid")
    .gte("start_time", start)
    .lte("start_time", end);

  // Merge by email (normalize to lowercase)
  const clientMap = new Map<
    string,
    {
      name: string;
      email: string;
      invRevenue: number;
      ecomRevenue: number;
      bookRevenue: number;
      invCount: number;
      ecomCount: number;
      bookCount: number;
      lastActivity: string;
    }
  >();

  function upsert(
    email: string,
    name: string,
    source: "inv" | "ecom" | "book",
    amount: number,
    date: string,
  ) {
    const key = (email || name || "unknown").toLowerCase().trim();
    const existing = clientMap.get(key) || {
      name: name || "Unknown",
      email: email || "",
      invRevenue: 0,
      ecomRevenue: 0,
      bookRevenue: 0,
      invCount: 0,
      ecomCount: 0,
      bookCount: 0,
      lastActivity: "",
    };
    if (name && existing.name === "Unknown") existing.name = name;
    if (email && !existing.email) existing.email = email;
    if (source === "inv") {
      existing.invRevenue += amount;
      existing.invCount++;
    } else if (source === "ecom") {
      existing.ecomRevenue += amount;
      existing.ecomCount++;
    } else {
      existing.bookRevenue += amount;
      existing.bookCount++;
    }
    if (date > existing.lastActivity) existing.lastActivity = date;
    clientMap.set(key, existing);
  }

  for (const inv of invData || []) {
    if (inv.status === "void" || inv.status === "cancelled") continue;
    upsert(
      inv.client_email,
      inv.client_name,
      "inv",
      inv.total || 0,
      inv.created_at || "",
    );
  }
  for (const o of ecomData || []) {
    upsert(
      o.customer_email,
      o.customer_name,
      "ecom",
      o.total || 0,
      o.created_at || "",
    );
  }
  for (const b of bookData || []) {
    upsert(
      b.customer_email,
      b.customer_name,
      "book",
      b.payment_amount || 0,
      b.start_time || "",
    );
  }

  const rankedClients = [...clientMap.values()]
    .map((c) => ({
      clientName: c.name,
      clientEmail: c.email,
      invoicingRevenue: c.invRevenue,
      ecommerceRevenue: c.ecomRevenue,
      bookingRevenue: c.bookRevenue,
      totalRevenue: c.invRevenue + c.ecomRevenue + c.bookRevenue,
      invoiceCount: c.invCount,
      orderCount: c.ecomCount,
      bookingCount: c.bookCount,
      lastActivity: c.lastActivity,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalRevenue = rankedClients.reduce((sum, client) => {
    return sum + client.totalRevenue;
  }, 0);

  return {
    clients: rankedClients.slice(0, limit),
    totalClients: clientMap.size,
    totalRevenue,
  };
}

// ─── Cross-Module CSV Export (INVFIX-08) ───────────────────────

export async function exportCrossModuleCSV(
  reportType: "revenue" | "clients",
  siteId: string,
  dateRange?: DateRange,
): Promise<string> {
  if (reportType === "revenue") {
    const data = await getCrossModuleRevenue(siteId, dateRange);
    const rows = [
      ["Cross-Module Revenue Report"],
      [`Period: ${data.period.start} to ${data.period.end}`],
      [],
      ["Source", "Revenue (K)", "Transactions"],
      ...data.bySource.map((s) => [
        s.label,
        (s.amount / 100).toFixed(2),
        s.count.toString(),
      ]),
      ["Total", (data.totalRevenue / 100).toFixed(2), ""],
      [],
      ["Monthly Breakdown"],
      ["Month", "Invoicing (K)", "E-Commerce (K)", "Bookings (K)", "Total (K)"],
      ...data.byPeriod.map((p) => [
        p.period,
        (p.invoicing / 100).toFixed(2),
        (p.ecommerce / 100).toFixed(2),
        (p.booking / 100).toFixed(2),
        (p.total / 100).toFixed(2),
      ]),
    ];
    return serializeCsv(rows);
  }

  const data = await getCrossModuleClients(siteId, dateRange, 100);
  const rows = [
    ["Cross-Module Client Report"],
    [],
    [
      "Client",
      "Email",
      "Invoicing (K)",
      "E-Commerce (K)",
      "Bookings (K)",
      "Total (K)",
      "Invoices",
      "Orders",
      "Bookings",
      "Last Activity",
    ],
    ...data.clients.map((c) => [
      c.clientName,
      c.clientEmail,
      (c.invoicingRevenue / 100).toFixed(2),
      (c.ecommerceRevenue / 100).toFixed(2),
      (c.bookingRevenue / 100).toFixed(2),
      (c.totalRevenue / 100).toFixed(2),
      c.invoiceCount.toString(),
      c.orderCount.toString(),
      c.bookingCount.toString(),
      c.lastActivity,
    ]),
  ];
  return serializeCsv(rows);
}
