# Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations

> **Phase Type:** Platform Foundation  
> **Complexity:** High  
> **Dependencies:** EM-59A (Core Infrastructure)  
> **Estimated Effort:** 2-3 weeks  
> **Business Impact:** Complete billing experience

---

## 📋 Table of Contents

1. [Billing UI Components](#billing-ui-components)
2. [Pricing Page](#pricing-page)
3. [Usage Dashboard](#usage-dashboard)
4. [Subscription Management UI](#subscription-management-ui)
5. [Invoice History](#invoice-history)
6. [Admin Billing Dashboard](#admin-billing-dashboard)
7. [Dunning & Recovery](#dunning--recovery)
8. [Enterprise Features](#enterprise-features)
9. [API Routes](#api-routes)
10. [Testing Guide](#testing-guide)
11. [Deployment Checklist](#deployment-checklist)

---

## Billing UI Components

### Pricing Card Component

```typescript
// src/components/billing/pricing-card.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openCheckout } from '@/lib/paddle/paddle-client';

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
    if (!agencyId || !email) {
      // Redirect to signup/login
      window.location.href = '/signup?plan=' + plan.id;
      return;
    }
    
    setLoading(true);
    try {
      await openCheckout({
        priceId,
        agencyId,
        email,
      });
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className={cn(
      'relative flex flex-col',
      plan.popular && 'border-primary shadow-lg scale-105'
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
```

### Billing Cycle Toggle

```typescript
// src/components/billing/billing-cycle-toggle.tsx

'use client';

import { cn } from '@/lib/utils';

interface BillingCycleToggleProps {
  value: 'monthly' | 'yearly';
  onChange: (value: 'monthly' | 'yearly') => void;
}

export function BillingCycleToggle({ value, onChange }: BillingCycleToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <button
        className={cn(
          'px-4 py-2 rounded-lg transition-colors',
          value === 'monthly' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted hover:bg-muted/80'
        )}
        onClick={() => onChange('monthly')}
      >
        Monthly
      </button>
      <button
        className={cn(
          'px-4 py-2 rounded-lg transition-colors relative',
          value === 'yearly' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted hover:bg-muted/80'
        )}
        onClick={() => onChange('yearly')}
      >
        Yearly
        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
          -17%
        </span>
      </button>
    </div>
  );
}
```

---

## Pricing Page

### Full Pricing Page Component

```typescript
// src/app/(marketing)/pricing/page.tsx

'use client';

import { useState } from 'react';
import { PricingCard, type PricingPlan } from '@/components/billing/pricing-card';
import { BillingCycleToggle } from '@/components/billing/billing-cycle-toggle';
import { Button } from '@/components/ui/button';
import { Check, MessageCircle } from 'lucide-react';

const PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    priceMonthly: 29,
    priceYearly: 290,
    paddlePriceIdMonthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY!,
    paddlePriceIdYearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY!,
    features: [
      '3 modules included',
      '1 website',
      '3 team members',
      'Basic analytics',
      'Email support',
      'Standard integrations',
    ],
    usage: {
      automationRuns: 1000,
      aiActions: 500,
      apiCalls: 10000,
    },
    limits: {
      modules: 3,
      sites: 1,
      teamMembers: 3,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses that need more power',
    priceMonthly: 99,
    priceYearly: 990,
    paddlePriceIdMonthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY!,
    paddlePriceIdYearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY!,
    features: [
      '10 modules included',
      '5 websites',
      '10 team members',
      'Advanced analytics',
      'Priority support',
      'Custom domain',
      'White-label options',
      'All integrations',
      '50% overage discount',
    ],
    usage: {
      automationRuns: 10000,
      aiActions: 5000,
      apiCalls: 100000,
    },
    limits: {
      modules: 10,
      sites: 5,
      teamMembers: 10,
    },
    popular: true,
  },
];

const ENTERPRISE_FEATURES = [
  'Unlimited modules',
  'Unlimited websites',
  'Unlimited team members',
  'Dedicated support',
  'SLA guarantees',
  'Custom integrations',
  'SSO/SAML',
  'Unlimited usage',
  'Custom development',
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that works for your business. 
          All plans include core features with usage-based billing for what you actually use.
        </p>
      </div>
      
      <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {PLANS.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
          />
        ))}
        
        {/* Enterprise Card */}
        <div className="md:col-span-2 lg:col-span-1">
          <div className="h-full border rounded-lg p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-slate-300">
                For large organizations with custom requirements
              </p>
            </div>
            
            <div className="flex-1">
              <ul className="space-y-2 mb-6">
                {ENTERPRISE_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => window.location.href = '/contact?subject=enterprise'}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
      
      {/* Overage Pricing */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">
          Pay Only for What You Use
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          Overage is charged only when you exceed your included limits
        </p>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg text-center">
            <p className="font-semibold">Automation Runs</p>
            <p className="text-2xl font-bold">$0.001</p>
            <p className="text-sm text-muted-foreground">per run over limit</p>
            <p className="text-xs text-green-600 mt-1">Pro: $0.0005 (50% off)</p>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <p className="font-semibold">AI Actions</p>
            <p className="text-2xl font-bold">$0.005</p>
            <p className="text-sm text-muted-foreground">per action over limit</p>
            <p className="text-xs text-green-600 mt-1">Pro: $0.0025 (50% off)</p>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <p className="font-semibold">API Calls</p>
            <p className="text-2xl font-bold">$0.0001</p>
            <p className="text-sm text-muted-foreground">per call over limit</p>
            <p className="text-xs text-green-600 mt-1">Pro: $0.00005 (50% off)</p>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">What happens when I exceed my usage limits?</h3>
            <p className="text-muted-foreground">
              We'll continue processing your requests and charge overage at the rates above. 
              You'll receive notifications as you approach your limits.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Can I upgrade or downgrade anytime?</h3>
            <p className="text-muted-foreground">
              Yes! You can change your plan at any time. Upgrades take effect immediately 
              with prorated billing. Downgrades take effect at the end of your billing period.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Do you offer a free trial?</h3>
            <p className="text-muted-foreground">
              Yes, we offer a 14-day free trial on all plans. No credit card required 
              to start. You can explore all features before committing.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">
              We accept all major credit cards, PayPal, and wire transfer for Enterprise plans. 
              Payments are processed securely through Paddle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Usage Dashboard

### Usage Overview Component

```typescript
// src/components/billing/usage-dashboard.tsx

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, Zap, Bot, Webhook } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageData {
  automationRuns: number;
  aiActions: number;
  apiCalls: number;
  includedAutomationRuns: number;
  includedAiActions: number;
  includedApiCalls: number;
  overageAutomationRuns: number;
  overageAiActions: number;
  overageApiCalls: number;
  overageCostCents: number;
  periodStart: string;
  periodEnd: string;
  percentUsed: {
    automationRuns: number;
    aiActions: number;
    apiCalls: number;
  };
}

interface UsageDashboardProps {
  agencyId: string;
}

export function UsageDashboard({ agencyId }: UsageDashboardProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch(`/api/billing/usage?agencyId=${agencyId}`);
        if (!res.ok) throw new Error('Failed to fetch usage');
        const data = await res.json();
        setUsage(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsage();
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [agencyId]);
  
  if (loading) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }
  
  if (error || !usage) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Failed to load usage data'}</AlertDescription>
      </Alert>
    );
  }
  
  const daysLeft = Math.ceil(
    (new Date(usage.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  const hasOverage = usage.overageCostCents > 0;
  
  return (
    <div className="space-y-6">
      {/* Period Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usage This Period</h2>
          <p className="text-muted-foreground">
            {new Date(usage.periodStart).toLocaleDateString()} - {new Date(usage.periodEnd).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={daysLeft < 5 ? 'destructive' : 'secondary'}>
          {daysLeft} days left
        </Badge>
      </div>
      
      {/* Overage Warning */}
      {hasOverage && (
        <Alert className="bg-orange-50 border-orange-200">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You've exceeded your included limits. Current overage: ${(usage.overageCostCents / 100).toFixed(2)}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Usage Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <UsageCard
          title="Automation Runs"
          icon={<Zap className="w-5 h-5" />}
          used={usage.automationRuns}
          included={usage.includedAutomationRuns}
          overage={usage.overageAutomationRuns}
          percent={usage.percentUsed.automationRuns}
        />
        <UsageCard
          title="AI Actions"
          icon={<Bot className="w-5 h-5" />}
          used={usage.aiActions}
          included={usage.includedAiActions}
          overage={usage.overageAiActions}
          percent={usage.percentUsed.aiActions}
        />
        <UsageCard
          title="API Calls"
          icon={<Webhook className="w-5 h-5" />}
          used={usage.apiCalls}
          included={usage.includedApiCalls}
          overage={usage.overageApiCalls}
          percent={usage.percentUsed.apiCalls}
        />
      </div>
      
      {/* Projected Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Projected End-of-Period Usage</CardTitle>
          <CardDescription>
            Based on your current usage rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectedUsage 
            currentUsage={usage}
            daysLeft={daysLeft}
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface UsageCardProps {
  title: string;
  icon: React.ReactNode;
  used: number;
  included: number;
  overage: number;
  percent: number;
}

function UsageCard({ title, icon, used, included, overage, percent }: UsageCardProps) {
  const isOverLimit = percent >= 100;
  const isNearLimit = percent >= 80 && percent < 100;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">
          {used.toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground">
            {' '}/ {included.toLocaleString()}
          </span>
        </div>
        
        <Progress 
          value={Math.min(percent, 100)} 
          className={cn(
            'h-2',
            isOverLimit && '[&>div]:bg-red-500',
            isNearLimit && '[&>div]:bg-orange-500'
          )}
        />
        
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className={cn(
            'font-medium',
            isOverLimit && 'text-red-600',
            isNearLimit && 'text-orange-600'
          )}>
            {percent.toFixed(1)}% used
          </span>
          {overage > 0 && (
            <Badge variant="destructive" className="text-xs">
              +{overage.toLocaleString()} overage
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProjectedUsageProps {
  currentUsage: UsageData;
  daysLeft: number;
}

function ProjectedUsage({ currentUsage, daysLeft }: ProjectedUsageProps) {
  const periodDays = Math.ceil(
    (new Date(currentUsage.periodEnd).getTime() - new Date(currentUsage.periodStart).getTime()) / 
    (1000 * 60 * 60 * 24)
  );
  const daysPassed = periodDays - daysLeft;
  
  const projectUsage = (current: number, included: number) => {
    if (daysPassed === 0) return current;
    const dailyRate = current / daysPassed;
    const projected = dailyRate * periodDays;
    return { projected: Math.round(projected), willExceed: projected > included };
  };
  
  const projections = {
    automation: projectUsage(currentUsage.automationRuns, currentUsage.includedAutomationRuns),
    ai: projectUsage(currentUsage.aiActions, currentUsage.includedAiActions),
    api: projectUsage(currentUsage.apiCalls, currentUsage.includedApiCalls),
  };
  
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {Object.entries({
        'Automation Runs': { ...projections.automation, included: currentUsage.includedAutomationRuns },
        'AI Actions': { ...projections.ai, included: currentUsage.includedAiActions },
        'API Calls': { ...projections.api, included: currentUsage.includedApiCalls },
      }).map(([name, data]) => (
        <div key={name} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
          {data.willExceed ? (
            <TrendingUp className="w-5 h-5 text-red-500" />
          ) : (
            <TrendingDown className="w-5 h-5 text-green-500" />
          )}
          <div>
            <p className="text-sm font-medium">{name}</p>
            <p className={cn(
              'text-lg font-bold',
              data.willExceed && 'text-red-600'
            )}>
              {typeof data.projected === 'number' ? data.projected.toLocaleString() : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.willExceed 
                ? `~${((data.projected as number) - data.included).toLocaleString()} over` 
                : 'Within limit'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Subscription Management UI

### Subscription Settings Page

```typescript
// src/app/dashboard/settings/billing/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Pause,
  Play,
  X,
  RefreshCw
} from 'lucide-react';
import { UsageDashboard } from '@/components/billing/usage-dashboard';
import { InvoiceHistory } from '@/components/billing/invoice-history';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SubscriptionData {
  id: string;
  planType: string;
  billingCycle: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  unitPrice: number;
  currency: string;
}

export default function BillingSettingsPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  useEffect(() => {
    fetchSubscription();
  }, []);
  
  async function fetchSubscription() {
    try {
      const res = await fetch('/api/billing/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } finally {
      setLoading(false);
    }
  }
  
  async function handleAction(action: string) {
    setActionLoading(action);
    try {
      await fetch(`/api/billing/subscription/${action}`, { method: 'POST' });
      await fetchSubscription();
    } finally {
      setActionLoading(null);
    }
  }
  
  if (loading) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Usage</h1>
        <p className="text-muted-foreground">
          Manage your subscription, view usage, and download invoices
        </p>
      </div>
      
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold capitalize">
                    {subscription.planType} Plan
                  </p>
                  <p className="text-muted-foreground">
                    ${(subscription.unitPrice / 100).toFixed(2)}/{subscription.billingCycle}
                  </p>
                </div>
                <Badge variant={
                  subscription.status === 'active' ? 'default' :
                  subscription.status === 'past_due' ? 'destructive' :
                  subscription.status === 'paused' ? 'secondary' :
                  'outline'
                }>
                  {subscription.status}
                </Badge>
              </div>
              
              {subscription.cancelAtPeriodEnd && (
                <Alert>
                  <AlertDescription>
                    Your subscription will be cancelled on{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </div>
              
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" asChild>
                  <a href="/pricing">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    Change Plan
                  </a>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction('update-payment')}
                  disabled={actionLoading === 'update-payment'}
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  Update Payment
                </Button>
                
                {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAction('pause')}
                    disabled={actionLoading === 'pause'}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                )}
                
                {subscription.status === 'paused' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAction('resume')}
                    disabled={actionLoading === 'resume'}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </Button>
                )}
                
                {subscription.cancelAtPeriodEnd ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAction('reactivate')}
                    disabled={actionLoading === 'reactivate'}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reactivate
                  </Button>
                ) : (
                  <CancelSubscriptionDialog 
                    onCancel={() => handleAction('cancel')}
                    loading={actionLoading === 'cancel'}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You don't have an active subscription
              </p>
              <Button asChild>
                <a href="/pricing">View Plans</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Usage Dashboard */}
      {subscription && (
        <UsageDashboard agencyId="current" />
      )}
      
      {/* Invoice History */}
      <InvoiceHistory />
    </div>
  );
}

function CancelSubscriptionDialog({ 
  onCancel, 
  loading 
}: { 
  onCancel: () => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel? You'll still have access until the end 
            of your billing period.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            We're sorry to see you go! Before you cancel, please consider:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
            <li>Pausing your subscription instead (you won't be charged)</li>
            <li>Downgrading to a lower tier</li>
            <li>Contacting support if you're having issues</li>
          </ul>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep Subscription
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              onCancel();
              setOpen(false);
            }}
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Yes, Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Invoice History

### Invoice List Component

```typescript
// src/components/billing/invoice-history.tsx

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Download, ExternalLink, FileText } from 'lucide-react';

interface Invoice {
  id: string;
  paddleInvoiceNumber: string;
  status: string;
  total: number;
  currency: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  invoiceUrl: string;
  createdAt: string;
}

export function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch('/api/billing/invoices');
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices || []);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchInvoices();
  }, []);
  
  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Invoice History
        </CardTitle>
        <CardDescription>
          View and download your past invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No invoices yet
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.paddleInvoiceNumber || invoice.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(invoice.billingPeriodStart).toLocaleDateString()} - {' '}
                    {new Date(invoice.billingPeriodEnd).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      invoice.status === 'paid' || invoice.status === 'completed' 
                        ? 'default' 
                        : invoice.status === 'past_due' 
                        ? 'destructive' 
                        : 'secondary'
                    }>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${(invoice.total / 100).toFixed(2)} {invoice.currency}
                  </TableCell>
                  <TableCell>
                    {invoice.invoiceUrl && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`${invoice.invoiceUrl}?download=true`} download>
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Admin Billing Dashboard

### Admin Revenue Overview

```typescript
// src/app/admin/billing/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface BillingOverview {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  churnRate: number;
  ltv: number;
  arpu: number;
  mrrGrowth: number;
  subscriptionsByPlan: {
    starter: number;
    pro: number;
    enterprise: number;
  };
  revenueByMonth: {
    month: string;
    revenue: number;
    subscriptions: number;
  }[];
  topAgencies: {
    id: string;
    name: string;
    plan: string;
    mrr: number;
    usage: number;
  }[];
}

export default function AdminBillingPage() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await fetch('/api/admin/billing/overview');
        if (res.ok) {
          const data = await res.json();
          setOverview(data);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchOverview();
  }, []);
  
  if (loading || !overview) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing Overview</h1>
        <p className="text-muted-foreground">
          Revenue metrics and subscription analytics
        </p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={`$${(overview.mrr / 100).toLocaleString()}`}
          change={overview.mrrGrowth}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <MetricCard
          title="Annual Recurring Revenue"
          value={`$${(overview.arr / 100).toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          title="Active Subscriptions"
          value={overview.activeSubscriptions.toString()}
          icon={<Users className="w-5 h-5" />}
        />
        <MetricCard
          title="Churn Rate"
          value={`${overview.churnRate.toFixed(1)}%`}
          icon={<Activity className="w-5 h-5" />}
          isNegativeGood
        />
      </div>
      
      {/* Secondary Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Revenue Per User</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${(overview.arpu / 100).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${(overview.ltv / 100).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">average per customer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge>Starter: {overview.subscriptionsByPlan.starter}</Badge>
              <Badge variant="secondary">Pro: {overview.subscriptionsByPlan.pro}</Badge>
              <Badge variant="outline">Enterprise: {overview.subscriptionsByPlan.enterprise}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Agencies */}
      <Card>
        <CardHeader>
          <CardTitle>Top Agencies by Revenue</CardTitle>
          <CardDescription>Highest paying customers this month</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agency</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="text-right">Usage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.topAgencies.map((agency) => (
                <TableRow key={agency.id}>
                  <TableCell className="font-medium">{agency.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {agency.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ${(agency.mrr / 100).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {agency.usage.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  isNegativeGood?: boolean;
}

function MetricCard({ title, value, change, icon, isNegativeGood }: MetricCardProps) {
  const isPositive = change !== undefined && (isNegativeGood ? change < 0 : change > 0);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(change).toFixed(1)}%</span>
            <span className="text-muted-foreground ml-1">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Dunning & Recovery

### Failed Payment Handler

```typescript
// src/lib/paddle/dunning-service.ts

import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email';

export interface DunningConfig {
  maxRetries: number;
  retryIntervals: number[]; // days between retries
  gracePeriod: number;      // days before downgrade
  downgradeAction: 'cancel' | 'downgrade' | 'pause';
}

const DEFAULT_CONFIG: DunningConfig = {
  maxRetries: 4,
  retryIntervals: [1, 3, 5, 7], // retry after 1, 3, 5, 7 days
  gracePeriod: 14,
  downgradeAction: 'pause',
};

export class DunningService {
  private config: DunningConfig;
  
  constructor(config: Partial<DunningConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailed(subscriptionId: string, transactionId: string): Promise<void> {
    const supabase = createServiceClient();
    
    // Get subscription details
    const { data: sub } = await supabase
      .from('paddle_subscriptions')
      .select(`
        *,
        customer:paddle_customers(*),
        agency:agencies(id, name, owner_email)
      `)
      .eq('paddle_subscription_id', subscriptionId)
      .single();
    
    if (!sub) return;
    
    // Get retry count
    const retryCount = (sub.metadata?.dunning_retry_count || 0) + 1;
    
    // Update subscription metadata
    await supabase
      .from('paddle_subscriptions')
      .update({
        status: 'past_due',
        metadata: {
          ...sub.metadata,
          dunning_retry_count: retryCount,
          last_failed_at: new Date().toISOString(),
          last_failed_transaction: transactionId,
        }
      })
      .eq('id', sub.id);
    
    // Send appropriate email based on retry count
    if (retryCount === 1) {
      await this.sendPaymentFailedEmail(sub.agency.owner_email, sub.agency.name, 'first');
    } else if (retryCount === 2) {
      await this.sendPaymentFailedEmail(sub.agency.owner_email, sub.agency.name, 'second');
    } else if (retryCount === 3) {
      await this.sendPaymentFailedEmail(sub.agency.owner_email, sub.agency.name, 'urgent');
    } else if (retryCount >= this.config.maxRetries) {
      await this.handleMaxRetriesReached(sub.id, sub.agency);
    }
    
    // Create notification
    await supabase
      .from('notifications')
      .insert({
        agency_id: sub.agency.id,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `We couldn't process your payment. Please update your payment method.`,
        priority: retryCount >= 3 ? 'high' : 'medium',
        action_url: '/dashboard/settings/billing'
      });
  }

  /**
   * Handle payment success (recovery)
   */
  async handlePaymentRecovered(subscriptionId: string): Promise<void> {
    const supabase = createServiceClient();
    
    const { data: sub } = await supabase
      .from('paddle_subscriptions')
      .select('*, agency:agencies(id, name, owner_email)')
      .eq('paddle_subscription_id', subscriptionId)
      .single();
    
    if (!sub) return;
    
    // Clear dunning state
    await supabase
      .from('paddle_subscriptions')
      .update({
        status: 'active',
        metadata: {
          ...sub.metadata,
          dunning_retry_count: 0,
          last_failed_at: null,
          recovered_at: new Date().toISOString(),
        }
      })
      .eq('id', sub.id);
    
    // Send recovery email
    await sendEmail({
      to: sub.agency.owner_email,
      subject: 'Payment Successful - Your subscription is active!',
      template: 'payment-recovered',
      data: {
        agencyName: sub.agency.name,
      }
    });
  }

  /**
   * Handle max retries reached
   */
  private async handleMaxRetriesReached(
    subscriptionId: string,
    agency: { id: string; name: string; owner_email: string }
  ): Promise<void> {
    const supabase = createServiceClient();
    
    switch (this.config.downgradeAction) {
      case 'cancel':
        await supabase
          .from('paddle_subscriptions')
          .update({ status: 'canceled' })
          .eq('id', subscriptionId);
        break;
        
      case 'downgrade':
        // Downgrade to free tier or starter
        await supabase
          .from('paddle_subscriptions')
          .update({ 
            status: 'active',
            plan_type: 'free',
            included_automation_runs: 100,
            included_ai_actions: 50,
            included_api_calls: 1000,
          })
          .eq('id', subscriptionId);
        break;
        
      case 'pause':
        await supabase
          .from('paddle_subscriptions')
          .update({ 
            status: 'paused',
            paused_at: new Date().toISOString()
          })
          .eq('id', subscriptionId);
        break;
    }
    
    await this.sendFinalNoticeEmail(agency.owner_email, agency.name);
  }

  /**
   * Send payment failed emails
   */
  private async sendPaymentFailedEmail(
    email: string,
    agencyName: string,
    severity: 'first' | 'second' | 'urgent'
  ): Promise<void> {
    const subjects = {
      first: 'Action Required: Payment Failed',
      second: 'Reminder: Please Update Your Payment Method',
      urgent: 'URGENT: Your account will be suspended',
    };
    
    await sendEmail({
      to: email,
      subject: subjects[severity],
      template: `payment-failed-${severity}`,
      data: {
        agencyName,
        updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
        supportEmail: 'support@dramac.io',
      }
    });
  }

  /**
   * Send final notice email
   */
  private async sendFinalNoticeEmail(email: string, agencyName: string): Promise<void> {
    await sendEmail({
      to: email,
      subject: 'Your DRAMAC subscription has been paused',
      template: 'subscription-paused',
      data: {
        agencyName,
        reactivateUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
      }
    });
  }
}

export const dunningService = new DunningService();
```

---

## Enterprise Features

### Enterprise Quotation System

```typescript
// src/lib/paddle/enterprise-service.ts

import { createServiceClient } from '@/lib/supabase/service';
import { paddle } from './client';

export interface EnterpriseQuote {
  id: string;
  agencyId: string;
  contactName: string;
  contactEmail: string;
  companyName: string;
  requirements: {
    estimatedUsers: number;
    estimatedSites: number;
    estimatedMonthlyUsage: {
      automationRuns: number;
      aiActions: number;
      apiCalls: number;
    };
    features: string[];
    additionalNotes: string;
  };
  proposedPricing: {
    basePrice: number;
    usageIncluded: {
      automationRuns: number;
      aiActions: number;
      apiCalls: number;
    };
    discountPercent: number;
    totalMonthly: number;
    totalAnnual: number;
  };
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: Date;
  createdAt: Date;
}

export class EnterpriseService {
  /**
   * Create enterprise quote
   */
  async createQuote(params: {
    contactName: string;
    contactEmail: string;
    companyName: string;
    requirements: EnterpriseQuote['requirements'];
  }): Promise<EnterpriseQuote> {
    const supabase = createServiceClient();
    
    // Calculate proposed pricing based on requirements
    const proposedPricing = this.calculateEnterprisePricing(params.requirements);
    
    const { data, error } = await supabase
      .from('enterprise_quotes')
      .insert({
        contact_name: params.contactName,
        contact_email: params.contactEmail,
        company_name: params.companyName,
        requirements: params.requirements,
        proposed_pricing: proposedPricing,
        status: 'draft',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return this.mapQuote(data);
  }

  /**
   * Calculate enterprise pricing
   */
  private calculateEnterprisePricing(requirements: EnterpriseQuote['requirements']): EnterpriseQuote['proposedPricing'] {
    // Base price calculation
    let basePrice = 999; // Starting enterprise price
    
    // Add for users
    if (requirements.estimatedUsers > 50) {
      basePrice += Math.ceil((requirements.estimatedUsers - 50) / 10) * 50;
    }
    
    // Add for sites
    if (requirements.estimatedSites > 20) {
      basePrice += Math.ceil((requirements.estimatedSites - 20) / 5) * 25;
    }
    
    // Volume discount
    let discountPercent = 0;
    if (basePrice >= 5000) discountPercent = 20;
    else if (basePrice >= 2500) discountPercent = 15;
    else if (basePrice >= 1500) discountPercent = 10;
    
    const totalMonthly = basePrice * (1 - discountPercent / 100);
    const totalAnnual = totalMonthly * 12 * 0.83; // Additional annual discount
    
    // Included usage (generous for enterprise)
    const usageMultiplier = Math.max(1, requirements.estimatedUsers / 20);
    
    return {
      basePrice: basePrice * 100, // cents
      usageIncluded: {
        automationRuns: Math.round(100000 * usageMultiplier),
        aiActions: Math.round(50000 * usageMultiplier),
        apiCalls: Math.round(1000000 * usageMultiplier),
      },
      discountPercent,
      totalMonthly: Math.round(totalMonthly * 100),
      totalAnnual: Math.round(totalAnnual * 100),
    };
  }

  /**
   * Send quote to customer
   */
  async sendQuote(quoteId: string): Promise<void> {
    const supabase = createServiceClient();
    
    const { data: quote } = await supabase
      .from('enterprise_quotes')
      .select('*')
      .eq('id', quoteId)
      .single();
    
    if (!quote) throw new Error('Quote not found');
    
    // Update status
    await supabase
      .from('enterprise_quotes')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', quoteId);
    
    // Send email with quote details
    // Implementation depends on your email service
  }

  /**
   * Accept quote and create subscription
   */
  async acceptQuote(quoteId: string): Promise<string> {
    const supabase = createServiceClient();
    
    const { data: quote } = await supabase
      .from('enterprise_quotes')
      .select('*')
      .eq('id', quoteId)
      .single();
    
    if (!quote) throw new Error('Quote not found');
    if (quote.status !== 'sent') throw new Error('Quote not in valid state');
    if (new Date(quote.valid_until) < new Date()) throw new Error('Quote expired');
    
    // Create custom product in Paddle
    const product = await paddle.products.create({
      name: `Enterprise - ${quote.company_name}`,
      description: 'Custom enterprise plan',
    });
    
    // Create custom price
    const price = await paddle.prices.create({
      productId: product.id,
      description: `Monthly subscription for ${quote.company_name}`,
      unitPrice: {
        amount: quote.proposed_pricing.total_monthly.toString(),
        currencyCode: 'USD',
      },
      billingCycle: {
        interval: 'month',
        frequency: 1,
      },
    });
    
    // Update quote status
    await supabase
      .from('enterprise_quotes')
      .update({ 
        status: 'accepted',
        paddle_product_id: product.id,
        paddle_price_id: price.id,
      })
      .eq('id', quoteId);
    
    // Return checkout URL
    return price.id;
  }

  private mapQuote(data: any): EnterpriseQuote {
    return {
      id: data.id,
      agencyId: data.agency_id,
      contactName: data.contact_name,
      contactEmail: data.contact_email,
      companyName: data.company_name,
      requirements: data.requirements,
      proposedPricing: data.proposed_pricing,
      status: data.status,
      validUntil: new Date(data.valid_until),
      createdAt: new Date(data.created_at),
    };
  }
}

export const enterpriseService = new EnterpriseService();
```

---

## API Routes

### Billing API Routes

```typescript
// src/app/api/billing/subscription/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/paddle/subscription-service';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const subscription = await subscriptionService.getSubscription(session.user.agencyId);
    
    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }
    
    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/billing/subscription/cancel/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/paddle/subscription-service';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { immediately } = await request.json();
    
    await subscriptionService.cancelSubscription(
      session.user.agencyId,
      immediately === true
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/billing/usage/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { usageTracker } from '@/lib/paddle/usage-tracker';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const usage = await usageTracker.getCurrentUsage(session.user.agencyId);
    
    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/billing/invoices/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/paddle/subscription-service';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const invoices = await subscriptionService.getInvoices(
      session.user.agencyId,
      limit
    );
    
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
```

---

## Testing Guide

### Testing Checklist

```markdown
## Paddle Integration Testing Checklist

### 1. Sandbox Setup
- [ ] Create Paddle sandbox account
- [ ] Create test products and prices
- [ ] Configure webhook endpoint
- [ ] Set up test environment variables

### 2. Checkout Flow
- [ ] Test monthly subscription checkout
- [ ] Test yearly subscription checkout
- [ ] Verify customer creation
- [ ] Verify subscription creation
- [ ] Test discount codes

### 3. Webhook Events
- [ ] subscription.created
- [ ] subscription.updated
- [ ] subscription.canceled
- [ ] subscription.paused
- [ ] subscription.resumed
- [ ] transaction.completed
- [ ] transaction.payment_failed
- [ ] customer.created
- [ ] customer.updated

### 4. Subscription Management
- [ ] View subscription details
- [ ] Update payment method
- [ ] Change plan (upgrade)
- [ ] Change plan (downgrade)
- [ ] Cancel subscription
- [ ] Pause subscription
- [ ] Resume subscription

### 5. Usage Tracking
- [ ] Record automation run
- [ ] Record AI action
- [ ] Record API call
- [ ] Verify usage aggregation
- [ ] Test overage calculation
- [ ] Test overage billing

### 6. Invoice & Billing
- [ ] View invoice history
- [ ] Download invoice PDF
- [ ] Test renewal billing
- [ ] Test overage charges

### 7. Dunning & Recovery
- [ ] Test payment failure handling
- [ ] Verify retry emails
- [ ] Test payment recovery
- [ ] Test account pause after max retries

### 8. Admin Features
- [ ] View billing overview
- [ ] View subscription list
- [ ] View revenue metrics
- [ ] Manual subscription adjustments
```

### Test Utilities

```typescript
// src/lib/paddle/__tests__/test-utils.ts

import { paddle } from '../client';

// Test credit card numbers (Paddle sandbox)
export const TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficient_funds: '4000000000009995',
  expired: '4000000000000069',
};

// Create test subscription
export async function createTestSubscription(
  customerId: string,
  priceId: string
): Promise<string> {
  // Note: In sandbox, you can create subscriptions directly
  // In production, this would go through checkout
  const subscription = await paddle.subscriptions.create({
    customerId,
    items: [{ priceId, quantity: 1 }],
  });
  
  return subscription.id;
}

// Simulate webhook event
export function simulateWebhook(eventType: string, data: any): any {
  return {
    eventId: `evt_test_${Date.now()}`,
    eventType,
    occurredAt: new Date().toISOString(),
    data,
  };
}
```

---

## Deployment Checklist

```markdown
## Paddle Billing Deployment Checklist

### Pre-Deployment
- [ ] Paddle production account created
- [ ] Products and prices created in Paddle dashboard
- [ ] Webhook secret generated
- [ ] Payoneer/Wise account linked for payouts
- [ ] Tax settings configured

### Environment Variables
- [ ] PADDLE_API_KEY (production key)
- [ ] PADDLE_WEBHOOK_SECRET
- [ ] PADDLE_ENVIRONMENT=production
- [ ] All PADDLE_PRICE_* variables
- [ ] NEXT_PUBLIC_PADDLE_CLIENT_TOKEN

### Database
- [ ] Migration run (em-59-paddle-billing.sql)
- [ ] Products seeded
- [ ] RLS policies verified

### Code Deployment
- [ ] paddle client configured
- [ ] Webhook endpoint deployed
- [ ] All billing pages deployed
- [ ] Usage tracking integrated

### Webhook Configuration
- [ ] Webhook URL added in Paddle dashboard
- [ ] All required events subscribed
- [ ] Signature verification working

### Testing in Production
- [ ] Test checkout with real card (refund after)
- [ ] Verify webhook delivery
- [ ] Check subscription created
- [ ] Verify invoice generation

### Monitoring
- [ ] Error alerting configured
- [ ] Webhook delivery monitoring
- [ ] Revenue dashboards set up
- [ ] Usage metrics tracking

### Documentation
- [ ] Team trained on billing system
- [ ] Customer support documentation
- [ ] Refund procedures documented
- [ ] Escalation procedures defined
```

---

## Files That Need Updates for Hybrid Model

When implementing the Simple Hybrid pricing model, these existing files need updates:

| File | Required Changes |
|------|------------------|
| `src/types/billing.ts` | Add Paddle types, usage tracking types |
| `src/lib/actions/billing.ts` | Replace LemonSqueezy calls with Paddle |
| `src/components/billing/pricing-plans.tsx` | Update UI for new pricing structure |
| `src/components/billing/subscription-card.tsx` | Update for Paddle data |
| `src/components/billing/subscription-banner.tsx` | Update status display |
| `src/lib/modules/services/pricing-service.ts` | Replace `lemon_*` with `paddle_*` |
| `src/app/dashboard/settings/billing/page.tsx` | Integrate new components |

### New Files Required

| File | Purpose |
|------|---------|
| `src/lib/paddle/client.ts` | Paddle SDK initialization |
| `src/lib/paddle/paddle-client.ts` | Frontend Paddle.js |
| `src/lib/paddle/subscription-service.ts` | Subscription management |
| `src/lib/paddle/usage-tracker.ts` | Usage recording & tracking |
| `src/lib/paddle/webhook-handlers.ts` | Event processing |
| `src/lib/paddle/dunning-service.ts` | Failed payment handling |
| `src/app/api/webhooks/paddle/route.ts` | Webhook endpoint |
| `src/app/api/billing/*/route.ts` | Various billing API routes |
| `src/components/billing/usage-dashboard.tsx` | Usage visualization |
| `src/components/billing/pricing-card.tsx` | New pricing card component |
| `migrations/em-59-paddle-billing.sql` | Database schema |

---

## Summary

This completes the Paddle billing integration specification. Key features:

1. **Complete LemonSqueezy → Paddle Migration**
   - Database schema with all necessary tables
   - Customer and subscription management
   - Invoice and transaction tracking

2. **Hybrid Pricing Model**
   - Base subscription tiers (Starter $29, Pro $99)
   - Usage-based overage billing
   - Real-time usage tracking

3. **Full UI Components**
   - Pricing page with plan comparison
   - Usage dashboard with projections
   - Subscription management
   - Invoice history

4. **Admin Features**
   - Revenue dashboard
   - Subscription analytics
   - Enterprise quotation system

5. **Dunning & Recovery**
   - Automated payment failure handling
   - Email sequence for recovery
   - Graceful degradation

6. **Zambia Payment Support**
   - Paddle → Payoneer/Wise → Local Bank
   - Complete payout setup instructions

---

*Document Version: 1.0*  
*Created: 2026-01-24*  
*Phase Status: Specification Complete*
