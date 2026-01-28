/**
 * Usage Dashboard Component
 * 
 * Phase EM-58B: Display current usage and upgrade options
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Zap,
  Bot,
  Wrench,
  Crown,
  Check,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { UsageTier, TIER_LIMITS, TIER_PRICING, UsageStats, UsageLimits } from '@/lib/ai-agents/billing/usage-tracker';

interface UsageDashboardProps {
  siteId: string;
  currentTier: UsageTier;
  usage: UsageStats;
  limits: UsageLimits;
  onUpgrade: (tier: UsageTier) => Promise<void>;
}

const TIER_FEATURES: Record<UsageTier, string[]> = {
  free: [
    '50K tokens/month',
    '100 executions/month',
    '2 active agents',
    'GPT-4o-mini model',
    'Community support',
  ],
  starter: [
    '500K tokens/month',
    '1,000 executions/month',
    '5 active agents',
    'GPT-4o & GPT-4o-mini',
    'Custom prompts',
    'Email support',
  ],
  professional: [
    '2M tokens/month',
    '5,000 executions/month',
    '15 active agents',
    'All OpenAI + Claude models',
    'Custom prompts',
    'Priority support',
    'API access',
  ],
  business: [
    '10M tokens/month',
    '25,000 executions/month',
    '50 active agents',
    'All models including Claude Opus',
    'Custom prompts',
    'Priority support',
    '99.9% SLA guarantee',
    'Dedicated account manager',
  ],
  enterprise: [
    'Unlimited tokens',
    'Unlimited executions',
    'Unlimited agents',
    'All models',
    'Custom model fine-tuning',
    'On-premise deployment option',
    '99.99% SLA guarantee',
    'Custom integrations',
    '24/7 support',
  ],
};

const TIER_DISPLAY_NAMES: Record<UsageTier, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  business: 'Business',
  enterprise: 'Enterprise',
};

export function UsageDashboard({ 
  siteId, 
  currentTier, 
  usage, 
  limits,
  onUpgrade 
}: UsageDashboardProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<UsageTier | null>(null);

  const tokenPercent = limits.monthlyTokenLimit > 0 
    ? Math.min(100, (usage.tokensUsed / limits.monthlyTokenLimit) * 100)
    : 0;
    
  const execPercent = limits.monthlyExecutionLimit > 0
    ? Math.min(100, (usage.executionsUsed / limits.monthlyExecutionLimit) * 100)
    : 0;

  const isNearLimit = tokenPercent > 80 || execPercent > 80;
  const isOverLimit = tokenPercent >= 100 || execPercent >= 100;

  const handleUpgrade = async (tier: UsageTier) => {
    setIsUpgrading(true);
    try {
      await onUpgrade(tier);
      setShowUpgradeDialog(false);
    } finally {
      setIsUpgrading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Usage & Billing
                <Badge variant={currentTier === 'free' ? 'secondary' : 'default'}>
                  {currentTier === 'enterprise' && <Crown className="h-3 w-3 mr-1" />}
                  {TIER_DISPLAY_NAMES[currentTier]}
                </Badge>
              </CardTitle>
              <CardDescription>
                Current billing period: {usage.periodStart.toLocaleDateString()} - {usage.periodEnd.toLocaleDateString()}
              </CardDescription>
            </div>
            {currentTier !== 'enterprise' && (
              <Button onClick={() => setShowUpgradeDialog(true)}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning Banner */}
          {isNearLimit && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              isOverLimit 
                ? 'bg-destructive/10 text-destructive' 
                : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
            }`}>
              <AlertTriangle className="h-5 w-5" />
              <span>
                {isOverLimit 
                  ? 'You have exceeded your usage limits. Upgrade to continue using AI agents.' 
                  : 'You are approaching your usage limits. Consider upgrading soon.'}
              </span>
            </div>
          )}

          {/* Token Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Tokens</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatNumber(usage.tokensUsed)} / {limits.monthlyTokenLimit > 0 ? formatNumber(limits.monthlyTokenLimit) : 'Unlimited'}
              </span>
            </div>
            <Progress 
              value={tokenPercent} 
              className={`h-2 ${tokenPercent > 80 ? 'bg-yellow-100' : ''}`}
            />
          </div>

          {/* Execution Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Executions</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {usage.executionsUsed.toLocaleString()} / {limits.monthlyExecutionLimit > 0 ? limits.monthlyExecutionLimit.toLocaleString() : 'Unlimited'}
              </span>
            </div>
            <Progress 
              value={execPercent} 
              className={`h-2 ${execPercent > 80 ? 'bg-yellow-100' : ''}`}
            />
          </div>

          {/* Plan Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{limits.maxActiveAgents > 0 ? limits.maxActiveAgents : '∞'}</div>
              <p className="text-xs text-muted-foreground">Active Agents</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{limits.maxToolsPerAgent > 0 ? limits.maxToolsPerAgent : '∞'}</div>
              <p className="text-xs text-muted-foreground">Tools/Agent</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{limits.allowedModels.includes('*') ? 'All' : limits.allowedModels.length}</div>
              <p className="text-xs text-muted-foreground">AI Models</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${usage.costEstimate.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Est. Cost</p>
            </div>
          </div>

          {/* Overage Warning */}
          {usage.overageTokens > 0 && (
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Overage: </span>
                {formatNumber(usage.overageTokens)} tokens over limit
                <span className="text-muted-foreground"> (${usage.overageCost.toFixed(2)} additional)</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>
              Choose the plan that best fits your needs
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            {(['starter', 'professional', 'business', 'enterprise'] as UsageTier[]).map((tier) => {
              const isCurrentTier = tier === currentTier;
              const tierOrder = ['free', 'starter', 'professional', 'business', 'enterprise'];
              const isDowngrade = tierOrder.indexOf(tier) < tierOrder.indexOf(currentTier);

              return (
                <Card 
                  key={tier}
                  className={`relative ${tier === 'professional' ? 'border-primary ring-1 ring-primary' : ''}`}
                >
                  {tier === 'professional' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      {tier === 'enterprise' && <Crown className="h-4 w-4 text-amber-500" />}
                      {TIER_DISPLAY_NAMES[tier]}
                    </CardTitle>
                    <div className="mt-2">
                      {TIER_PRICING[tier].monthly === -1 ? (
                        <span className="text-2xl font-bold">Custom</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold">${TIER_PRICING[tier].monthly}</span>
                          <span className="text-muted-foreground">/mo</span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {TIER_FEATURES[tier].map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-4"
                      variant={isCurrentTier ? 'secondary' : tier === 'professional' ? 'default' : 'outline'}
                      disabled={isCurrentTier || isDowngrade || isUpgrading}
                      onClick={() => handleUpgrade(tier)}
                    >
                      {isCurrentTier 
                        ? 'Current Plan' 
                        : tier === 'enterprise' 
                          ? 'Contact Sales' 
                          : isUpgrading 
                            ? 'Upgrading...' 
                            : 'Upgrade'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
