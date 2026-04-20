"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { createBusinessEmailOrder } from "@/lib/actions/business-email";
import { useEmailPricing } from "@/hooks/use-email-pricing";
import { openPaddleTransactionCheckout } from "@/lib/paddle/paddle-client";
import { formatCurrency } from "@/lib/locale-config";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  Tag,
  TrendingDown,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
  Mail,
  Shield,
  HardDrive,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Plan Metadata (static display data — pricing comes from the API)
// Any plan key returned by the API will be shown. Keys not in this map
// get a sensible auto-generated name based on their product key string.
// ============================================================================

interface PlanMeta {
  name: string;
  tagline: string;
  storageGB: number;
  isPopular: boolean;
  features: string[];
}

// Known plan metadata keyed by RC product key
// Includes both legacy keys (eeliteus) and Titan Mail synthetic keys (titanmailglobal_<planId>)
const KNOWN_PLANS: Record<string, PlanMeta> = {
  // ── Titan Mail keys (new REST API — /restapi/product/titanmailglobal/) ──
  // Synthetic keys created by flattenTitanMailPricing: titanmailglobal_<planId>
  titanmailglobal_1762: {
    name: "Professional",
    tagline: "For individuals & freelancers",
    storageGB: 5,
    isPopular: false,
    features: [
      "5 GB storage per mailbox",
      "Custom domain email",
      "Webmail & mobile apps",
      "Calendar & contacts sync",
      "Anti-spam & virus protection",
    ],
  },
  titanmailglobal_1756: {
    name: "Business",
    tagline: "For individuals & small teams",
    storageGB: 10,
    isPopular: false,
    features: [
      "10 GB storage per mailbox",
      "Custom domain email",
      "Webmail & mobile apps",
      "Calendar & contacts sync",
      "Anti-spam & virus protection",
    ],
  },
  titanmailglobal_1757: {
    name: "Enterprise",
    tagline: "For growing businesses",
    storageGB: 50,
    isPopular: true,
    features: [
      "50 GB storage per mailbox",
      "Custom domain email",
      "Webmail & mobile apps",
      "Calendar & contacts sync",
      "Anti-spam & virus protection",
      "Priority 24/7 support",
      "Advanced admin controls",
    ],
  },
  // India variants
  titanmailindia_1761: {
    name: "Professional",
    tagline: "For individuals & freelancers",
    storageGB: 5,
    isPopular: false,
    features: [
      "5 GB storage per mailbox",
      "Custom domain email",
      "Webmail & mobile apps",
      "Calendar & contacts sync",
      "Anti-spam & virus protection",
    ],
  },
  titanmailindia_1758: {
    name: "Business",
    tagline: "For individuals & small teams",
    storageGB: 10,
    isPopular: false,
    features: [
      "10 GB storage per mailbox",
      "Custom domain email",
      "Webmail & mobile apps",
      "Calendar & contacts sync",
      "Anti-spam & virus protection",
    ],
  },
  titanmailindia_1759: {
    name: "Enterprise",
    tagline: "For growing businesses",
    storageGB: 50,
    isPopular: true,
    features: [
      "50 GB storage per mailbox",
      "Custom domain email",
      "Webmail & mobile apps",
      "Calendar & contacts sync",
      "Anti-spam & virus protection",
      "Priority 24/7 support",
      "Advanced admin controls",
    ],
  },
  // ── Legacy Business Email keys ──
  eeliteus: {
    name: "Business",
    tagline: "For individuals & small teams",
    storageGB: 10,
    isPopular: false,
    features: [
      "10 GB storage per mailbox",
      "Custom domain email",
      "Webmail & mobile apps",
      "Calendar & contacts sync",
      "Anti-spam & virus protection",
    ],
  },
  // ── Legacy Enterprise Email keys ──
  enterpriseemailus: {
    name: "Enterprise",
    tagline: "For growing businesses",
    storageGB: 50,
    isPopular: true,
    features: [
      "50 GB storage per mailbox",
      "Custom domain email",
      "Webmail & mobile apps",
      "Calendar & contacts sync",
      "Anti-spam & virus protection",
      "Priority 24/7 support",
      "Advanced admin controls",
    ],
  },
};

/**
 * Resolve display metadata for a plan key.
 * Returns the known metadata or generates a sensible fallback.
 */
