/**
 * AI Agent Usage Tracker
 * 
 * Phase EM-58B: Track and manage AI agent usage limits and billing
 */

import { createClient } from '@supabase/supabase-js';

export type UsageTier = 'free' | 'starter' | 'professional' | 'business' | 'enterprise';

export interface UsageLimits {
  tier: UsageTier;
  monthlyTokenLimit: number;
  monthlyExecutionLimit: number;
  maxActiveAgents: number;
  maxToolsPerAgent: number;
  allowedModels: string[];
  customPromptsAllowed: boolean;
  prioritySupport: boolean;
  slaGuarantee: boolean;
}

export interface UsageStats {
  siteId: string;
  periodStart: Date;
  periodEnd: Date;
  tokensUsed: number;
  tokensLimit: number;
  executionsUsed: number;
  executionsLimit: number;
  costEstimate: number;
  overageTokens: number;
  overageCost: number;
}

export const TIER_LIMITS: Record<UsageTier, UsageLimits> = {
  free: {
    tier: 'free',
    monthlyTokenLimit: 50000,
    monthlyExecutionLimit: 100,
    maxActiveAgents: 2,
    maxToolsPerAgent: 5,
    allowedModels: ['gpt-4o-mini'],
    customPromptsAllowed: false,
    prioritySupport: false,
    slaGuarantee: false,
  },
  starter: {
    tier: 'starter',
    monthlyTokenLimit: 500000,
    monthlyExecutionLimit: 1000,
    maxActiveAgents: 5,
    maxToolsPerAgent: 10,
    allowedModels: ['gpt-4o-mini', 'gpt-4o'],
    customPromptsAllowed: true,
    prioritySupport: false,
    slaGuarantee: false,
  },
  professional: {
    tier: 'professional',
    monthlyTokenLimit: 2000000,
    monthlyExecutionLimit: 5000,
    maxActiveAgents: 15,
    maxToolsPerAgent: 20,
    allowedModels: ['gpt-4o-mini', 'gpt-4o', 'claude-sonnet-4-6'],
    customPromptsAllowed: true,
    prioritySupport: true,
    slaGuarantee: false,
  },
  business: {
    tier: 'business',
    monthlyTokenLimit: 10000000,
    monthlyExecutionLimit: 25000,
    maxActiveAgents: 50,
    maxToolsPerAgent: 50,
    allowedModels: ['gpt-4o-mini', 'gpt-4o', 'claude-sonnet-4-6', 'claude-opus-4-6'],
    customPromptsAllowed: true,
    prioritySupport: true,
    slaGuarantee: true,
  },
  enterprise: {
    tier: 'enterprise',
    monthlyTokenLimit: -1, // Unlimited
    monthlyExecutionLimit: -1, // Unlimited
    maxActiveAgents: -1, // Unlimited
    maxToolsPerAgent: -1, // Unlimited
    allowedModels: ['*'], // All models
    customPromptsAllowed: true,
    prioritySupport: true,
    slaGuarantee: true,
  },
};

export const TIER_PRICING: Record<UsageTier, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  starter: { monthly: 29, yearly: 290 },
  professional: { monthly: 99, yearly: 990 },
  business: { monthly: 299, yearly: 2990 },
  enterprise: { monthly: -1, yearly: -1 }, // Custom pricing
};

export const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'claude-sonnet-4-6': { input: 0.003, output: 0.015 },
  'claude-opus-4-6': { input: 0.005, output: 0.025 },
};

export class UsageTracker {
  private supabase: ReturnType<typeof createClient>;
  
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get current usage limits for a site
   */
  async getLimits(siteId: string): Promise<UsageLimits | null> {
    const { data, error } = await this.supabase
      .from('ai_usage_limits')
      .select('*')
      .eq('site_id', siteId)
      .single() as { data: any; error: any };
    
    if (error || !data) {
      // Return free tier defaults if no limits set
      return TIER_LIMITS.free;
    }

    return {
      tier: data.tier as UsageTier,
      monthlyTokenLimit: data.monthly_token_limit,
      monthlyExecutionLimit: data.monthly_execution_limit,
      maxActiveAgents: data.max_active_agents,
      maxToolsPerAgent: data.max_tools_per_agent,
      allowedModels: data.allowed_models || ['gpt-4o-mini'],
      customPromptsAllowed: data.custom_prompts_allowed,
      prioritySupport: data.priority_support,
      slaGuarantee: data.sla_guarantee,
    };
  }

  /**
   * Get current period usage stats
   */
  async getUsageStats(siteId: string): Promise<UsageStats> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get usage from executions
    const { data: executions, error: execError } = await this.supabase
      .from('ai_agent_executions')
      .select('tokens_used, execution_cost')
      .eq('site_id', siteId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString()) as { data: Array<{ tokens_used?: number; execution_cost?: number }> | null; error: any };

