// src/lib/revenue/payout-service.ts
// Phase EM-43: Revenue Sharing Dashboard - Payout Service

import { createClient } from "@supabase/supabase-js";
import { DEFAULT_CURRENCY_SYMBOL } from "@/lib/locale-config";

// Use service role client for backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PayoutAccount {
  id: string;
  developer_id: string;
  payout_method: string | null;
  payout_account_status: string;
  payout_setup_complete: boolean;
  payout_frequency: string;
  payout_threshold: number;
  payout_currency: string;
  tax_form_type: string | null;
  tax_form_submitted_at: string | null;
  tax_form_verified: boolean;
  tax_id_last4: string | null;
  total_earnings: number;
  total_paid_out: number;
  pending_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  developer_id: string;
  payout_account_id: string;
  period_start: string;
  period_end: string;
  gross_earnings: number;
  platform_fees: number;
  net_earnings: number;
  refunds: number;
  adjustments: number;
  payout_amount: number;
  currency: string;
  status: string;
  transfer_reference: string | null;
  payout_reference: string | null;
  scheduled_at: string | null;
  processed_at: string | null;
  failed_reason: string | null;
  statement_url: string | null;
  created_at: string;
}

export interface PayoutLineItem {
  id: string;
  payout_id: string;
  sale_id: string;
  description: string;
  amount: number;
  created_at: string;
}

