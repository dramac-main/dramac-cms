"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { createBusinessEmailOrder, getBusinessEmailPricing } from "@/lib/actions/business-email";
import { openPaddleTransactionCheckout } from "@/lib/paddle/paddle-client";
import { formatCurrency } from "@/lib/locale-config";
import { toast } from "sonner";
import { Loader2, AlertCircle, Tag, TrendingDown, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Plan Definitions (static display — pricing comes from RC API)
// ============================================================================

type SupportedPlanKey = "eeliteus" | "enterpriseemailus";

interface PlanDef {
  key: SupportedPlanKey;
  name: string;
  tagline: string;
  storageGB: number;
  isPopular: boolean;
  features: string[];
}

const PLAN_DEFS: PlanDef[] = [
  {
    key: "eeliteus",
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
  {
    key: "enterpriseemailus",
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
];

// ============================================================================
// Types & Pricing Helpers
// ============================================================================

interface SlabPricing {
  add: Record<string, number>;   // months → total-per-account price for the tenure
  renew: Record<string, number>; // months → total-per-account renewal price
}

interface StructuredPricing {
  slabs: Record<string, SlabPricing>;
}

/**
 * Parse the RC pricing response for a single product key.
 * RC structure: { "eeliteus": { "email_account_ranges": { "1-5": { "add": { "1": 0.86 }, "renew": {...} } } } }
 * Prices = TOTAL per-account for the full tenure (NOT per-month).
 */
function parsePlanPricing(data: Record<string, unknown>, planKey: string): StructuredPricing | null {
  const product = data[planKey] as Record<string, unknown> | undefined;
  const ranges = product?.email_account_ranges as Record<string, Record<string, Record<string, number>>> | undefined;

  if (!ranges || typeof ranges !== 'object') return null;

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
function findSlab(slabs: Record<string, SlabPricing>, accounts: number): string | null {
  for (const slab of Object.keys(slabs)) {
    const [minS, maxS] = slab.split('-');
    const min = parseInt(minS);
    const max = parseInt(maxS);
    if (!isNaN(min) && !isNaN(max) && accounts >= min && accounts <= max) return slab;
  }
  return Object.keys(slabs)[0] || null;
}

/**
 * Get the total price for a given configuration.
 * RC prices are total-per-account for the full tenure.
 * Result = perAccountTenurePrice × numberOfAccounts
 */
function getTotalPrice(
  pricing: StructuredPricing,
  accounts: number,
  months: number,
  action: 'add' | 'renew' = 'add'
): number | null {
  const slab = findSlab(pricing.slabs, accounts);
  if (!slab) return null;
  const price = pricing.slabs[slab][action][String(months)];
  if (price == null || isNaN(price)) return null;
  return price * accounts;
}

/**
 * Get per-account per-month rate. = tenure price / months
 */
function getPerMonthRate(
  pricing: StructuredPricing,
  accounts: number,
  months: number,
  action: 'add' | 'renew' = 'add'
): number | null {
  const slab = findSlab(pricing.slabs, accounts);
  if (!slab) return null;
  const price = pricing.slabs[slab][action][String(months)];
  if (price == null || isNaN(price)) return null;
  return price / months;
}

/**
 * Calculate savings percentage vs 1-month pricing.
 */
function getSavingsPercent(pricing: StructuredPricing, accounts: number, months: number): number {
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
  domainName: z.string()
    .min(3, "Domain name is required")
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/, "Enter a valid domain (e.g. example.com)"),
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

  // Pricing state — keyed by plan key
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [allPricing, setAllPricing] = useState<Record<string, StructuredPricing>>({});

  // Selected plan
  const [selectedPlan, setSelectedPlan] = useState<SupportedPlanKey>("eeliteus");

  const domainFromUrl = searchParams.get('domain') || '';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domainName: domainFromUrl,
      numberOfAccounts: "5",
      months: "12",
    },
  });

  useEffect(() => {
    if (domainFromUrl && !form.getValues('domainName')) {
      form.setValue('domainName', domainFromUrl);
    }
  }, [domainFromUrl, form]);

  const loadPricing = async () => {
    setPricingLoading(true);
    setPricingError(null);
    try {
      const result = await getBusinessEmailPricing();
      if (!result.success || !result.data) {
        setPricingError(result.error || 'Failed to load pricing');
        return;
      }
      const raw = result.data as Record<string, unknown>;
      const parsed: Record<string, StructuredPricing> = {};
      for (const plan of PLAN_DEFS) {
        const p = parsePlanPricing(raw, plan.key);
        if (p) parsed[plan.key] = p;
      }
      if (Object.keys(parsed).length === 0) {
        setPricingError('Pricing not available. Please try again.');
        return;
      }
      setAllPricing(parsed);
      // Auto-select first available plan
      const first = PLAN_DEFS.find(p => parsed[p.key])?.key;
      if (first) setSelectedPlan(first);
    } catch {
      setPricingError('Failed to connect to pricing service');
    } finally {
      setPricingLoading(false);
    }
  };

  useEffect(() => {
    loadPricing();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const numberOfAccounts = parseInt(form.watch("numberOfAccounts") || "5");
  const months = parseInt(form.watch("months") || "12");

  // Available billing periods for the selected plan
  const availableMonths = useMemo(() => {
    const pricing = allPricing[selectedPlan];
    if (!pricing) return [1, 3, 6, 12];
    const slab = findSlab(pricing.slabs, numberOfAccounts);
    if (!slab) return [1, 3, 6, 12];
    return [1, 3, 6, 12].filter(m => pricing.slabs[slab]?.add[String(m)] != null);
  }, [allPricing, selectedPlan, numberOfAccounts]);

  // Pricing details for current selection
  const pricingDetails = useMemo(() => {
    const pricing = allPricing[selectedPlan];
    if (!pricing) return null;
    const total = getTotalPrice(pricing, numberOfAccounts, months);
    const perMonthPerAccount = getPerMonthRate(pricing, numberOfAccounts, months);
    const savings = getSavingsPercent(pricing, numberOfAccounts, months);
    const renewTotal = getTotalPrice(pricing, numberOfAccounts, months, 'renew');
    const renewPerMonth = getPerMonthRate(pricing, numberOfAccounts, months, 'renew');
    const monthlyRefRate = getPerMonthRate(pricing, numberOfAccounts, 1);
    return { total, perMonthPerAccount, savings, renewTotal, renewPerMonth, monthlyRefRate };
  }, [allPricing, selectedPlan, numberOfAccounts, months]);

  // Plans available from RC (only show plans we have pricing for)
  const availablePlans = PLAN_DEFS.filter(p => !pricingLoading && allPricing[p.key]);

  function onSubmit(values: FormValues) {
    const formData = new FormData();
    formData.append('domainName', values.domainName);
    formData.append('numberOfAccounts', values.numberOfAccounts);
    formData.append('months', values.months);
    formData.append('productKey', selectedPlan);

    const domainId = searchParams.get('domainId');
    if (domainId) formData.append('domainId', domainId);
    const clientId = searchParams.get('clientId');
    if (clientId) formData.append('clientId', clientId);

    startTransition(async () => {
      const result = await createBusinessEmailOrder(formData);
      if (result.success && result.data?.transactionId && result.data?.pendingPurchaseId) {
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

  return (
    <div className="space-y-5">
      {/* ================================================================ */}
      {/* Step 1: Plan Selector */}
      {/* ================================================================ */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Select a plan</p>

        {pricingLoading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {PLAN_DEFS.map(p => (
              <div key={p.key} className="h-36 rounded-xl border bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : pricingError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 flex flex-col items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive text-center">{pricingError}</p>
            <Button variant="outline" size="sm" onClick={loadPricing}>
              <RefreshCw className="h-3 w-3 mr-2" />
              Retry
            </Button>
          </div>
        ) : (
          <div className={cn("grid gap-3", availablePlans.length > 1 ? "sm:grid-cols-2" : "grid-cols-1")}>
            {availablePlans.map(plan => {
              const pricing = allPricing[plan.key];
              const startingPrice = pricing ? getStartingPrice(pricing) : null;
              const isSelected = selectedPlan === plan.key;

              return (
                <button
                  key={plan.key}
                  type="button"
                  onClick={() => setSelectedPlan(plan.key)}
                  className={cn(
                    "relative text-left rounded-xl border p-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/40 hover:bg-accent/20"
                  )}
                >
                  {plan.isPopular && (
                    <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-[10px] px-2 py-0 h-5">
                      Most Popular
                    </Badge>
                  )}

                  {isSelected && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}

                  <div className="flex items-start gap-2 mb-3 pr-6">
                    <div>
                      <p className={cn("font-semibold text-sm", isSelected && "text-primary")}>
                        {plan.name} Email
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.tagline}</p>
                    </div>
                    {startingPrice != null && (
                      <div className="ml-auto text-right shrink-0">
                        <p className="text-sm font-bold">
                          {formatCurrency(startingPrice, "USD")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">/mo/mailbox</p>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-1">
                    {plan.features.slice(0, 4).map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* Step 2: Configuration + Pricing */}
      {/* ================================================================ */}
      <Card>
        <CardContent className="pt-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              {/* Domain */}
              <FormField
                control={form.control}
                name="domainName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="yourdomain.com" {...field} className="font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mailboxes + Period */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numberOfAccounts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mailboxes</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 5, 10, 15, 20, 25, 50, 100].map(n => (
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

                <FormField
                  control={form.control}
                  name="months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Period</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableMonths.map(m => {
                            const p = allPricing[selectedPlan];
                            const s = p ? getSavingsPercent(p, numberOfAccounts, m) : 0;
                            return (
                              <SelectItem key={m} value={String(m)}>
                                <span className="flex items-center gap-2">
                                  {m === 1 ? '1 Month' : `${m} Months`}
                                  {s > 0 && (
                                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                      Save {s}%
                                    </span>
                                  )}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* ============================================================ */}
              {/* Pricing Summary */}
              {/* ============================================================ */}
              {pricingLoading ? (
                <div className="bg-muted/50 border rounded-lg p-8 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading pricing...</p>
                </div>
              ) : pricingError ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 flex flex-col items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                  <p className="text-sm text-destructive">{pricingError}</p>
                  <Button variant="outline" size="sm" onClick={loadPricing}>
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : pricingDetails?.total != null ? (
                <div className="space-y-4">
                  {/* Period comparison tiles */}
                  {availableMonths.length > 1 && (
                    <div className={cn("grid gap-2", availableMonths.length <= 3 ? "grid-cols-3" : "grid-cols-4")}>
                      {availableMonths.map(m => {
                        const p = allPricing[selectedPlan];
                        const perMonth = p ? getPerMonthRate(p, numberOfAccounts, m) : null;
                        const savingsPct = p ? getSavingsPercent(p, numberOfAccounts, m) : 0;
                        const isActive = m === months;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => form.setValue('months', String(m))}
                            className={cn(
                              "relative rounded-lg border p-2.5 text-center transition-all",
                              isActive
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border bg-card hover:border-primary/40"
                            )}
                          >
                            {savingsPct > 0 && (
                              <Badge
                                className={cn(
                                  "absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0 h-4",
                                  isActive
                                    ? "bg-green-600 text-white"
                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                )}
                              >
                                -{savingsPct}%
                              </Badge>
                            )}
                            <p className="text-[10px] text-muted-foreground mb-0.5">
                              {m === 1 ? '1 mo' : `${m} mo`}
                            </p>
                            <p className={cn("text-xs font-semibold", isActive && "text-primary")}>
                              {perMonth != null ? formatCurrency(perMonth, "USD") : '—'}
                            </p>
                            <p className="text-[9px] text-muted-foreground">/mo</p>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Price breakdown */}
                  <div className="bg-gradient-to-br from-muted/50 to-muted border rounded-xl p-5 space-y-2 text-sm">
                    {/* Hero rate */}
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <div className="flex items-baseline gap-2">
                          {pricingDetails.savings > 0 && pricingDetails.monthlyRefRate != null && (
                            <span className="text-lg text-muted-foreground line-through">
                              {formatCurrency(pricingDetails.monthlyRefRate, "USD")}
                            </span>
                          )}
                          <span className="text-3xl font-bold">
                            {formatCurrency(pricingDetails.perMonthPerAccount || 0, "USD")}
                          </span>
                          <span className="text-muted-foreground text-xs">/mo per mailbox</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {PLAN_DEFS.find(p => p.key === selectedPlan)?.name} Email · {months}-month term
                        </p>
                      </div>
                      {pricingDetails.savings > 0 && (
                        <Badge className="bg-green-600 hover:bg-green-600 text-white shrink-0">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Save {pricingDetails.savings}%
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {numberOfAccounts} mailbox{numberOfAccounts > 1 ? 'es' : ''} × {months} month{months > 1 ? 's' : ''}
                      </span>
                      <span className="font-medium">{formatCurrency(pricingDetails.total, "USD")}</span>
                    </div>

                    {pricingDetails.savings > 0 && pricingDetails.monthlyRefRate != null && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {months}-month discount
                        </span>
                        <span>
                          -{formatCurrency(
                            pricingDetails.monthlyRefRate * months * numberOfAccounts - pricingDetails.total,
                            "USD"
                          )}
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between font-semibold text-base">
                      <span>Total due today</span>
                      <span className="text-lg">{formatCurrency(pricingDetails.total, "USD")}</span>
                    </div>

                    {pricingDetails.renewTotal != null &&
                      pricingDetails.total != null &&
                      Math.abs(pricingDetails.renewTotal - pricingDetails.total) > 0.01 && (
                      <p className="text-xs text-muted-foreground text-right">
                        Renews at {formatCurrency(pricingDetails.renewTotal, "USD")} every {months} month{months > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              ) : !pricingLoading && !pricingError ? (
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    No pricing available for the selected options. Try different settings.
                  </p>
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isPending || pricingLoading || !!pricingError || pricingDetails?.total == null}
                  className="flex-1 sm:flex-none"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : pricingDetails?.total != null ? (
                    <>Purchase — {formatCurrency(pricingDetails.total, "USD")}</>
                  ) : (
                    'Purchase Email'
                  )}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground text-center">
                Paid upfront for the selected period. Prices sync from ResellerClub daily.
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
