// src/lib/revenue/revenue-service.ts
// Phase EM-43: Revenue Sharing Dashboard - Revenue Service

import { createClient } from "@supabase/supabase-js";

// Use service role client for backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SaleRecord {
  id: string;
  module_id: string;
  developer_id: string;
  buyer_id: string;
  agency_id?: string;
  site_id?: string;
  transaction_type: string;
  gross_amount: number;
  platform_fee: number;
  developer_amount: number;
  currency: string;
  paddle_transaction_id?: string;
  paddle_invoice_id?: string;
  paddle_subscription_id?: string;
  status: string;
  refund_reason?: string;
  refund_amount?: number;
  refunded_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  module?: { name: string; icon?: string };
  buyer?: { name?: string; email: string };
}

export interface EarningsSummary {
  totalEarnings: number;
  pendingBalance: number;
  totalPaidOut: number;
  thisMonth: number;
  lastMonth: number;
  growthPercent: number;
}

export interface RevenueAnalytics {
  data: Array<{ date: string; revenue: number; sales: number }>;
  totals: { revenue: number; sales: number; avgOrderValue: number };
  topModules: Array<{ moduleId: string; name: string; revenue: number; sales: number }>;
  byCountry: Array<{ country: string; revenue: number; sales: number }>;
}

export class RevenueService {
  /**
   * Record a sale
   */
  async recordSale(params: {
    moduleId: string;
    buyerId: string;
    agencyId?: string;
    siteId?: string;
    transactionType: string;
    grossAmount: number;
    paddleTransactionId?: string;
    paddleInvoiceId?: string;
    paddleSubscriptionId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<SaleRecord> {
    // Get module and developer
    const { data: module } = await supabase
      .from("modules")
      .select(
        `
        id,
        created_by,
        revenue_config:module_revenue_config(platform_fee_percent, developer_share_percent)
      `
      )
      .eq("id", params.moduleId)
      .single();

    if (!module) throw new Error("Module not found");

    // Get developer profile
    const { data: developer } = await supabase
      .from("developer_profiles")
      .select("id")
      .eq("user_id", module.created_by)
      .single();

    if (!developer) throw new Error("Developer profile not found");

    // Calculate amounts
    const revenueConfig = Array.isArray(module.revenue_config) 
      ? module.revenue_config[0] 
      : module.revenue_config;
    const platformFeePercent = revenueConfig?.platform_fee_percent || 30;
    const platformFee =
      Math.round(params.grossAmount * (platformFeePercent / 100) * 100) / 100;
    const developerAmount = params.grossAmount - platformFee;

    // Insert sale
    const { data, error } = await supabase
      .from("module_sales")
      .insert({
        module_id: params.moduleId,
        developer_id: developer.id,
        buyer_id: params.buyerId,
        agency_id: params.agencyId,
        site_id: params.siteId,
        transaction_type: params.transactionType,
        gross_amount: params.grossAmount,
        platform_fee: platformFee,
        developer_amount: developerAmount,
        paddle_transaction_id: params.paddleTransactionId,
        paddle_invoice_id: params.paddleInvoiceId,
        paddle_subscription_id: params.paddleSubscriptionId,
        metadata: params.metadata,
        status: "completed",
      })
      .select()
      .single();

    if (error) throw error;

    // Update daily analytics
    await this.updateDailyAnalytics(
      developer.id,
      params.moduleId,
      developerAmount
    );

    return data;
  }

  /**
   * Process a refund
   */
  async processRefund(
    saleId: string,
    amount: number,
    reason: string
  ): Promise<void> {
    const { data: sale } = await supabase
      .from("module_sales")
      .select("*")
      .eq("id", saleId)
      .single();

    if (!sale) throw new Error("Sale not found");
    if (sale.status === "refunded") throw new Error("Already refunded");

    // Calculate refund proportions
    const refundPercent = amount / sale.gross_amount;
    const developerRefund =
      Math.round(sale.developer_amount * refundPercent * 100) / 100;

    // Refund processed via Paddle API webhook — no direct call needed here

    // Update sale record
    await supabase
      .from("module_sales")
      .update({
        status: "refunded",
        refund_reason: reason,
        refund_amount: amount,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", saleId);

    // Update analytics
    const today = new Date().toISOString().split("T")[0];
    await supabase.rpc("update_refund_analytics", {
      p_developer_id: sale.developer_id,
      p_module_id: sale.module_id,
      p_date: today,
      p_refund_amount: developerRefund,
    });
  }

  /**
   * Get earnings summary for developer
   */
  async getEarningsSummary(developerId: string): Promise<EarningsSummary> {
    const { data: account } = await supabase
      .from("developer_payout_accounts")
      .select("total_earnings, pending_balance, total_paid_out")
      .eq("developer_id", developerId)
      .single();

    if (!account) {
      return {
        totalEarnings: 0,
        pendingBalance: 0,
        totalPaidOut: 0,
        thisMonth: 0,
        lastMonth: 0,
        growthPercent: 0,
      };
    }

    // Get this month's earnings
    const now = new Date();
    const thisMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();
    const lastMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    ).toISOString();
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0
    ).toISOString();

    const { data: thisMonthData } = await supabase
      .from("module_sales")
      .select("developer_amount")
      .eq("developer_id", developerId)
      .eq("status", "completed")
      .gte("created_at", thisMonthStart);

    const { data: lastMonthData } = await supabase
      .from("module_sales")
      .select("developer_amount")
      .eq("developer_id", developerId)
      .eq("status", "completed")
      .gte("created_at", lastMonthStart)
      .lte("created_at", lastMonthEnd);

    const thisMonth =
      thisMonthData?.reduce((sum, s) => sum + (s.developer_amount || 0), 0) || 0;
    const lastMonth =
      lastMonthData?.reduce((sum, s) => sum + (s.developer_amount || 0), 0) || 0;

    const growthPercent =
      lastMonth > 0
        ? ((thisMonth - lastMonth) / lastMonth) * 100
        : thisMonth > 0
          ? 100
          : 0;

    return {
      totalEarnings: account.total_earnings || 0,
      pendingBalance: account.pending_balance || 0,
      totalPaidOut: account.total_paid_out || 0,
      thisMonth,
      lastMonth,
      growthPercent,
    };
  }

  /**
   * Get sales history
   */
  async getSalesHistory(
    developerId: string,
    options: {
      moduleId?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ sales: SaleRecord[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const from = (page - 1) * limit;

    let query = supabase
      .from("module_sales")
      .select(
        `
        *,
        module:modules(name, icon)
      `,
        { count: "exact" }
      )
      .eq("developer_id", developerId);

    if (options.moduleId) {
      query = query.eq("module_id", options.moduleId);
    }

    if (options.startDate) {
      query = query.gte("created_at", options.startDate);
    }

    if (options.endDate) {
      query = query.lte("created_at", options.endDate);
    }

    if (options.status) {
      query = query.eq("status", options.status);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      sales: (data || []) as SaleRecord[],
      total: count || 0,
    };
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(
    developerId: string,
    options: {
      moduleId?: string;
      startDate: string;
      endDate: string;
      groupBy?: "day" | "week" | "month";
    }
  ): Promise<RevenueAnalytics> {
    let query = supabase
      .from("revenue_analytics_daily")
      .select("*")
      .eq("developer_id", developerId)
      .gte("date", options.startDate)
      .lte("date", options.endDate);

    if (options.moduleId) {
      query = query.eq("module_id", options.moduleId);
    }

    const { data: analytics, error } = await query.order("date");

    if (error) throw error;

    // Aggregate data
    const dailyData: Record<string, { revenue: number; sales: number }> = {};
    const moduleData: Record<
      string,
      { name: string; revenue: number; sales: number }
    > = {};
    const countryData: Record<string, { revenue: number; sales: number }> = {};
    let totalRevenue = 0;
    let totalSales = 0;

    (analytics || []).forEach((a) => {
      // Daily aggregation
      if (!dailyData[a.date]) {
        dailyData[a.date] = { revenue: 0, sales: 0 };
      }
      dailyData[a.date].revenue += a.net_revenue || 0;
      dailyData[a.date].sales += a.sales_count || 0;

      // Module aggregation
      if (a.module_id) {
        if (!moduleData[a.module_id]) {
          moduleData[a.module_id] = { name: "", revenue: 0, sales: 0 };
        }
        moduleData[a.module_id].revenue += a.net_revenue || 0;
        moduleData[a.module_id].sales += a.sales_count || 0;
      }

      // Country aggregation
      if (a.by_country) {
        Object.entries(a.by_country as Record<string, number>).forEach(
          ([country, amount]) => {
            if (!countryData[country]) {
              countryData[country] = { revenue: 0, sales: 0 };
            }
            countryData[country].revenue += amount;
            countryData[country].sales += 1;
          }
        );
      }

      totalRevenue += a.net_revenue || 0;
      totalSales += a.sales_count || 0;
    });

    // Get module names
    const moduleIds = Object.keys(moduleData);
    if (moduleIds.length > 0) {
      const { data: modules } = await supabase
        .from("modules")
        .select("id, name")
        .in("id", moduleIds);

      modules?.forEach((m) => {
        if (moduleData[m.id]) {
          moduleData[m.id].name = m.name;
        }
      });
    }

    return {
      data: Object.entries(dailyData).map(([date, d]) => ({
        date,
        revenue: d.revenue,
        sales: d.sales,
      })),
      totals: {
        revenue: totalRevenue,
        sales: totalSales,
        avgOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0,
      },
      topModules: Object.entries(moduleData)
        .map(([moduleId, d]) => ({ moduleId, ...d }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      byCountry: Object.entries(countryData)
        .map(([country, d]) => ({ country, ...d }))
        .sort((a, b) => b.revenue - a.revenue),
    };
  }

  /**
   * Update daily analytics cache
   */
  private async updateDailyAnalytics(
    developerId: string,
    moduleId: string,
    amount: number
  ): Promise<void> {
    const today = new Date().toISOString().split("T")[0];

    await supabase.rpc("upsert_revenue_analytics", {
      p_developer_id: developerId,
      p_module_id: moduleId,
      p_date: today,
      p_sale_amount: amount,
    });
  }

  /**
   * Get developer profile by user ID
   */
  async getDeveloperProfile(userId: string): Promise<{ id: string } | null> {
    const { data } = await supabase
      .from("developer_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    return data;
  }
}

// Export singleton instance
export const revenueService = new RevenueService();
