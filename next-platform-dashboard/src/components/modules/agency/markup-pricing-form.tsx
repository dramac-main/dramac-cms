"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Coins, Percent, Calculator, Save, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/locale-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const markupSchema = z.object({
  markupType: z.enum(["percentage", "fixed", "custom"]),
  markupPercentage: z.number().min(0).max(500).optional(),
  markupFixedAmount: z.number().min(0).optional(),
  customPriceMonthly: z.number().min(0).optional(),
  customPriceYearly: z.number().min(0).optional(),
});

type MarkupFormValues = z.infer<typeof markupSchema>;

interface MarkupPricingFormProps {
  subscription: {
    id: string;
    module_id: string;
    markup_type: string;
    markup_percentage: number | null;
    markup_fixed_amount: number | null;
    custom_price_monthly: number | null;
    custom_price_yearly: number | null;
    module: {
      name: string;
      wholesale_price_monthly: number;
      wholesale_price_yearly: number | null;
    };
  };
}

export function MarkupPricingForm({ subscription }: MarkupPricingFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const wholesaleMonthly = subscription.module.wholesale_price_monthly / 100;
  const wholesaleYearly = (subscription.module.wholesale_price_yearly || 0) / 100;

  const form = useForm<MarkupFormValues>({
    resolver: zodResolver(markupSchema),
    defaultValues: {
      markupType: (subscription.markup_type as "percentage" | "fixed" | "custom") || "percentage",
      markupPercentage: subscription.markup_percentage || 50,
      markupFixedAmount: (subscription.markup_fixed_amount || 0) / 100,
      customPriceMonthly: (subscription.custom_price_monthly || 0) / 100,
      customPriceYearly: (subscription.custom_price_yearly || 0) / 100,
    },
  });

  const markupType = form.watch("markupType");
  const markupPercentage = form.watch("markupPercentage") || 0;
  const markupFixed = form.watch("markupFixedAmount") || 0;
  const customMonthly = form.watch("customPriceMonthly") || 0;

  // Calculate client price based on markup type
  const calculateClientPrice = () => {
    switch (markupType) {
      case "percentage":
        return wholesaleMonthly * (1 + markupPercentage / 100);
      case "fixed":
        return wholesaleMonthly + markupFixed;
      case "custom":
        return customMonthly;
      default:
        return wholesaleMonthly;
    }
  };

  const clientPrice = calculateClientPrice();
  const profit = clientPrice - wholesaleMonthly;

  const onSubmit = async (data: MarkupFormValues) => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/modules/subscriptions/${subscription.id}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markupType: data.markupType,
          markupPercentage: data.markupPercentage,
          markupFixedAmount: Math.round((data.markupFixedAmount || 0) * 100),
          customPriceMonthly: Math.round((data.customPriceMonthly || 0) * 100),
          customPriceYearly: Math.round((data.customPriceYearly || 0) * 100),
        }),
      });

      if (!response.ok) throw new Error("Failed to save pricing");

      toast.success("Pricing updated successfully");
    } catch (error) {
      toast.error("Failed to update pricing");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Pricing Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pricing Summary</CardTitle>
            <CardDescription>
              For: {subscription.module.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Wholesale (Your Cost)</p>
                <p className="text-2xl font-bold">{formatCurrency(wholesaleMonthly)}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Client Pays</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(clientPrice)}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Your Profit</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(profit)}</p>
                <p className="text-xs text-muted-foreground">/month per client</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Markup Type Selection */}
        <FormField
          control={form.control}
          name="markupType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Markup Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select markup type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="percentage">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Percentage Markup
                    </div>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      Fixed Amount Markup
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Custom Price
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose how you want to calculate the price for clients
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Percentage Markup */}
        {markupType === "percentage" && (
          <FormField
            control={form.control}
            name="markupPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Markup Percentage</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={500}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </FormControl>
                <FormDescription>
                  Common markups: 50% (1.5x), 100% (2x), 200% (3x)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Fixed Amount Markup */}
        {markupType === "fixed" && (
          <FormField
            control={form.control}
            name="markupFixedAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fixed Markup Amount</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">K</span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Add this fixed amount on top of wholesale price
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Custom Price */}
        {markupType === "custom" && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="customPriceMonthly"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Monthly Price</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">K</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customPriceYearly"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Yearly Price (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">K</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                      <span className="text-muted-foreground">/year</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Leave empty to auto-calculate (monthly × 10)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <Separator />

        {/* Example Calculation */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Example: 10 Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Monthly Revenue</p>
                <p className="font-semibold">{formatCurrency(clientPrice * 10)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Monthly Profit</p>
                <p className="font-semibold text-green-600">{formatCurrency(profit * 10)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Yearly Revenue</p>
                <p className="font-semibold">{formatCurrency(clientPrice * 10 * 12)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Yearly Profit</p>
                <p className="font-semibold text-green-600">{formatCurrency(profit * 10 * 12)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Pricing
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
