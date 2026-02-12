"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { formatCurrency } from "@/lib/locale-config";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

const formSchema = z.object({
  domainName: z.string()
    .min(3, "Domain name is required")
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, "Invalid domain format"),
  numberOfAccounts: z.string().min(1, "Number of accounts is required"),
  months: z.string().min(1, "Subscription period is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function EmailPurchaseWizard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pricePerAccount, setPricePerAccount] = useState<number | null>(null);
  const [pricingCurrency, setPricingCurrency] = useState("USD");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domainName: "",
      numberOfAccounts: "5",
      months: "12",
    },
  });

  // Fetch real pricing from ResellerClub on mount
  useEffect(() => {
    async function loadPricing() {
      try {
        const result = await getBusinessEmailPricing();
        if (result.success && result.data) {
          // Extract monthly price from the API response
          const pricing = result.data as Record<string, unknown>;
          // ResellerClub returns pricing in various structures; extract the per-account monthly rate
          const monthlyPrice =
            (pricing as any)?.pricing?.monthly ||
            (pricing as any)?.monthlyPrice ||
            (pricing as any)?.price ||
            null;
          if (typeof monthlyPrice === 'number') {
            setPricePerAccount(monthlyPrice);
          }
          if ((pricing as any)?.currency) {
            setPricingCurrency((pricing as any).currency);
          }
        }
      } catch {
        // If pricing fetch fails, we'll show "Contact for pricing"
      }
    }
    loadPricing();
  }, []);

  const numberOfAccounts = parseInt(form.watch("numberOfAccounts") || "5");
  const months = parseInt(form.watch("months") || "12");
  
  const totalMonthly = pricePerAccount !== null ? numberOfAccounts * pricePerAccount : null;
  const totalPrice = totalMonthly !== null ? totalMonthly * months : null;

  function onSubmit(values: FormValues) {
    const formData = new FormData();
    formData.append('domainName', values.domainName);
    formData.append('numberOfAccounts', values.numberOfAccounts);
    formData.append('months', values.months);

    startTransition(async () => {
      const result = await createBusinessEmailOrder(formData);
      
      if (result.success) {
        toast.success("Email order created successfully!");
        router.push(`/dashboard/email/${result.data?.id}`);
      } else {
        toast.error(result.error || "Failed to create email order");
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
              {pricePerAccount !== null && totalPrice !== null ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{numberOfAccounts} email accounts × {months} months</span>
                    <span>{formatCurrency(totalPrice, pricingCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Per account/month</span>
                    <span>{formatCurrency(pricePerAccount, pricingCurrency)}</span>
                  </div>
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
