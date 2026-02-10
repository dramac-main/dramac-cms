"use client";

import { useState } from "react";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { DEFAULT_CURRENCY_SYMBOL } from "@/lib/locale-config";

interface Module {
  id: string;
  name: string;
  icon: string;
  agencyPrice: number;
}

interface RequestAppDialogProps {
  module: Module;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RequestAppDialog({
  module,
  clientId,
  open,
  onOpenChange,
  onSuccess,
}: RequestAppDialogProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPrice = (cents: number) => {
    if (!cents || cents === 0) return "Free";
    return `${DEFAULT_CURRENCY_SYMBOL}${(cents / 100).toFixed(2)}/mo`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/portal/modules/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: module.id,
          clientId,
          message,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send request");
      }

      toast.success("Request sent!", {
        description: "Your agency will review your request and get back to you.",
      });
      onSuccess();
    } catch (error) {
      console.error("Request error:", error);
      toast.error("Failed to send request", {
        description: error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{module.icon || "📦"}</span>
            Request {module.name}
          </DialogTitle>
          <DialogDescription>
            Send a request to your agency to add this app to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Price</span>
              <span className="font-semibold">{formatPrice(module.agencyPrice)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pricing is set by your agency. Final pricing may vary.
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Message to Agency (optional)
            </label>
            <Textarea
              placeholder="Tell your agency why you need this app..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
