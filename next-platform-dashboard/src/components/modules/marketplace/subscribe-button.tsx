"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface SubscribeButtonProps {
  moduleId: string;
  moduleName: string;
  price: number;
  agencyId: string;
}

export function SubscribeButton({ 
  moduleId, 
  moduleName, 
  price, 
  agencyId 
}: SubscribeButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}/mo`;
  };

  const handleSubscribe = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/modules/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          agencyId,
          billingCycle: "monthly",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      // If there's a checkout URL (paid module), redirect
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Free module - instant subscription
      toast.success(`Successfully subscribed to ${moduleName}!`);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Subscribe error:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        className="w-full" 
        size="lg"
        onClick={() => setIsOpen(true)}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Subscribe - {formatPrice(price)}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscribe to {moduleName}</DialogTitle>
            <DialogDescription>
              {price === 0 ? (
                "This is a free module. Subscribe to start using it immediately."
              ) : (
                <>
                  You will be charged <strong>{formatPrice(price)}</strong> per month.
                  You can cancel anytime.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Module</span>
              <span className="font-medium">{moduleName}</span>
            </div>
            <div className="flex justify-between">
              <span>Billing</span>
              <span className="font-medium">Monthly</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="font-medium">Total</span>
              <span className="font-bold text-primary">{formatPrice(price)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubscribe} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Subscribe${price > 0 ? " & Pay" : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
