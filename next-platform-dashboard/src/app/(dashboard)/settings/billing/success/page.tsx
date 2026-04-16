/**
 * Billing Checkout Success Page
 *
 * Phase BIL-03: Subscription Checkout & Trial
 *
 * Shown after successful Paddle checkout or trial activation.
 * Displays success animation, plan details, and trial countdown if applicable.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_CONFIGS, formatPrice } from "@/lib/paddle/client";

interface SuccessPageProps {
  searchParams: Promise<{
    plan?: string;
    cycle?: string;
    trial?: string;
  }>;
}

export default async function BillingSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const planType = params.plan || "growth";
  const billingCycle = params.cycle || "monthly";
  const isTrial = params.trial === "true";

  const planKey = `${planType}_${billingCycle}`;
  const planConfig = PLAN_CONFIGS[planKey];
  const planName =
    planConfig?.name || planType.charAt(0).toUpperCase() + planType.slice(1);
  const planAmount = planConfig?.amount || 0;

  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 14);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {isTrial ? "Your Trial Has Started!" : "Welcome to DM Suite!"}
            </h1>
            <p className="text-muted-foreground">
              {isTrial
                ? "Enjoy 14 days of Growth plan features — no credit card required."
                : `You're now on the ${planName} plan.`}
            </p>
          </div>

          {/* Plan Details */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{planName} Plan</span>
              <Badge variant={isTrial ? "secondary" : "default"}>
                {isTrial ? (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    14-Day Trial
                  </>
                ) : billingCycle === "yearly" ? (
                  "Annual"
                ) : (
                  "Monthly"
                )}
              </Badge>
            </div>
            {!isTrial && planAmount > 0 && (
              <div className="text-sm text-muted-foreground">
                {formatPrice(planAmount)}/
                {billingCycle === "yearly" ? "year" : "month"}
              </div>
            )}
            {isTrial && (
              <div className="text-sm text-muted-foreground">
                Trial ends on{" "}
                {trialEndDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}

            {/* Plan Features Summary */}
            {planConfig && (
              <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                <div className="text-muted-foreground">Sites</div>
                <div className="font-medium text-right">
                  {planConfig.limits.sites}
                </div>
                <div className="text-muted-foreground">Team Members</div>
                <div className="font-medium text-right">
                  {planConfig.limits.teamMembers}
                </div>
                <div className="text-muted-foreground">AI Actions/mo</div>
                <div className="font-medium text-right">
                  {planConfig.includedUsage.aiActions.toLocaleString()}
                </div>
                <div className="text-muted-foreground">Email Sends/mo</div>
                <div className="font-medium text-right">
                  {planConfig.includedUsage.emailSends.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button asChild size="lg" className="w-full">
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>

          {/* Secondary link */}
          <p className="text-sm text-muted-foreground">
            <Link
              href="/settings/billing"
              className="underline hover:text-foreground"
            >
              View billing settings
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