    const limits = await this.getLimits(siteId);
    
    const tokensUsed = executions?.reduce((sum, e) => sum + (e.tokens_used || 0), 0) || 0;
    const executionsUsed = executions?.length || 0;
    const costEstimate = executions?.reduce((sum, e) => sum + (e.execution_cost || 0), 0) || 0;

    // Calculate overage
    const tokensLimit = limits?.monthlyTokenLimit || 50000;
    const overageTokens = tokensLimit > 0 ? Math.max(0, tokensUsed - tokensLimit) : 0;
    const overageCost = overageTokens * 0.00001; // $0.01 per 1000 overage tokens

    return {
      siteId,
      periodStart,
      periodEnd,
      tokensUsed,
      tokensLimit,
      executionsUsed,
      executionsLimit: limits?.monthlyExecutionLimit || 100,
      costEstimate,
      overageTokens,
      overageCost,
    };
  }

  /**
   * Check if an execution is allowed based on limits
   */
  async checkExecutionAllowed(
    siteId: string, 
    estimatedTokens: number,
    model: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getLimits(siteId);
    const usage = await this.getUsageStats(siteId);

    if (!limits) {
      return { allowed: false, reason: 'Unable to fetch usage limits' };
    }

    // Check model allowed
    if (!limits.allowedModels.includes('*') && !limits.allowedModels.includes(model)) {
      return { 
        allowed: false, 
        reason: `Model ${model} not available on your plan. Upgrade to access.` 
      };
    }

    // Check execution limit (if not unlimited)
    if (limits.monthlyExecutionLimit > 0 && usage.executionsUsed >= limits.monthlyExecutionLimit) {
      return { 
        allowed: false, 
        reason: `Monthly execution limit reached (${limits.monthlyExecutionLimit}). Upgrade for more executions.` 
      };
    }

    // Check token limit (if not unlimited) - allow with warning if close
    if (limits.monthlyTokenLimit > 0) {
      const projectedUsage = usage.tokensUsed + estimatedTokens;
      if (projectedUsage > limits.monthlyTokenLimit * 1.5) {
        return { 
          allowed: false, 
          reason: `Token limit significantly exceeded. Please upgrade your plan.` 
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Record usage after execution
   */
  async recordUsage(
    siteId: string,
    executionId: string,
    tokensUsed: number,
    model: string
  ): Promise<void> {
    const limits = await this.getLimits(siteId);
    const usage = await this.getUsageStats(siteId);
    
    // Check for overage
    if (limits && limits.monthlyTokenLimit > 0) {
      const newTotal = usage.tokensUsed + tokensUsed;
      if (newTotal > limits.monthlyTokenLimit) {
        const overageAmount = newTotal - limits.monthlyTokenLimit;
        const overageRate = 0.00001; // $0.01 per 1000 tokens
        const overageCost = overageAmount * overageRate;

        // Record overage
        await (this.supabase
          .from('ai_usage_overage') as any)
          .insert({
            site_id: siteId,
            execution_id: executionId,
            overage_tokens: overageAmount,
            overage_cost: overageCost,
            billing_status: 'pending',
          });
      }
    }
  }

  /**
   * Upgrade site to a new tier
   */
  async upgradeTier(siteId: string, newTier: UsageTier): Promise<boolean> {
    const tierLimits = TIER_LIMITS[newTier];
    
    const { error } = await (this.supabase
      .from('ai_usage_limits') as any)
      .upsert({
        site_id: siteId,
        tier: newTier,
        monthly_token_limit: tierLimits.monthlyTokenLimit,
        monthly_execution_limit: tierLimits.monthlyExecutionLimit,
        max_active_agents: tierLimits.maxActiveAgents,
        max_tools_per_agent: tierLimits.maxToolsPerAgent,
        allowed_models: tierLimits.allowedModels,
        custom_prompts_allowed: tierLimits.customPromptsAllowed,
        priority_support: tierLimits.prioritySupport,
        sla_guarantee: tierLimits.slaGuarantee,
        updated_at: new Date().toISOString(),
      });

    return !error;
  }

  /**
   * Estimate cost for an execution
   */
  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const costs = TOKEN_COSTS[model] || TOKEN_COSTS['gpt-4o-mini'];
    return (inputTokens * costs.input / 1000) + (outputTokens * costs.output / 1000);
  }
}

/**
 * Create a usage tracker instance
 */
export function createUsageTracker(): UsageTracker {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return new UsageTracker(supabaseUrl, supabaseKey);
}
