"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface SubscribeModuleButtonProps {
  moduleId: string;
  moduleName: string;
  moduleSlug: string;
  agencyId: string | null;
  isSubscribed: boolean;
  wholesalePriceMonthly: number;
  wholesalePriceYearly?: number | null;
}

export function SubscribeModuleButton({
  moduleId,
  moduleName,
  moduleSlug,
  agencyId,
  isSubscribed,
  wholesalePriceMonthly,
  wholesalePriceYearly,
}: SubscribeModuleButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handleSubscribe = async () => {
    if (!agencyId) {
      toast.error("You need to be part of an agency to subscribe to modules");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/modules/${moduleId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId,
          billingCycle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      // If there's a checkout URL, redirect to Stripe
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      toast.success("Successfully subscribed!", {
        description: `You now have access to ${moduleName}`,
      });

      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to subscribe");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <Button disabled className="gap-2">
        <Check className="h-4 w-4" />
        Subscribed
      </Button>
    );
  }

  const monthlyPrice = wholesalePriceMonthly / 100;
  const yearlyPrice = (wholesalePriceYearly || wholesalePriceMonthly * 10) / 100;
  const selectedPrice = billingCycle === "monthly" ? monthlyPrice : yearlyPrice;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Subscribe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subscribe to {moduleName}</DialogTitle>
          <DialogDescription>
            Add this module to your agency&apos;s toolkit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Billing Cycle Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                billingCycle === "monthly"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              }`}
            >
              <p className="font-medium">Monthly</p>
              <p className="text-2xl font-bold">${monthlyPrice.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">/month</p>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`p-4 rounded-lg border-2 text-left transition-colors relative ${
                billingCycle === "yearly"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              }`}
            >
              <span className="absolute -top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 17%
              </span>
              <p className="font-medium">Yearly</p>
              <p className="text-2xl font-bold">${yearlyPrice.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">/year</p>
            </button>
          </div>

          {/* Price Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Wholesale Price</span>
              <span className="font-medium">${selectedPrice.toFixed(2)}/{billingCycle === "monthly" ? "mo" : "yr"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Billed</span>
              <span>{billingCycle === "monthly" ? "Monthly" : "Annually"}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            You can set your own markup price for clients after subscribing.
            Cancel anytime from your dashboard.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubscribe} disabled={isLoading || !agencyId}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Subscribe - ${selectedPrice.toFixed(2)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
