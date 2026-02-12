/**
 * Pricing Page
 * 
 * Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations
 * 
 * Public pricing page showing all plans:
 * - Starter Plan ($29/mo)
 * - Pro Plan ($99/mo) - Most Popular
 * - Enterprise (Custom)
 * 
 * Features billing cycle toggle, overage pricing, and FAQ.
 * 
 * @see phases/enterprise-modules/PHASE-EM-59B-PADDLE-BILLING.md
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PricingCard, type PricingPlan } from '@/components/billing/pricing-card';
import { BillingCycleToggle } from '@/components/billing/billing-cycle-toggle';
import { Button } from '@/components/ui/button';
import { Check, MessageCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// Plan Configuration
// ============================================================================

const PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    priceMonthly: 29,
    priceYearly: 290,
    paddlePriceIdMonthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY || '',
    paddlePriceIdYearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY || '',
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
    paddlePriceIdMonthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY || '',
    paddlePriceIdYearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY || '',
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

// ============================================================================
// Page Component
// ============================================================================

function PricingContent() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Check authentication state on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setIsLoggedIn(true);
          setUserEmail(user.email || null);
          
          // Get agency ID from profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('agency_id')
            .eq('id', user.id)
            .single();
          
          if (profile?.agency_id) {
            setAgencyId(profile.agency_id);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);
  
  // Handle plan selection callback
  const handlePlanSelect = (planId: string) => {
    console.log('Plan selected:', planId);
    // Checkout will be handled by Paddle
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLoggedIn ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/settings/billing">Billing Settings</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works for your business. 
            All plans include core features with usage-based billing for what you actually use.
          </p>
        </div>
        
        {/* Billing Toggle */}
        <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              agencyId={agencyId || undefined}
              email={userEmail || undefined}
              onSelect={handlePlanSelect}
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
                asChild
              >
                <Link href="/portal/support/new?subject=Enterprise plan inquiry">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Sales
                </Link>
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
              <p className="text-2xl font-bold">US$0.001</p>
              <p className="text-sm text-muted-foreground">per run over limit</p>
              <p className="text-xs text-green-600 mt-1">Pro: US$0.0005 (50% off)</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="font-semibold">AI Actions</p>
              <p className="text-2xl font-bold">US$0.005</p>
              <p className="text-sm text-muted-foreground">per action over limit</p>
              <p className="text-xs text-green-600 mt-1">Pro: US$0.0025 (50% off)</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="font-semibold">API Calls</p>
              <p className="text-2xl font-bold">US$0.0001</p>
              <p className="text-sm text-muted-foreground">per call over limit</p>
              <p className="text-xs text-green-600 mt-1">Pro: US$0.00005 (50% off)</p>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            <FAQItem 
              question="What happens when I exceed my usage limits?"
              answer="We'll continue processing your requests and charge overage at the rates above. You'll receive notifications as you approach your limits."
            />
            <FAQItem 
              question="Can I upgrade or downgrade anytime?"
              answer="Yes! You can change your plan at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your billing period."
            />
            <FAQItem 
              question="Do you offer a free trial?"
              answer="Yes, we offer a 14-day free trial on all plans. No credit card required to start. You can explore all features before committing."
            />
            <FAQItem 
              question="What payment methods do you accept?"
              answer="We accept all major credit cards, PayPal, and wire transfer for Enterprise plans. Payments are processed securely through Paddle."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Page Export with Suspense Boundary
// ============================================================================

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingLoadingSkeleton />}>
      <PricingContent />
    </Suspense>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function PricingLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-muted rounded animate-pulse" />
            <div className="h-9 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="h-10 w-80 bg-muted rounded mx-auto mb-4 animate-pulse" />
          <div className="h-6 w-96 bg-muted rounded mx-auto animate-pulse" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FAQ Item Component
// ============================================================================

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  );
}
