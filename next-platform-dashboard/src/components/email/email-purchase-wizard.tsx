"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Loader2, Mail, AlertCircle, Tag, TrendingDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface SlabPricing {
  add: Record<string, number>;   // months → total-per-account price for the tenure
  renew: Record<string, number>; // months → total-per-account renewal price
}

interface StructuredPricing {
  slabs: Record<string, SlabPricing>;
  currency: string;
}

// ============================================================================
// Pricing Helpers
// ============================================================================

/**
 * Parse the RC email pricing response into a clean structured format.
 * RC structure: { "eeliteus": { "email_account_ranges": { "1-5": { "add": { "1": price }, "renew": {...} } } } }
 *
 * IMPORTANT: RC prices are TOTAL for the tenure per-account.
 * E.g. add["12"] = 10.20 → $10.20 total for 12 months for 1 account.
 */
function parseEmailPricing(data: Record<string, unknown>): StructuredPricing | null {
  const productPricing = data['eeliteus'] as Record<string, unknown> | undefined;
  const ranges = productPricing?.email_account_ranges as Record<string, Record<string, Record<string, number>>> | undefined;

  if (!ranges || typeof ranges !== 'object') return null;

  const slabs: Record<string, SlabPricing> = {};

  for (const [slab, actions] of Object.entries(ranges)) {
    slabs[slab] = { add: {}, renew: {} };
    if (actions?.add && typeof actions.add === 'object') {
      for (const [m, p] of Object.entries(actions.add)) {
        const price = Number(p);
        if (!isNaN(price) && price > 0) slabs[slab].add[m] = price;
      }
    }
    if (actions?.renew && typeof actions.renew === 'object') {
      for (const [m, p] of Object.entries(actions.renew)) {
        const price = Number(p);
        if (!isNaN(price) && price > 0) slabs[slab].renew[m] = price;
      }
    }
  }

  return { slabs, currency: 'USD' };
}

/**
 * Find the correct slab for a given account count.
 * Slabs: "1-5", "6-25", "26-49", "50-200000"
 */