export class PayoutService {
  /**
   * Create or get payout account
   */
  async createPayoutAccount(developerId: string, method: string): Promise<string> {
    const { data: existing } = await supabase
      .from("developer_payout_accounts")
      .select("id")
      .eq("developer_id", developerId)
      .single();

    if (existing?.id) return existing.id;

    const { data, error } = await supabase
      .from("developer_payout_accounts")
      .insert({
        developer_id: developerId,
        payout_method: method,
        payout_account_status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Set up payout method for developer
   */
  async setupPayoutMethod(developerId: string, method: string, details: Record<string, string>): Promise<void> {
    await supabase
      .from("developer_payout_accounts")
      .upsert({
        developer_id: developerId,
        payout_method: method,
        payout_account_status: "active",
        payout_setup_complete: true,
        updated_at: new Date().toISOString(),
      });
  }

  /**
   * Check payout account status
   */
  async refreshAccountStatus(developerId: string): Promise<string> {
    const { data: account } = await supabase
      .from("developer_payout_accounts")
      .select("payout_account_status")
      .eq("developer_id", developerId)
      .single();

    return account?.payout_account_status || "not_connected";
  }

  /**
   * Get payout account details
   */
  async getPayoutAccount(developerId: string): Promise<PayoutAccount | null> {
    const { data, error } = await supabase
      .from("developer_payout_accounts")
      .select("*")
      .eq("developer_id", developerId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Create payout account if not exists
   */
  async ensurePayoutAccount(developerId: string): Promise<PayoutAccount> {
    const existingAccount = await this.getPayoutAccount(developerId);

    if (existingAccount) {
      return existingAccount;
    }

    const { data, error } = await supabase
      .from("developer_payout_accounts")
      .insert({
        developer_id: developerId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PayoutAccount;
  }

  /**
   * Update payout preferences
   */
  async updatePayoutPreferences(
    developerId: string,
    preferences: {
      payout_frequency?: string;
      payout_threshold?: number;
      payout_currency?: string;
    }
  ): Promise<void> {
    await supabase
      .from("developer_payout_accounts")
      .update({
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .eq("developer_id", developerId);
  }

  /**
   * Create a payout
   */
  async createPayout(
    developerId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<Payout> {
    // Get account
    const account = await this.getPayoutAccount(developerId);

    if (!account) throw new Error("Payout account not found");
    if (account.payout_account_status !== "active") {
      throw new Error("Payout account not active");
    }

    // Calculate earnings for period
    const { data: sales } = await supabase
      .from("module_sales")
      .select("id, gross_amount, platform_fee, developer_amount, refund_amount")
      .eq("developer_id", developerId)
      .eq("status", "completed")
      .gte("created_at", periodStart)
      .lte("created_at", periodEnd);

    const totals = (sales || []).reduce(
      (acc, s) => ({
        gross: acc.gross + (s.gross_amount || 0),
        fees: acc.fees + (s.platform_fee || 0),
        net: acc.net + (s.developer_amount || 0),
        refunds: acc.refunds + (s.refund_amount || 0),
      }),
      { gross: 0, fees: 0, net: 0, refunds: 0 }
    );

    const payoutAmount = totals.net - totals.refunds;

    if (payoutAmount < account.payout_threshold) {
      throw new Error(
        `Amount below threshold of ${DEFAULT_CURRENCY_SYMBOL}${account.payout_threshold}`
      );
    }

    // Create payout record
    const { data: payout, error } = await supabase
      .from("developer_payouts")
      .insert({
        developer_id: developerId,
        payout_account_id: account.id,
        period_start: periodStart,
        period_end: periodEnd,
        gross_earnings: totals.gross,
        platform_fees: totals.fees,
        net_earnings: totals.net,
        refunds: totals.refunds,
        payout_amount: payoutAmount,
        status: "pending",
        scheduled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Create line items
    if (sales && sales.length > 0) {
      const { data: saleRecords } = await supabase
        .from("module_sales")
        .select("id, module:modules(name), developer_amount")
        .eq("developer_id", developerId)
        .eq("status", "completed")
        .gte("created_at", periodStart)
        .lte("created_at", periodEnd);

      interface SaleWithModule {
        id: string;
        developer_amount: number;
        module: { name: string }[] | null;
      }

      const lineItems = ((saleRecords || []) as unknown as SaleWithModule[]).map((s) => ({
        payout_id: payout.id,
        sale_id: s.id,
        description: `Sale: ${s.module?.[0]?.name || "Unknown Module"}`,
        amount: s.developer_amount,
      }));

      await supabase.from("payout_line_items").insert(lineItems);
    }

    return payout;
  }

  /**
   * Process a payout (marks for manual processing by finance team)
   */
  async processPayout(payoutId: string): Promise<void> {
    const { data: payout } = await supabase
      .from("developer_payouts")
      .select("*, account:developer_payout_accounts(payout_method)")
      .eq("id", payoutId)
      .single();

    if (!payout) throw new Error("Payout not found");
    if (payout.status !== "pending") throw new Error("Payout not pending");

    try {
      // Mark as processing - actual transfer handled by finance team
      await supabase
        .from("developer_payouts")
        .update({
          status: "processing",
          transfer_reference: `PAY-${Date.now()}`,
        })
        .eq("id", payoutId);

      await supabase.rpc("decrement_payout_balance", {
        p_account_id: payout.payout_account_id,
        p_amount: payout.payout_amount,
      });

      await supabase.rpc("increment_total_paid_out", {
        p_account_id: payout.payout_account_id,
        p_amount: payout.payout_amount,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await supabase
        .from("developer_payouts")
        .update({
          status: "failed",
          failed_reason: errorMessage,
        })
        .eq("id", payoutId);
      throw error;
    }
  }

  /**
   * Mark payout as completed
   */
  async markPayoutCompleted(transferReference: string, payoutReference?: string): Promise<void> {
    await supabase
      .from("developer_payouts")
      .update({
        status: "completed",
        payout_reference: payoutReference,
        processed_at: new Date().toISOString(),
      })
      .eq("transfer_reference", transferReference);
  }

  /**
   * Get payout history
   */
  async getPayoutHistory(
    developerId: string,
    options: {
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ payouts: Payout[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const from = (page - 1) * limit;

    let query = supabase
      .from("developer_payouts")
      .select("*", { count: "exact" })
      .eq("developer_id", developerId);

    if (options.status) {
      query = query.eq("status", options.status);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      payouts: data || [],
      total: count || 0,
    };
  }

  /**
   * Get payout with line items
   */
  async getPayoutDetails(
    payoutId: string
  ): Promise<Payout & { line_items: PayoutLineItem[] }> {
    const { data: payout, error } = await supabase
      .from("developer_payouts")
      .select(
        `
        *,
        line_items:payout_line_items(*)
      `
      )
      .eq("id", payoutId)
      .single();

    if (error) throw error;
    return payout;
  }

  /**
   * Generate statement URL (placeholder - implement actual PDF generation)
   */
  async generateStatement(payoutId: string): Promise<string> {
    const payout = await this.getPayoutDetails(payoutId);

    if (!payout) throw new Error("Payout not found");

    // Generate statement URL - in production, this would generate a PDF
    // and upload to storage, returning the URL
    const url = `/api/developer/statements/${payoutId}`;

    await supabase
      .from("developer_payouts")
      .update({ statement_url: url })
      .eq("id", payoutId);

    return url;
  }

  /**
   * Submit tax form
   */
  async submitTaxForm(
    developerId: string,
    formType: "W-9" | "W-8BEN" | "W-8BEN-E",
    taxIdLast4: string
  ): Promise<void> {
    await supabase
      .from("developer_payout_accounts")
      .update({
        tax_form_type: formType,
        tax_form_submitted_at: new Date().toISOString(),
        tax_id_last4: taxIdLast4,
        updated_at: new Date().toISOString(),
      })
      .eq("developer_id", developerId);
  }
}

// Export singleton instance
export const payoutService = new PayoutService();