function resolvePlanMeta(key: string): PlanMeta {
  if (KNOWN_PLANS[key]) return KNOWN_PLANS[key];

  // Try to extract plan name from Titan Mail synthetic keys (titanmailglobal_<planId>)
  const titanMatch = key.match(/^titanmail(?:global|india)_(\d+)$/);
  if (titanMatch) {
    const planId = parseInt(titanMatch[1], 10);
    const PLAN_NAMES: Record<number, { name: string; storage: number }> = {
      1762: { name: "Professional", storage: 5 },
      1761: { name: "Professional", storage: 5 },
      1756: { name: "Business", storage: 10 },
      1758: { name: "Business", storage: 10 },
      1757: { name: "Enterprise", storage: 50 },
      1759: { name: "Enterprise", storage: 50 },
      1755: { name: "Business (Trial)", storage: 10 },
      1760: { name: "Business (Trial)", storage: 10 },
    };
    const plan = PLAN_NAMES[planId];
    if (plan) {
      return {
        name: plan.name,
        tagline:
          plan.name === "Professional"
            ? "For individuals & freelancers"
            : plan.name === "Business"
              ? "For individuals & small teams"
              : "For growing businesses",
        storageGB: plan.storage,
        isPopular: plan.name === "Enterprise",
        features: [
          `${plan.storage} GB storage per mailbox`,
          "Custom domain email",
          "Webmail & mobile apps",
          "Calendar & contacts sync",
          "Anti-spam & virus protection",
          ...(plan.name === "Enterprise"
            ? ["Priority 24/7 support", "Advanced admin controls"]
            : []),
        ],
      };
    }
  }

  // Auto-generate for unknown keys (e.g. newly added plans from the provider)
  const humanName =
    key
      .replace(/us$|in$|uk$/, "") // strip region suffix
      .replace(/eelite/, "Business")
      .replace(/enterprise(email)?/, "Enterprise")
      .replace(/titanmail(global|india)?_?\d*/, "Email")
      .replace(/[_-]/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .trim()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || "Email";
  return {
    name: humanName,
    tagline: "Professional email hosting",
    storageGB: 0,
    isPopular: false,
    features: [
      "Custom domain email",
      "Webmail & mobile apps",
      "Calendar & contacts sync",
      "Anti-spam & virus protection",
    ],
  };
}

/**
 * Extract the Titan Mail plan-id from a synthetic key like `titanmailglobal_1762`.
 * Returns null for non-Titan keys.
 */
function extractPlanId(key: string): number | null {
  const match = key.match(/^titanmail(?:global|india)_(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

// ============================================================================
// Types & Pricing Helpers
// ============================================================================

interface SlabPricing {
  add: Record<string, number>; // months → per-account per-MONTH price for that tenure
  renew: Record<string, number>; // months → per-account per-MONTH renewal price
}

interface StructuredPricing {
  slabs: Record<string, SlabPricing>;
}

/**
 * Parse the RC pricing response for a single product key.
 * RC structure: { "eeliteus": { "email_account_ranges": { "1-5": { "add": { "1": 0.86 }, "renew": {...} } } } }
 * Prices = per-account PER-MONTH rates for the given tenure length.
 * e.g. add["12"] = $0.42 means $0.42/account/month when billed annually.
 */
function parsePlanPricing(
  data: Record<string, unknown>,
  planKey: string,
): StructuredPricing | null {
  const product = data[planKey] as Record<string, unknown> | undefined;
  const ranges = product?.email_account_ranges as
    | Record<string, Record<string, Record<string, number>>>
    | undefined;

  if (!ranges || typeof ranges !== "object") return null;

  const slabs: Record<string, SlabPricing> = {};
  for (const [slab, actions] of Object.entries(ranges)) {
    slabs[slab] = { add: {}, renew: {} };
    if (actions?.add) {
      for (const [m, p] of Object.entries(actions.add)) {
        const price = Number(p);
        if (!isNaN(price) && price > 0) slabs[slab].add[m] = price;
      }
    }
    if (actions?.renew) {
      for (const [m, p] of Object.entries(actions.renew)) {
        const price = Number(p);
        if (!isNaN(price) && price > 0) slabs[slab].renew[m] = price;
      }
    }
  }

  return Object.keys(slabs).length > 0 ? { slabs } : null;
}

/**
 * Find the correct slab for a given account count.
 */
function findSlab(
  slabs: Record<string, SlabPricing>,
  accounts: number,
): string | null {
  for (const slab of Object.keys(slabs)) {
    const [minS, maxS] = slab.split("-");
    const min = parseInt(minS, 10);
    const max = parseInt(maxS, 10);
    if (!isNaN(min) && !isNaN(max) && accounts >= min && accounts <= max)
      return slab;
  }
  return Object.keys(slabs)[0] || null;
}

/**
 * Get the total price for a given configuration.
 * RC prices are per-account PER-MONTH rates.
 * Result = ratePerMonth × numberOfAccounts × months
 */
function getTotalPrice(
  pricing: StructuredPricing,
  accounts: number,
  months: number,
  action: "add" | "renew" = "add",
): number | null {
  const slab = findSlab(pricing.slabs, accounts);
  if (!slab) return null;
  const price = pricing.slabs[slab][action][String(months)];
  if (price == null || isNaN(price)) return null;
  return price * accounts * months;
}

/**
 * Get per-account per-month rate.
 * RC prices are ALREADY per-month — just return the rate directly.
 */
function getPerMonthRate(
  pricing: StructuredPricing,
  accounts: number,
  months: number,
  action: "add" | "renew" = "add",
): number | null {
  const slab = findSlab(pricing.slabs, accounts);
  if (!slab) return null;
  const price = pricing.slabs[slab][action][String(months)];
  if (price == null || isNaN(price)) return null;
  return price;
}

/**
 * Calculate savings percentage vs 1-month pricing.
 */
function getSavingsPercent(
  pricing: StructuredPricing,
  accounts: number,
  months: number,
): number {
  if (months <= 1) return 0;
  const monthlyRate = getPerMonthRate(pricing, accounts, 1);
  const currentRate = getPerMonthRate(pricing, accounts, months);
  if (!monthlyRate || !currentRate || currentRate >= monthlyRate) return 0;
  return Math.round((1 - currentRate / monthlyRate) * 100);
}

/** Lowest per-month rate for a plan (1 account, 1 month) — for plan card display */
function getStartingPrice(pricing: StructuredPricing): number | null {
  return getPerMonthRate(pricing, 1, 1);
}

// ============================================================================
// Form Schema
// ============================================================================

const formSchema = z.object({
  domainName: z
    .string()
    .min(3, "Domain name is required")
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/,
      "Enter a valid domain (e.g. example.com)",
    ),
  numberOfAccounts: z.string().min(1, "Number of accounts is required"),
  months: z.string().min(1, "Subscription period is required"),
});

type FormValues = z.infer<typeof formSchema>;

// ============================================================================
// Component
// ============================================================================

export function EmailPurchaseWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Pricing via React Query — cached for 5 min, so re-visits are instant
  const {
    data: pricingResult,
    isLoading: pricingLoading,
    error: pricingQueryError,
    refetch: refetchPricing,
  } = useEmailPricing();

  // Pricing state — keyed by plan key (dynamically populated from the API)
  const [allPricing, setAllPricing] = useState<
    Record<string, StructuredPricing>
  >({});
  const pricingError = pricingQueryError?.message || null;

  // Selected plan (string — populated from API response keys)
  const [selectedPlan, setSelectedPlan] = useState<string>("eeliteus");

  // Compare plans toggle
  const [comparePlansOpen, setComparePlansOpen] = useState(false);

  const domainFromUrl = searchParams.get("domain") || "";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domainName: domainFromUrl,
      numberOfAccounts: "5",
      months: "12",
    },
  });

  useEffect(() => {
    if (domainFromUrl && !form.getValues("domainName")) {
      form.setValue("domainName", domainFromUrl);
    }
  }, [domainFromUrl, form]);

  // Parse pricing data when React Query delivers it
  useEffect(() => {
    if (!pricingResult?.data) return;
    const raw = pricingResult.data as Record<string, unknown>;

    const parsed: Record<string, StructuredPricing> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (
        typeof value === "object" &&
        value !== null &&
        "email_account_ranges" in value
      ) {
        const p = parsePlanPricing(raw, key);
        if (p) parsed[key] = p;
      }
    }

    if (Object.keys(parsed).length > 0) {
      setAllPricing(parsed);
      // Auto-select cheapest available plan
      const cheapestKey = Object.keys(parsed).sort(
        (a, b) =>
          (getStartingPrice(parsed[a]) || 999) -
          (getStartingPrice(parsed[b]) || 999),
      )[0];
      if (cheapestKey) setSelectedPlan(cheapestKey);
    }
  }, [pricingResult]);

  const numberOfAccounts = parseInt(form.watch("numberOfAccounts") || "5", 10);
  const months = parseInt(form.watch("months") || "12", 10);

  // Available billing periods for the selected plan
  const availableMonths = useMemo(() => {
    const pricing = allPricing[selectedPlan];
    if (!pricing) return [1, 3, 6, 12];
    const slab = findSlab(pricing.slabs, numberOfAccounts);
    if (!slab) return [1, 3, 6, 12];
    return [1, 3, 6, 12].filter(
      (m) => pricing.slabs[slab]?.add[String(m)] != null,
    );
  }, [allPricing, selectedPlan, numberOfAccounts]);

  // Pricing details for current selection
  const pricingDetails = useMemo(() => {
    const pricing = allPricing[selectedPlan];
    if (!pricing) return null;
    const total = getTotalPrice(pricing, numberOfAccounts, months);
    const perMonthPerAccount = getPerMonthRate(
      pricing,
      numberOfAccounts,
      months,
    );
    const savings = getSavingsPercent(pricing, numberOfAccounts, months);
    const renewTotal = getTotalPrice(
      pricing,
      numberOfAccounts,
      months,
      "renew",
    );
    const renewPerMonth = getPerMonthRate(
      pricing,
      numberOfAccounts,
      months,
      "renew",
    );
    const monthlyRefRate = getPerMonthRate(pricing, numberOfAccounts, 1);
    return {
      total,
      perMonthPerAccount,
      savings,
      renewTotal,
      renewPerMonth,
      monthlyRefRate,
    };
  }, [allPricing, selectedPlan, numberOfAccounts, months]);

  // Plans available from the API — sorted cheapest first
  const availablePlans = useMemo(
    () =>
      Object.keys(allPricing)
        .filter(() => !pricingLoading)
        .sort(
          (a, b) =>
            (getStartingPrice(allPricing[a]) || 999) -
            (getStartingPrice(allPricing[b]) || 999),
        )
        .map((key) => ({ key, meta: resolvePlanMeta(key) })),
    [allPricing, pricingLoading],
  );

  function onSubmit(values: FormValues) {
    const formData = new FormData();
    formData.append("domainName", values.domainName);
    formData.append("numberOfAccounts", values.numberOfAccounts);
    formData.append("months", values.months);
    formData.append("productKey", selectedPlan);

    // Pass Titan Mail plan-id if this is a Titan Mail plan
    const planId = extractPlanId(selectedPlan);
    if (planId) {
      formData.append("planId", String(planId));
    }

    const domainId = searchParams.get("domainId");
    if (domainId) formData.append("domainId", domainId);
    const clientId = searchParams.get("clientId");
    if (clientId) formData.append("clientId", clientId);

    startTransition(async () => {
      const result = await createBusinessEmailOrder(formData);
      if (
        result.success &&
        result.data?.transactionId &&
        result.data?.pendingPurchaseId
      ) {
        toast.success("Opening checkout...");
        const successUrl = `${window.location.origin}/dashboard/domains/success?purchase_id=${result.data.pendingPurchaseId}`;
        await openPaddleTransactionCheckout({
          transactionId: result.data.transactionId,
          successUrl,
        });
      } else {
        toast.error(result.error || "Failed to create checkout");
      }
    });
  }

  // Period label helper
  const getPeriodLabel = (m: number) => {
    if (m === 1) return "Monthly";
    if (m === 3) return "Quarterly";
    if (m === 6) return "Semi-Annual";
    if (m === 12) return "Annual";
    return `${m} Months`;
  };

  const selectedMeta = resolvePlanMeta(selectedPlan);

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* Step 1: Choose Your Plan */}
      {/* ================================================================ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            1
          </div>
          <h2 className="text-base font-semibold">Choose Your Plan</h2>
        </div>

        {pricingLoading ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl border bg-muted/20 animate-pulse"
              >
                <div className="h-3 bg-muted/60 rounded-t-xl" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-24 bg-muted/40 rounded" />
                  <div className="h-8 w-20 bg-muted/40 rounded" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted/30 rounded" />
                    <div className="h-3 w-3/4 bg-muted/30 rounded" />
                    <div className="h-3 w-5/6 bg-muted/30 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : pricingError ? (
          <Card className="border-destructive/30">
            <CardContent className="flex flex-col items-center gap-3 py-8">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="text-center">
                <p className="font-medium text-destructive">
                  Unable to load pricing
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {pricingError}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchPricing()}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div
            className={cn(
              "grid gap-4",
              availablePlans.length === 1
                ? "grid-cols-1 max-w-sm"
                : availablePlans.length === 2
                  ? "sm:grid-cols-2"
                  : "sm:grid-cols-3",
            )}
          >
            {availablePlans.map(({ key, meta }) => {
              const pricing = allPricing[key];
              const startingPrice = pricing ? getStartingPrice(pricing) : null;
              const yearlyRate = pricing
                ? getPerMonthRate(pricing, 1, 12)
                : null;
              const yearlySavings = pricing
                ? getSavingsPercent(pricing, 1, 12)
                : 0;
              const isSelected = selectedPlan === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPlan(key)}
                  className={cn(
                    "group relative text-left rounded-xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary overflow-hidden bg-card",
                    isSelected
                      ? "border-primary shadow-md shadow-primary/10"
                      : "border-border hover:border-primary/40 hover:shadow-sm",
                  )}
                >
                  {/* Colored top bar */}
                  <div
                    className={cn(
                      "h-1.5 w-full transition-colors",
                      isSelected
                        ? "bg-primary"
                        : "bg-muted group-hover:bg-primary/30",
                    )}
                  />

                  {meta.isPopular && (
                    <Badge className="absolute top-4 right-3 bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                      Popular
                    </Badge>
                  )}

                  <div className="p-5">
                    {/* Plan name & tagline */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <HardDrive
                          className={cn(
                            "h-4 w-4",
                            isSelected
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        />
                        <h3
                          className={cn(
                            "font-semibold",
                            isSelected && "text-primary",
                          )}
                        >
                          {meta.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {meta.tagline}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="mb-4">
                      {startingPrice != null ? (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">
                              {formatCurrency(startingPrice, "USD")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              /mo
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            per mailbox · billed monthly
                          </p>
                          {yearlyRate != null && yearlySavings > 0 && (
                            <p className="text-[11px] text-green-600 dark:text-green-400 mt-0.5">
                              {formatCurrency(yearlyRate, "USD")}/mo billed
                              annually (save {yearlySavings}%)
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Pricing unavailable
                        </p>
                      )}
                    </div>

                    {/* Storage highlight */}
                    {meta.storageGB > 0 && (
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 mb-3 text-xs font-medium",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-foreground",
                        )}
                      >
                        {meta.storageGB} GB storage per mailbox
                      </div>
                    )}

                    {/* Features */}
                    <ul className="space-y-1.5">
                      {meta.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <Check
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 mt-0.5",
                              isSelected ? "text-primary" : "text-green-500",
                            )}
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Selection indicator */}
                  <div
                    className={cn(
                      "px-5 py-3 text-center text-xs font-medium border-t transition-colors",
                      isSelected
                        ? "bg-primary/5 text-primary border-primary/20"
                        : "bg-muted/30 text-muted-foreground border-border",
                    )}
                  >
                    {isSelected ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        Selected
                      </span>
                    ) : (
                      "Select Plan"
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* Step 2: Configure Your Order */}
      {/* ================================================================ */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              2
            </div>
            <CardTitle className="text-base">Configure Your Order</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Domain */}
              <FormField
                control={form.control}
                name="domainName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" />
                      Domain Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="yourdomain.com"
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Your email addresses will be @
                      {field.value || "yourdomain.com"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mailboxes */}
              <FormField
                control={form.control}
                name="numberOfAccounts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      Number of Mailboxes
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 5, 10, 15, 20, 25, 50, 100].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} {n === 1 ? "Mailbox" : "Mailboxes"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Billing Period — Visual tiles */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Billing Period
                </label>
                <div
                  className={cn(
                    "grid gap-2",
                    availableMonths.length <= 2
                      ? "grid-cols-2"
                      : availableMonths.length === 3
                        ? "grid-cols-3"
                        : "grid-cols-2 sm:grid-cols-4",
                  )}
                >
                  {availableMonths.map((m) => {
                    const p = allPricing[selectedPlan];
                    const perMonth = p
                      ? getPerMonthRate(p, numberOfAccounts, m)
                      : null;
                    const savingsPct = p
                      ? getSavingsPercent(p, numberOfAccounts, m)
                      : 0;
                    const isActive = m === months;
                    const bestValue = m === 12 && savingsPct > 0;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => form.setValue("months", String(m))}
                        className={cn(
                          "relative rounded-lg border-2 p-3 text-center transition-all",
                          isActive
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        {bestValue && (
                          <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] px-2 py-0 h-5 whitespace-nowrap">
                            Best Value
                          </Badge>
                        )}
                        {!bestValue && savingsPct > 0 && (
                          <Badge
                            className={cn(
                              "absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0 h-5 whitespace-nowrap",
                              isActive
                                ? "bg-green-600 text-white"
                                : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
                            )}
                          >
                            Save {savingsPct}%
                          </Badge>
                        )}
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            isActive ? "text-primary" : "text-foreground",
                          )}
                        >
                          {getPeriodLabel(m)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {m === 1 ? "1 month" : `${m} months`}
                        </p>
                        {perMonth != null && (
                          <p
                            className={cn(
                              "text-xs font-medium mt-1.5",
                              isActive ? "text-primary" : "text-foreground",
                            )}
                          >
                            {formatCurrency(perMonth, "USD")}
                            <span className="text-muted-foreground font-normal">
                              /mo
                            </span>
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* ============================================================ */}
              {/* Step 3: Order Summary */}
              {/* ============================================================ */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    3
                  </div>
                  <h3 className="text-base font-semibold">Order Summary</h3>
                </div>

                {pricingLoading ? (
                  <div className="border rounded-xl p-8 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Calculating pricing...
                    </p>
                  </div>
                ) : pricingError ? (
                  <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-6 flex flex-col items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-sm text-destructive">{pricingError}</p>
                    <Button variant="outline" size="sm" onClick={() => refetchPricing()}>
                      <RefreshCw className="h-3.5 w-3.5 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : pricingDetails?.total != null ? (
                  <div className="border rounded-xl overflow-hidden">
                    {/* Summary header */}
                    <div className="bg-muted/50 px-5 py-3 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {selectedMeta.name} Email
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {numberOfAccounts} mailbox
                            {numberOfAccounts > 1 ? "es" : ""} ·{" "}
                            {getPeriodLabel(months)}
                          </p>
                        </div>
                        {pricingDetails.savings > 0 && (
                          <Badge className="bg-green-600 hover:bg-green-600 text-white">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            {pricingDetails.savings}% off
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Price details */}
                    <div className="px-5 py-4 space-y-3 text-sm">
                      {/* Per-account rate */}
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-muted-foreground">
                            Per mailbox rate
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-baseline gap-2">
                            {pricingDetails.savings > 0 &&
                              pricingDetails.monthlyRefRate != null && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {formatCurrency(
                                    pricingDetails.monthlyRefRate,
                                    "USD",
                                  )}
                                </span>
                              )}
                            <span className="font-semibold">
                              {formatCurrency(
                                pricingDetails.perMonthPerAccount || 0,
                                "USD",
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              /mo
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Line items */}
                      <div className="flex justify-between text-muted-foreground">
                        <span>
                          {numberOfAccounts} mailbox
                          {numberOfAccounts > 1 ? "es" : ""} × {months} month
                          {months > 1 ? "s" : ""}
                        </span>
                        <span>
                          {formatCurrency(pricingDetails.total, "USD")}
                        </span>
                      </div>

                      {pricingDetails.savings > 0 &&
                        pricingDetails.monthlyRefRate != null && (
                          <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {getPeriodLabel(months)} discount
                            </span>
                            <span>
                              -
                              {formatCurrency(
                                pricingDetails.monthlyRefRate *
                                  months *
                                  numberOfAccounts -
                                  pricingDetails.total,
                                "USD",
                              )}
                            </span>
                          </div>
                        )}

                      <Separator />

                      {/* Total */}
                      <div className="flex justify-between items-center">
                        <span className="text-base font-semibold">
                          Subtotal{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            (excl. tax)
                          </span>
                        </span>
                        <span className="text-xl font-bold">
                          {formatCurrency(pricingDetails.total, "USD")}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Applicable taxes will be calculated at checkout based on
                        your location.
                      </p>

                      {pricingDetails.renewTotal != null &&
                        pricingDetails.total != null &&
                        Math.abs(
                          pricingDetails.renewTotal - pricingDetails.total,
                        ) > 0.01 && (
                          <p className="text-xs text-muted-foreground text-right">
                            Renews at{" "}
                            {formatCurrency(pricingDetails.renewTotal, "USD")} /{" "}
                            {getPeriodLabel(months).toLowerCase()}
                          </p>
                        )}
                    </div>
                  </div>
                ) : !pricingLoading && !pricingError ? (
                  <div className="border rounded-xl p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No pricing available for the selected options. Try
                      different settings.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={
                    isPending ||
                    pricingLoading ||
                    !!pricingError ||
                    pricingDetails?.total == null
                  }
                  className="flex-1"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : pricingDetails?.total != null ? (
                    <>
                      Continue to Payment —{" "}
                      {formatCurrency(pricingDetails.total, "USD")} + tax
                    </>
                  ) : (
                    "Purchase Email"
                  )}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                You&apos;ll be redirected to our secure checkout. Paid upfront
                for the selected period. Final amount includes applicable taxes.
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* Compare Plans */}
      {/* ================================================================ */}
      {availablePlans.length > 1 && !pricingLoading && (
        <Card>
          <button
            type="button"
            onClick={() => setComparePlansOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium hover:bg-muted/40 transition-colors"
          >
            <span>Compare all plans</span>
            {comparePlansOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {comparePlansOpen && (
            <div className="overflow-x-auto border-t">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground w-36">
                      Feature
                    </th>
                    {availablePlans.map(({ key, meta }) => (
                      <th
                        key={key}
                        className="text-center px-4 py-3 font-medium"
                      >
                        <span
                          className={cn(
                            selectedPlan === key &&
                              "text-primary font-semibold",
                          )}
                        >
                          {meta.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {/* Storage */}
                  <tr>
                    <td className="px-5 py-3 text-muted-foreground">Storage</td>
                    {availablePlans.map(({ key, meta }) => (
                      <td
                        key={key}
                        className="px-4 py-3 text-center font-medium"
                      >
                        {meta.storageGB > 0 ? `${meta.storageGB} GB` : "—"}
                      </td>
                    ))}
                  </tr>
                  {/* Starting price */}
                  <tr className="bg-muted/20">
                    <td className="px-5 py-3 text-muted-foreground">Monthly</td>
                    {availablePlans.map(({ key }) => {
                      const p = allPricing[key];
                      const price = p ? getStartingPrice(p) : null;
                      return (
                        <td
                          key={key}
                          className={cn(
                            "px-4 py-3 text-center font-semibold",
                            selectedPlan === key && "text-primary",
                          )}
                        >
                          {price != null
                            ? `${formatCurrency(price, "USD")}/mo`
                            : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  {/* 12-month price */}
                  <tr>
                    <td className="px-5 py-3 text-muted-foreground">Annual</td>
                    {availablePlans.map(({ key }) => {
                      const p = allPricing[key];
                      const price = p ? getPerMonthRate(p, 1, 12) : null;
                      const savings = p ? getSavingsPercent(p, 1, 12) : 0;
                      return (
                        <td key={key} className="px-4 py-3 text-center">
                          {price != null ? (
                            <span className="flex flex-col items-center gap-0.5">
                              <span
                                className={cn(
                                  "font-semibold",
                                  selectedPlan === key && "text-primary",
                                )}
                              >
                                {formatCurrency(price, "USD")}/mo
                              </span>
                              {savings > 0 && (
                                <span className="text-[10px] text-green-600 dark:text-green-400">
                                  Save {savings}%
                                </span>
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {/* Common features */}
                  {[
                    "Custom domain email",
                    "Webmail & mobile apps",
                    "Calendar & contacts sync",
                    "Anti-spam & virus protection",
                    "Priority 24/7 support",
                    "Advanced admin controls",
                  ].map((feature) => (
                    <tr key={feature} className="odd:bg-muted/10">
                      <td className="px-5 py-3 text-muted-foreground">
                        {feature}
                      </td>
                      {availablePlans.map(({ key, meta }) => (
                        <td key={key} className="px-4 py-3 text-center">
                          {meta.features.includes(feature) ? (
                            <Check className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground/40 text-base leading-none">
                              —
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
