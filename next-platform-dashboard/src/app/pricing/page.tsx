/**
 * Pricing Page
 *
 * Phase BIL-02: Pricing Page Redesign
 *
 * Public pricing page showing 3 tiers:
 * - Starter ($29/mo)
 * - Growth ($79/mo) - Most Popular, 14-day free trial
 * - Agency ($149/mo) - White-label
 *
 * Features billing cycle toggle, plan comparison table, overage pricing, and FAQ.
 *
 * @see phases/PHASE-BIL-MASTER-GUIDE.md
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PricingCard,
  type PricingPlan,
} from "@/components/billing/pricing-card";
import { BillingCycleToggle } from "@/components/billing/billing-cycle-toggle";
import { PlanComparisonTable } from "@/components/billing/plan-comparison-table";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// Plan Configuration (V5 — 3-tier model)
// ============================================================================

const PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for freelancers and small teams getting started",
    priceMonthly: 29,
    priceYearly: 290,
    paddlePriceIdMonthly:
      process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY || "",
    paddlePriceIdYearly:
      process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY || "",
    features: [
      "All 7 modules included",
      "5 websites",
      "3 team members",
      "Custom domains",
      "Ask Chiko assistant",
      "Community support",
    ],
    usage: {
      automationRuns: 2000,
      aiActions: 1000,
      emailSends: 2000,
      fileStorageMb: 5120,
    },
    limits: {
      sites: 5,
      teamMembers: 3,
    },
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing agencies that need more power and flexibility",
    priceMonthly: 79,
    priceYearly: 790,
    paddlePriceIdMonthly:
      process.env.NEXT_PUBLIC_PADDLE_PRICE_GROWTH_MONTHLY || "",
    paddlePriceIdYearly:
      process.env.NEXT_PUBLIC_PADDLE_PRICE_GROWTH_YEARLY || "",
    features: [
      "All 7 modules included",
      "15 websites",
      "8 team members",
      "Custom domains",
      "Ask Chiko assistant",
      "14-day free trial",
      "Priority email support",
    ],
    usage: {
      automationRuns: 15000,
      aiActions: 3000,
      emailSends: 10000,
      fileStorageMb: 20480,
    },
    limits: {
      sites: 15,
      teamMembers: 8,
    },
    popular: true,
    trialDays: 14,
  },
  {
    id: "agency",
    name: "Agency",
    description: "Full white-label for established agencies at scale",
    priceMonthly: 149,
    priceYearly: 1490,
    paddlePriceIdMonthly:
      process.env.NEXT_PUBLIC_PADDLE_PRICE_AGENCY_MONTHLY || "",
    paddlePriceIdYearly:
      process.env.NEXT_PUBLIC_PADDLE_PRICE_AGENCY_YEARLY || "",
    features: [
      "All 7 modules included",
      "30 websites",
      "20 team members",
      "Custom domains",
      "Ask Chiko assistant",
      "Full white-label",
      "Custom dashboard domain",
      "Priority + chat support",
    ],
    usage: {
      automationRuns: 75000,
      aiActions: 15000,
      emailSends: 40000,
      fileStorageMb: 76800,
    },
    limits: {
      sites: 30,
      teamMembers: 20,
    },
    whiteLabel: true,
  },
];

// ============================================================================
// Page Component
// ============================================================================

function PricingContent() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly",
  );
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
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setIsLoggedIn(true);
          setUserEmail(user.email || null);

          // Get agency ID from profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("agency_id")
            .eq("id", user.id)
            .single();

          if (profile?.agency_id) {
            setAgencyId(profile.agency_id);
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  // Handle plan selection callback
  const handlePlanSelect = (planId: string) => {
    console.log("Plan selected:", planId);
    // Checkout will be handled by Paddle
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
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
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
            All 7 modules included on every plan. No feature gates &mdash;
            differentiation through scale and support only.
          </p>
          <p className="text-sm text-muted-foreground">
            Still 70% cheaper than GoHighLevel. Built for agencies in Zambia and
            worldwide.
          </p>
        </div>

        {/* Billing Toggle */}
        <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
        </div>

        {/* Enterprise CTA */}
        <div className="mt-12 max-w-3xl mx-auto text-center p-8 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-bold mb-2">Need more?</h3>
          <p className="text-muted-foreground mb-4">
            For large organizations with 50+ sites, custom SLAs, or dedicated
            infrastructure.
          </p>
          <Button variant="outline" asChild>
            <Link href="/portal/support/new?subject=Enterprise%20plan%20inquiry">
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Us for Custom Pricing
            </Link>
          </Button>
        </div>

        {/* Full Feature Comparison */}
        <div className="mt-20 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Full Feature Comparison
          </h2>
          <PlanComparisonTable />
        </div>

        {/* Overage Pricing */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">
            Pay Only for What You Use
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Overage is charged only when you exceed your included limits. Keep
            building &mdash; we never cut you off.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <p className="font-semibold mb-1">Automation Runs</p>
              <p className="text-2xl font-bold">$2</p>
              <p className="text-sm text-muted-foreground">per 1,000 runs</p>
              <p className="text-xs text-green-600 mt-1">Agency: $1 per 1K</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="font-semibold mb-1">AI Actions</p>
              <p className="text-2xl font-bold">$10</p>
              <p className="text-sm text-muted-foreground">per 1,000 actions</p>
              <p className="text-xs text-green-600 mt-1">Agency: $8 per 1K</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="font-semibold mb-1">Email Sends</p>
              <p className="text-2xl font-bold">$2</p>
              <p className="text-sm text-muted-foreground">per 1,000 sends</p>
              <p className="text-xs text-green-600 mt-1">
                Agency: $1.50 per 1K
              </p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="font-semibold mb-1">File Storage</p>
              <p className="text-2xl font-bold">$0.50</p>
              <p className="text-sm text-muted-foreground">per GB/month</p>
              <p className="text-xs text-green-600 mt-1">Agency: $0.40/GB</p>
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
              answer="We'll continue processing your requests and charge overage at the rates shown above. You'll receive email notifications as you approach 80% and 100% of your limits."
            />
            <FAQItem
              question="Can I switch plans anytime?"
              answer="Yes! Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing period."
            />
            <FAQItem
              question="How does the free trial work?"
              answer="The Growth plan includes a 14-day free trial. No credit card required to start. After the trial, you'll be prompted to choose a plan."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards, PayPal, Apple Pay, and Google Pay. Payments are processed securely through Paddle."
            />
            <FAQItem
              question="Is there a contract or commitment?"
              answer="No long-term contracts. Monthly plans can be canceled anytime. Annual plans are billed upfront for the year but can still be canceled (remaining time is not refunded)."
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
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
