/**
 * Pricing Card Component
 * 
 * Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations
 * 
 * Displays a pricing plan card with features, usage limits, and checkout button.
 * Integrates with Paddle.js for checkout flow.
 * 
 * @see phases/enterprise-modules/PHASE-EM-59B-PADDLE-BILLING.md
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openPaddleCheckout } from '@/lib/paddle/paddle-client';

// ============================================================================
// Types
// ============================================================================

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  paddlePriceIdMonthly: string;
  paddlePriceIdYearly: string;
  features: string[];
  usage: {
    automationRuns: number;
    aiActions: number;
    apiCalls: number;
  };
  limits: {
    modules: number | 'Unlimited';
    sites: number | 'Unlimited';
    teamMembers: number | 'Unlimited';
  };
  popular?: boolean;
  badge?: string;
}

interface PricingCardProps {
  plan: PricingPlan;
  billingCycle: 'monthly' | 'yearly';
  currentPlan?: string;
  agencyId?: string;
  email?: string;
  onSelect?: (planId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function PricingCard({
  plan,
  billingCycle,
  currentPlan,
  agencyId,
  email,
  onSelect
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  
  const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  const priceId = billingCycle === 'yearly' ? plan.paddlePriceIdYearly : plan.paddlePriceIdMonthly;
  const isCurrentPlan = currentPlan === plan.id;
  const savings = billingCycle === 'yearly' 
    ? Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100) 
    : 0;
  
  const handleSubscribe = async () => {
    console.log('[PricingCard] handleSubscribe called for plan:', plan.id);
    console.log('[PricingCard] Current state:', { agencyId, email, priceId, billingCycle });
    
    if (!agencyId || !email) {
      // Redirect to signup/login
      console.log('[PricingCard] No agencyId or email, redirecting to signup');
      window.location.href = '/signup?plan=' + plan.id;
      return;
    }
    
    // Validate priceId before attempting checkout
    if (!priceId || priceId.trim() === '') {
      console.error('[PricingCard] Missing priceId for plan:', plan.id, 'cycle:', billingCycle);
      alert('Configuration error: Price ID not found. Please contact support.');
      return;
    }
    
    console.log('[PricingCard] Opening checkout:', { 
      plan: plan.id, 
      priceId, 
      billingCycle, 
      agencyId, 
      email 
    });
    
    setLoading(true);
    try {
      await openPaddleCheckout({
        priceId,
        agencyId,
        email,
      });
      onSelect?.(plan.id);
    } catch (error) {
      console.error('[PricingCard] Checkout error:', error);
      alert('Failed to open checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className={cn(
      'relative flex flex-col',
      plan.popular && 'border-primary shadow-lg scale-105 z-10'
    )}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {plan.name}
          {plan.badge && (
            <Badge variant="secondary">{plan.badge}</Badge>
          )}
        </CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        {/* Pricing */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">${price}</span>
            <span className="text-muted-foreground">
              /{billingCycle === 'yearly' ? 'year' : 'month'}
            </span>
          </div>
          {billingCycle === 'yearly' && savings > 0 && (
            <p className="text-sm text-green-600 mt-1">
              Save {savings}% vs monthly
            </p>
          )}
        </div>
        
        {/* Usage Limits */}
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Included Usage</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>{plan.usage.automationRuns.toLocaleString()} automation runs/mo</li>
            <li>{plan.usage.aiActions.toLocaleString()} AI actions/mo</li>
            <li>{plan.usage.apiCalls.toLocaleString()} API calls/mo</li>
          </ul>
        </div>
        
        {/* Features */}
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        {/* Limits */}
        <div className="mt-4 pt-4 border-t">
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              {plan.limits.modules === 'Unlimited' ? 'Unlimited' : plan.limits.modules} modules
            </li>
            <li>
              {plan.limits.sites === 'Unlimited' ? 'Unlimited' : plan.limits.sites} sites
            </li>
            <li>
              {plan.limits.teamMembers === 'Unlimited' ? 'Unlimited' : plan.limits.teamMembers} team members
            </li>
          </ul>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full"
          variant={plan.popular ? 'default' : 'outline'}
          disabled={isCurrentPlan || loading}
          onClick={handleSubscribe}
        >
          {isCurrentPlan ? 'Current Plan' : loading ? 'Loading...' : 'Get Started'}
        </Button>
      </CardFooter>
    </Card>
  );
}
