"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Loader2, Mail } from "lucide-react";

/**
 * Extract add pricing from RC email_account_ranges structure.
 * Returns: { "1-5": { "1": price, "3": price, "12": price }, "6-25": { ... } }
 */
function extractAddPricing(
  ranges: Record<string, Record<string, Record<string, number>>>
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const [slab, actions] of Object.entries(ranges)) {
    if (actions?.add && typeof actions.add === 'object') {
      result[slab] = actions.add;
    }
  }
  return result;
}

/**
 * Find the correct slab for a given number of accounts and get the tenure price.
 * Returns total price for the tenure PER ACCOUNT, or null if not found.
 */
function getSlabPrice(
  pricingData: Record<string, Record<string, number>>,
  accounts: number,
  months: number
): number | null {
  for (const [slab, monthPrices] of Object.entries(pricingData)) {
    const parts = slab.split('-');
    if (parts.length === 2) {
      const min = parseInt(parts[0]);
      const max = parseInt(parts[1]);
      if (!isNaN(min) && !isNaN(max) && accounts >= min && accounts <= max) {
        const price = monthPrices[String(months)];
        if (price != null && !isNaN(Number(price))) {
          return Number(price);
        }
      }
    }
  }
  return null;
}

const formSchema = z.object({
  domainName: z.string()
    .min(3, "Domain name is required")
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/, "Invalid domain format (e.g. example.com)"),
  numberOfAccounts: z.string().min(1, "Number of accounts is required"),
  months: z.string().min(1, "Subscription period is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function EmailPurchaseWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pricePerAccount, setPricePerAccount] = useState<number | null>(null);
  const [pricingCurrency, setPricingCurrency] = useState("USD");

  // Pre-fill domain from URL query params (?domain=example.com&domainId=xxx)
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

  // Full pricing data from RC (keyed by slab → action → months → price)
  const [pricingData, setPricingData] = useState<Record<string, Record<string, number>> | null>(null);

  // Fetch real pricing from ResellerClub on mount
  useEffect(() => {
    async function loadPricing() {
      try {
        const result = await getBusinessEmailPricing();
        if (result.success && result.data) {
          const pricing = result.data as Record<string, unknown>;
          
          // RC response structure (confirmed from API docs):
          // { "eeliteus": { "email_account_ranges": { "1-5": { "add": { "1": price, "12": price }, "renew": {...} } } } }
          const productPricing = pricing['eeliteus'] as Record<string, unknown> | undefined;
          const ranges = productPricing?.email_account_ranges as Record<string, Record<string, Record<string, number>>> | undefined;
          
          if (ranges && typeof ranges === 'object') {
            // Store full pricing data for dynamic calculation
            setPricingData(extractAddPricing(ranges));
            
            // Extract 1-month price from the first slab as per-account display
            const firstSlab = Object.values(ranges)[0];
            const addPricing = firstSlab?.add;
            if (addPricing) {
              // Use 1-month price as the "per account/month" display rate
              const monthlyPrice = Number(addPricing['1']);
              if (!isNaN(monthlyPrice) && monthlyPrice > 0) {
                setPricePerAccount(monthlyPrice);
              }
            }
          }
        }
      } catch {
        // If pricing fetch fails, we'll show "Final pricing will be calculated at checkout"
      }
    }
    loadPricing();
  }, []);

  const numberOfAccounts = parseInt(form.watch("numberOfAccounts") || "5");
  const months = parseInt(form.watch("months") || "12");
  
  // Calculate total price using slab-based pricing (correct structure)
  // Price from RC is TOTAL for the tenure PER ACCOUNT, not per-month
  const totalPrice = pricingData 
    ? (() => {
        const perAccountTotal = getSlabPrice(pricingData, numberOfAccounts, months);
        return perAccountTotal !== null ? perAccountTotal * numberOfAccounts : null;
      })()
    : null;
  
  // Per-account per-month display (for the "Per account/month" line)
  const effectivePerMonthPerAccount = totalPrice !== null 
    ? totalPrice / (numberOfAccounts * months) 
    : pricePerAccount;

  function onSubmit(values: FormValues) {
    const formData = new FormData();
    formData.append('domainName', values.domainName);
    formData.append('numberOfAccounts', values.numberOfAccounts);
    formData.append('months', values.months);
    // Pass domainId from URL params so provisioning can link email to domain
    const domainIdFromUrl = searchParams.get('domainId');
    if (domainIdFromUrl) {
      formData.append('domainId', domainIdFromUrl);
    }

    startTransition(async () => {
      const result = await createBusinessEmailOrder(formData);
      
      if (result.success && result.data?.transactionId && result.data?.pendingPurchaseId) {
        toast.success("Opening checkout...");
        
        // Open Paddle checkout overlay with transaction ID and success URL
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
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Configure Your Email Plan
        </CardTitle>
        <CardDescription>
          Choose how many email accounts you need and for how long
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <FormField
                control={form.control}
                name="numberOfAccounts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Accounts</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select accounts" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 Account</SelectItem>
                        <SelectItem value="5">5 Accounts</SelectItem>
                        <SelectItem value="10">10 Accounts</SelectItem>
                        <SelectItem value="25">25 Accounts</SelectItem>
                        <SelectItem value="50">50 Accounts</SelectItem>
                        <SelectItem value="100">100 Accounts</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Email accounts included
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscription Period</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 Month</SelectItem>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">12 Months (Best Value)</SelectItem>
                        <SelectItem value="24">24 Months</SelectItem>
                        <SelectItem value="36">36 Months</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Longer periods save more
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Pricing Summary */}
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h4 className="font-medium">Order Summary</h4>
              {totalPrice !== null ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{numberOfAccounts} email account{numberOfAccounts > 1 ? 's' : ''} × {months} month{months > 1 ? 's' : ''}</span>
                    <span>{formatCurrency(totalPrice, pricingCurrency)}</span>
                  </div>
                  {effectivePerMonthPerAccount !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Per account/month</span>
                      <span>{formatCurrency(effectivePerMonthPerAccount, pricingCurrency)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium text-base">
                    <span>Total</span>
                    <span>{formatCurrency(totalPrice, pricingCurrency)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Final pricing will be calculated at checkout
                </p>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Purchase Email
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