function findSlab(slabs: Record<string, SlabPricing>, accounts: number): string | null {
  for (const slab of Object.keys(slabs)) {
    const parts = slab.split('-');
    if (parts.length === 2) {
      const min = parseInt(parts[0]);
      const max = parseInt(parts[1]);
      if (!isNaN(min) && !isNaN(max) && accounts >= min && accounts <= max) {
        return slab;
      }
    }
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

  const slabPricing = pricing.slabs[slab];
  const prices = action === 'add' ? slabPricing.add : slabPricing.renew;
  const perAccountTotal = prices[String(months)];

  if (perAccountTotal == null || isNaN(perAccountTotal)) return null;
  return perAccountTotal * accounts;
}

/**
 * Get per-account per-month rate.
 * = tenure price / months
 */
function getPerMonthRate(
  pricing: StructuredPricing,
  accounts: number,
  months: number,
  action: 'add' | 'renew' = 'add'
): number | null {
  const slab = findSlab(pricing.slabs, accounts);
  if (!slab) return null;

  const slabPricing = pricing.slabs[slab];
  const prices = action === 'add' ? slabPricing.add : slabPricing.renew;
  const perAccountTotal = prices[String(months)];

  if (perAccountTotal == null || isNaN(perAccountTotal)) return null;
  return perAccountTotal / months;
}

/**
 * Calculate savings percentage vs 1-month pricing.
 * If the per-month rate for N months < per-month rate for 1 month → savings.
 */
function getSavingsPercent(
  pricing: StructuredPricing,
  accounts: number,
  months: number
): number {
  if (months <= 1) return 0;

  const monthlyRate = getPerMonthRate(pricing, accounts, 1);
  const currentRate = getPerMonthRate(pricing, accounts, months);

  if (!monthlyRate || !currentRate || currentRate >= monthlyRate) return 0;
  return Math.round((1 - currentRate / monthlyRate) * 100);
}

// ============================================================================
// Form Schema
// ============================================================================

const formSchema = z.object({
  domainName: z.string()
    .min(3, "Domain name is required")
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/, "Invalid domain format (e.g. example.com)"),
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
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<StructuredPricing | null>(null);
  const [pricingCurrency] = useState("USD");

  // Pre-fill domain from URL query params
  const domainFromUrl = searchParams.get('domain') || '';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domainName: domainFromUrl,
      numberOfAccounts: "5",
      months: "12",
    },
  });

  // Set domain from URL when it changes
  useEffect(() => {
    if (domainFromUrl && !form.getValues('domainName')) {
      form.setValue('domainName', domainFromUrl);
    }
  }, [domainFromUrl, form]);

  // Fetch pricing (uses cache → live fallback)
  const loadPricing = async () => {
    setPricingLoading(true);
    setPricingError(null);
    try {
      const result = await getBusinessEmailPricing();
      if (result.success && result.data) {
        const parsed = parseEmailPricing(result.data as Record<string, unknown>);
        if (parsed && Object.keys(parsed.slabs).length > 0) {
          setPricing(parsed);
        } else {
          setPricingError('Email pricing not available. Please try again later.');
        }
      } else {
        setPricingError(result.error || 'Failed to load pricing');
      }
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

  // Compute all pricing values reactively
  const pricingDetails = useMemo(() => {
    if (!pricing) return null;

    const total = getTotalPrice(pricing, numberOfAccounts, months);
    const perMonthPerAccount = getPerMonthRate(pricing, numberOfAccounts, months);
    const savings = getSavingsPercent(pricing, numberOfAccounts, months);
    const renewTotal = getTotalPrice(pricing, numberOfAccounts, months, 'renew');
    const renewPerMonth = getPerMonthRate(pricing, numberOfAccounts, months, 'renew');

    // 1-month reference rate for showing the "was" / strikethrough price
    const monthlyRefRate = getPerMonthRate(pricing, numberOfAccounts, 1);

    return {
      total,
      perMonthPerAccount,
      savings,
      renewTotal,
      renewPerMonth,
      monthlyRefRate,
    };
  }, [pricing, numberOfAccounts, months]);

  // Available billing periods with savings
  const availableMonths = useMemo(() => {
    if (!pricing) return [1, 3, 6, 12];

    const slab = findSlab(pricing.slabs, numberOfAccounts);
    if (!slab) return [1, 3, 6, 12];

    return [1, 3, 6, 12].filter(m =>
      pricing.slabs[slab]?.add[String(m)] != null
    );
  }, [pricing, numberOfAccounts]);

  function onSubmit(values: FormValues) {
    const formData = new FormData();
    formData.append('domainName', values.domainName);
    formData.append('numberOfAccounts', values.numberOfAccounts);
    formData.append('months', values.months);
    const domainIdFromUrl = searchParams.get('domainId');
    if (domainIdFromUrl) {
      formData.append('domainId', domainIdFromUrl);
    }

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configure Your Email Plan
            </CardTitle>
            <CardDescription>
              Professional email powered by Titan — prices sync automatically from your provider
            </CardDescription>
          </div>
          {!pricingLoading && !pricingError && (
            <Button
              variant="ghost"
              size="sm"
              onClick={loadPricing}
              className="text-muted-foreground hover:text-foreground"
              title="Refresh pricing"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Domain Name */}
            <FormField
              control={form.control}
              name="domainName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="example.com"
                      {...field}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the domain you want to add email to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              {/* Number of Mailboxes */}
              <FormField
                control={form.control}
                name="numberOfAccounts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mailboxes</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mailboxes" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 Mailbox</SelectItem>
                        <SelectItem value="5">5 Mailboxes</SelectItem>
                        <SelectItem value="10">10 Mailboxes</SelectItem>
                        <SelectItem value="25">25 Mailboxes</SelectItem>
                        <SelectItem value="50">50 Mailboxes</SelectItem>
                        <SelectItem value="100">100 Mailboxes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Each mailbox = one email address (e.g. info@yourdomain.com)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Billing Period — dropdown with savings text */}
              <FormField
                control={form.control}
                name="months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Period</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableMonths.map(m => {
                          const savings = pricing ? getSavingsPercent(pricing, numberOfAccounts, m) : 0;
                          return (
                            <SelectItem key={m} value={String(m)}>
                              <span className="flex items-center gap-2">
                                {m === 1 ? '1 Month' : `${m} Months`}
                                {savings > 0 && (
                                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                    Save {savings}%
                                  </span>
                                )}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Longer periods = bigger savings per mailbox
                    </FormDescription>
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
                <p className="text-sm text-muted-foreground">Loading pricing from provider...</p>
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
                {/* Main pricing card */}
                <div className="bg-gradient-to-br from-muted/50 to-muted border rounded-xl p-6">
                  {/* Per-month hero price */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-baseline gap-2">
                        {pricingDetails.savings > 0 && pricingDetails.monthlyRefRate != null && (
                          <span className="text-lg text-muted-foreground line-through">
                            {formatCurrency(pricingDetails.monthlyRefRate, pricingCurrency)}
                          </span>
                        )}
                        <span className="text-3xl font-bold">
                          {formatCurrency(pricingDetails.perMonthPerAccount || 0, pricingCurrency)}
                        </span>
                        <span className="text-muted-foreground">/mo per mailbox</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Price per mailbox for {months}-month term.
                        {pricingDetails.renewPerMonth != null &&
                          pricingDetails.perMonthPerAccount != null &&
                          Math.abs(pricingDetails.renewPerMonth - pricingDetails.perMonthPerAccount) > 0.01 && (
                          <> Renews at {formatCurrency(pricingDetails.renewPerMonth, pricingCurrency)}/mo.</>
                        )}
                      </p>
                    </div>
                    {pricingDetails.savings > 0 && (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-white shrink-0">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Save {pricingDetails.savings}%
                      </Badge>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Order breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {numberOfAccounts} mailbox{numberOfAccounts > 1 ? 'es' : ''} × {months} month{months > 1 ? 's' : ''}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(pricingDetails.total, pricingCurrency)}
                      </span>
                    </div>

                    {pricingDetails.savings > 0 && pricingDetails.monthlyRefRate != null && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {months}-month discount ({pricingDetails.savings}% off)
                        </span>
                        <span>
                          -{formatCurrency(
                            (pricingDetails.monthlyRefRate * months * numberOfAccounts) - pricingDetails.total,
                            pricingCurrency
                          )}
                        </span>
                      </div>
                    )}

                    <Separator className="my-2" />

                    <div className="flex justify-between text-base font-semibold">
                      <span>Total due today</span>
                      <span className="text-lg">{formatCurrency(pricingDetails.total, pricingCurrency)}</span>
                    </div>

                    {pricingDetails.renewTotal != null &&
                      pricingDetails.total != null &&
                      Math.abs(pricingDetails.renewTotal - pricingDetails.total) > 0.01 && (
                      <p className="text-xs text-muted-foreground text-right">
                        Renews at {formatCurrency(pricingDetails.renewTotal, pricingCurrency)} every {months} month{months > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick period comparison tiles */}
                {pricing && availableMonths.length > 1 && (
                  <div className={cn("grid gap-2", availableMonths.length <= 3 ? "grid-cols-3" : "grid-cols-4")}>
                    {availableMonths.map(m => {
                      const perMonth = getPerMonthRate(pricing, numberOfAccounts, m);
                      const savingsPct = getSavingsPercent(pricing, numberOfAccounts, m);
                      const isSelected = m === months;

                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => form.setValue('months', String(m))}
                          className={cn(
                            "relative rounded-lg border p-3 text-center transition-all hover:border-primary/50",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border bg-card hover:bg-accent/50"
                          )}
                        >
                          {savingsPct > 0 && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0",
                                isSelected
                                  ? "bg-green-600 text-white"
                                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              )}
                            >
                              -{savingsPct}%
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground mb-1">
                            {m === 1 ? '1 mo' : `${m} mo`}
                          </p>
                          <p className={cn("text-sm font-semibold", isSelected && "text-primary")}>
                            {perMonth != null ? formatCurrency(perMonth, pricingCurrency) : '—'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">/mo/mailbox</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Unable to calculate price for selected options. Try different settings.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || pricingLoading || !!pricingError || pricingDetails?.total == null}
                size="lg"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : pricingDetails?.total != null ? (
                  <>Purchase — {formatCurrency(pricingDetails.total, pricingCurrency)}</>
                ) : (
                  'Purchase Email'
                )}
              </Button>
            </div>

            {/* Fine print */}
            <p className="text-[11px] text-muted-foreground text-center">
              All plans are paid upfront for the selected billing period. Prices sync automatically from ResellerClub.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
