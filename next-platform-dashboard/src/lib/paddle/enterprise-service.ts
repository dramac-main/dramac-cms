/**
 * Paddle Enterprise Service
 * 
 * Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations
 * 
 * Handles enterprise quotation and custom pricing:
 * - Quote generation with custom pricing
 * - Quote management (send, accept, reject)
 * - Custom product/price creation in Paddle
 * 
 * NOTE: This service uses type casting for the enterprise_quotes table
 * which may not be in the generated Supabase types yet. The migration
 * for this table is included in em-59-paddle-billing.sql.
 * 
 * @see phases/enterprise-modules/PHASE-EM-59B-PADDLE-BILLING.md
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { paddle, isPaddleConfigured } from './client';
import { sendEmail } from '@/lib/email';

// Type cast for tables not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

// ============================================================================
// Types
// ============================================================================

export interface EnterpriseRequirements {
  estimatedUsers: number;
  estimatedSites: number;
  estimatedMonthlyUsage: {
    automationRuns: number;
    aiActions: number;
    apiCalls: number;
  };
  features: string[];
  additionalNotes: string;
}

export interface ProposedPricing {
  basePrice: number; // in cents
  usageIncluded: {
    automationRuns: number;
    aiActions: number;
    apiCalls: number;
  };
  discountPercent: number;
  totalMonthly: number; // in cents
  totalAnnual: number; // in cents
}

export interface EnterpriseQuote {
  id: string;
  agencyId: string | null;
  contactName: string;
  contactEmail: string;
  companyName: string;
  requirements: EnterpriseRequirements;
  proposedPricing: ProposedPricing;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: Date;
  sentAt: Date | null;
  paddleProductId: string | null;
  paddlePriceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQuoteParams {
  contactName: string;
  contactEmail: string;
  companyName: string;
  requirements: EnterpriseRequirements;
  agencyId?: string;
}

// ============================================================================
// Enterprise Service
// ============================================================================

export class EnterpriseService {
  private supabase: AnySupabase = createAdminClient();

  /**
   * Create enterprise quote
   */
  async createQuote(params: CreateQuoteParams): Promise<EnterpriseQuote> {
    // Calculate proposed pricing based on requirements
    const proposedPricing = this.calculateEnterprisePricing(params.requirements);
    
    const { data, error } = await this.supabase
      .from('enterprise_quotes')
      .insert({
        agency_id: params.agencyId || null,
        contact_name: params.contactName,
        contact_email: params.contactEmail,
        company_name: params.companyName,
        requirements: params.requirements,
        proposed_pricing: proposedPricing,
        status: 'draft',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Enterprise] Error creating quote:', error);
      throw error;
    }
    
    return this.mapQuote(data);
  }

  /**
   * Get quote by ID
   */
  async getQuote(quoteId: string): Promise<EnterpriseQuote | null> {
    const { data, error } = await this.supabase
      .from('enterprise_quotes')
      .select('*')
      .eq('id', quoteId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return this.mapQuote(data);
  }

  /**
   * List quotes with optional filters
   */
  async listQuotes(options?: {
    status?: EnterpriseQuote['status'];
    limit?: number;
    offset?: number;
  }): Promise<{ quotes: EnterpriseQuote[]; total: number }> {
    let query = this.supabase
      .from('enterprise_quotes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[Enterprise] Error listing quotes:', error);
      return { quotes: [], total: 0 };
    }
    
    return {
      quotes: (data || []).map((d: AnySupabase) => this.mapQuote(d)),
      total: count || 0,
    };
  }

  /**
   * Update quote
   */
  async updateQuote(
    quoteId: string, 
    updates: Partial<Pick<EnterpriseQuote, 'requirements' | 'proposedPricing' | 'status'>>
  ): Promise<EnterpriseQuote | null> {
    const updateData: Record<string, unknown> = {};
    
    if (updates.requirements) {
      updateData.requirements = updates.requirements;
    }
    if (updates.proposedPricing) {
      updateData.proposed_pricing = updates.proposedPricing;
    }
    if (updates.status) {
      updateData.status = updates.status;
    }
    
    const { data, error } = await this.supabase
      .from('enterprise_quotes')
      .update(updateData)
      .eq('id', quoteId)
      .select()
      .single();
    
    if (error || !data) {
      console.error('[Enterprise] Error updating quote:', error);
      return null;
    }
    
    return this.mapQuote(data);
  }

  /**
   * Calculate enterprise pricing based on requirements
   */
  calculateEnterprisePricing(requirements: EnterpriseRequirements): ProposedPricing {
    // Base price calculation
    let basePrice = 999; // Starting enterprise price in dollars
    
    // Add for users
    if (requirements.estimatedUsers > 50) {
      basePrice += Math.ceil((requirements.estimatedUsers - 50) / 10) * 50;
    }
    
    // Add for sites
    if (requirements.estimatedSites > 20) {
      basePrice += Math.ceil((requirements.estimatedSites - 20) / 5) * 25;
    }
    
    // Add for high usage
    const usageMultiplier = Math.max(
      requirements.estimatedMonthlyUsage.automationRuns / 100000,
      requirements.estimatedMonthlyUsage.aiActions / 50000,
      requirements.estimatedMonthlyUsage.apiCalls / 1000000,
      1
    );
    
    if (usageMultiplier > 1) {
      basePrice *= usageMultiplier;
    }
    
    // Volume discount
    let discountPercent = 0;
    if (basePrice >= 5000) discountPercent = 20;
    else if (basePrice >= 2500) discountPercent = 15;
    else if (basePrice >= 1500) discountPercent = 10;
    
    const totalMonthly = Math.round(basePrice * (1 - discountPercent / 100));
    const totalAnnual = Math.round(totalMonthly * 12 * 0.83); // Additional 17% annual discount
    
    // Included usage (generous for enterprise)
    const userMultiplier = Math.max(1, requirements.estimatedUsers / 20);
    
    return {
      basePrice: Math.round(basePrice * 100), // Convert to cents
      usageIncluded: {
        automationRuns: Math.round(100000 * userMultiplier),
        aiActions: Math.round(50000 * userMultiplier),
        apiCalls: Math.round(1000000 * userMultiplier),
      },
      discountPercent,
      totalMonthly: totalMonthly * 100, // Convert to cents
      totalAnnual: totalAnnual * 100, // Convert to cents
    };
  }

  /**
   * Send quote to customer
   */
  async sendQuote(quoteId: string): Promise<void> {
    const quote = await this.getQuote(quoteId);
    
    if (!quote) {
      throw new Error('Quote not found');
    }
    
    if (quote.status !== 'draft') {
      throw new Error('Quote has already been sent');
    }
    
    // Update status to sent
    await this.supabase
      .from('enterprise_quotes')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('id', quoteId);
    
    // Send email with quote details
    await sendEmail({
      to: { email: quote.contactEmail, name: quote.contactName },
      type: 'enterprise_quote' as any,
      data: {
        contactName: quote.contactName,
        companyName: quote.companyName,
        subject: `Your DRAMAC Enterprise Quote - ${quote.companyName}`,
        totalMonthly: (quote.proposedPricing.totalMonthly / 100).toFixed(2),
        totalAnnual: (quote.proposedPricing.totalAnnual / 100).toFixed(2),
        discountPercent: quote.proposedPricing.discountPercent,
        validUntil: quote.validUntil.toLocaleDateString(),
        quoteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/quote/${quoteId}`,
        includedUsage: quote.proposedPricing.usageIncluded,
      }
    });
  }

  /**
   * Accept quote and create subscription
   */
  async acceptQuote(quoteId: string): Promise<{ priceId: string }> {
    const quote = await this.getQuote(quoteId);
    
    if (!quote) {
      throw new Error('Quote not found');
    }
    
    if (quote.status !== 'sent') {
      throw new Error('Quote not in valid state for acceptance');
    }
    
    if (new Date(quote.validUntil) < new Date()) {
      // Update status to expired
      await this.supabase
        .from('enterprise_quotes')
        .update({ status: 'expired' })
        .eq('id', quoteId);
      throw new Error('Quote has expired');
    }
    
    if (!isPaddleConfigured || !paddle) {
      throw new Error('Paddle is not configured');
    }
    
    // Create custom product in Paddle
    const product = await paddle.products.create({
      name: `Enterprise - ${quote.companyName}`,
      description: `Custom enterprise plan for ${quote.companyName}`,
      taxCategory: 'saas', // Required field for Paddle product creation
    });
    
    // Create custom price
    const price = await paddle.prices.create({
      productId: product.id,
      description: `Monthly subscription for ${quote.companyName}`,
      unitPrice: {
        amount: quote.proposedPricing.totalMonthly.toString(),
        currencyCode: 'USD', // Paddle billing currency - platform subscriptions are in USD
      },
      billingCycle: {
        interval: 'month',
        frequency: 1,
      },
    });
    
    // Update quote status
    await this.supabase
      .from('enterprise_quotes')
      .update({ 
        status: 'accepted',
        paddle_product_id: product.id,
        paddle_price_id: price.id,
      })
      .eq('id', quoteId);
    
    // Return price ID for checkout
    return { priceId: price.id };
  }

  /**
   * Reject quote
   */
  async rejectQuote(quoteId: string, reason?: string): Promise<void> {
    const quote = await this.getQuote(quoteId);
    
    if (!quote) {
      throw new Error('Quote not found');
    }
    
    await this.supabase
      .from('enterprise_quotes')
      .update({ 
        status: 'rejected',
        metadata: { rejection_reason: reason }
      })
      .eq('id', quoteId);
  }

  /**
   * Map database row to EnterpriseQuote
   */
  private mapQuote(data: AnySupabase): EnterpriseQuote {
    return {
      id: data.id,
      agencyId: data.agency_id,
      contactName: data.contact_name,
      contactEmail: data.contact_email,
      companyName: data.company_name,
      requirements: data.requirements as EnterpriseRequirements,
      proposedPricing: data.proposed_pricing as ProposedPricing,
      status: data.status,
      validUntil: new Date(data.valid_until),
      sentAt: data.sent_at ? new Date(data.sent_at) : null,
      paddleProductId: data.paddle_product_id,
      paddlePriceId: data.paddle_price_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at || data.created_at),
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const enterpriseService = new EnterpriseService();
