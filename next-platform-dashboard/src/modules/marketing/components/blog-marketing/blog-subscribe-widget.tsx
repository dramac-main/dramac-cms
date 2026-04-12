/**
 * Blog Subscribe Widget
 *
 * Phase MKT-07: Newsletter opt-in component for blog pages.
 * Appears below posts, in sidebar, or as floating widget.
 * Connects to the marketing form/subscriber system.
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import type { WidgetPlacement } from "../../types/blog-marketing-types";

interface BlogSubscribeWidgetProps {
  siteId: string;
  heading?: string;
  description?: string;
  buttonText?: string;
  placement?: WidgetPlacement;
  formId?: string | null;
  className?: string;
}

export function BlogSubscribeWidget({
  siteId,
  heading = "Subscribe to Our Blog",
  description = "Get notified when we publish new content. No spam, unsubscribe anytime.",
  buttonText = "Subscribe",
  placement = "below_post",
  formId,
  className,
}: BlogSubscribeWidgetProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    setErrorMessage("");

    try {
      if (formId) {
        // Submit through marketing form system
        const response = await fetch(`/api/marketing/forms/submit/${formId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: { email: email.trim() },
            metadata: {
              source: "blog_subscribe_widget",
              siteId,
              placement,
            },
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Subscription failed");
        }
      } else {
        // Direct subscriber creation via API
        const response = await fetch("/api/marketing/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            siteId,
            source: "blog_subscribe_widget",
            tags: ["blog-subscriber"],
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Subscription failed");
        }
      }

      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  };

  if (status === "success") {
    return (
      <Card className={cn(getPlacementClasses(placement), className)}>
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          <p className="font-medium">You&apos;re subscribed!</p>
          <p className="text-sm text-muted-foreground">
            We&apos;ll send you our latest posts. Check your inbox to confirm.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(getPlacementClasses(placement), className)}>
      <CardContent className={cn("p-6", placement === "floating" && "p-4")}>
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base">{heading}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={status === "loading"}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={status === "loading" || !email.trim()}
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              buttonText
            )}
          </Button>
        </form>

        {status === "error" && errorMessage && (
          <p className="text-xs text-destructive mt-2">{errorMessage}</p>
        )}

        <p className="text-xs text-muted-foreground mt-3">
          No spam. Unsubscribe anytime.
        </p>
      </CardContent>
    </Card>
  );
}

function getPlacementClasses(placement: WidgetPlacement): string {
  switch (placement) {
    case "below_post":
      return "mt-8 border-primary/20";
    case "sidebar":
      return "sticky top-4";
    case "floating":
      return "fixed bottom-4 right-4 z-50 w-80 shadow-lg";
    default:
      return "";
  }
}
