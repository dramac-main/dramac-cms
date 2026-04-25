"use client";

/**
 * Onboarding checklist card — shown on the portal landing page.
 *
 * Steps are read-only and auto-complete when the underlying action is
 * actually taken. Users can dismiss the checklist but cannot manually
 * tick individual steps.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircle2Icon,
  CircleIcon,
  ArrowRightIcon,
  XIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  dismissOnboarding,
  type OnboardingState,
} from "@/lib/portal/onboarding-actions";

interface ChecklistProps {
  initialState: OnboardingState;
  totalSteps: number;
  completedSteps: number;
}

interface Step {
  flag: keyof Omit<OnboardingState, "dismissed">;
  title: string;
  description: string;
  href: string;
  cta: string;
}

const STEPS: Step[] = [
  {
    flag: "profile_confirmed",
    title: "Confirm your profile",
    description: "Add your name and contact details so the team can reach you.",
    href: "/portal/settings",
    cta: "Open profile",
  },
  {
    flag: "notifications_enabled",
    title: "Choose notification channels",
    description: "Pick which emails and push alerts you actually want.",
    href: "/portal/settings/notifications",
    cta: "Configure",
  },
  {
    flag: "app_installed",
    title: "Install the portal app",
    description: "Add the portal to your phone or desktop for instant access.",
    href: "/portal/notifications",
    cta: "Install",
  },
  {
    flag: "team_invited",
    title: "Invite your team",
    description: "Give colleagues their own portal accounts with the right permissions.",
    href: "/portal/team",
    cta: "Invite",
  },
  {
    flag: "first_order_seen",
    title: "Review your first order",
    description: "Walk through the orders dashboard once to know where things live.",
    href: "/portal/sites",
    cta: "Open sites",
  },
  {
    flag: "payments_setup",
    title: "Set up payment methods",
    description: "Configure a payment provider on your ecommerce store.",
    href: "/portal/sites",
    cta: "Configure store",
  },
];

export function OnboardingChecklist({
  initialState,
  totalSteps,
  completedSteps,
}: ChecklistProps) {
  const [dismissed, setDismissed] = useState(initialState.dismissed);
  const [isPending, startTransition] = useTransition();

  if (dismissed) return null;
  const allDone = completedSteps >= totalSteps;

  const handleDismiss = () => {
    setDismissed(true);
    startTransition(async () => {
      const res = await dismissOnboarding();
      if (!res.ok) {
        toast.error(res.error);
        setDismissed(false);
      }
    });
  };

  return (
    <Card className="border-primary/30 bg-primary/2">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            {allDone
              ? "Setup complete — nicely done."
              : "Get the most out of your portal"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {completedSteps} of {totalSteps} steps complete
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          disabled={isPending}
          aria-label="Dismiss checklist"
        >
          <XIcon className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={(completedSteps / totalSteps) * 100} />
        <div className="space-y-2">
          {STEPS.map((step) => {
            const isDone = initialState[step.flag];
            return (
              <div
                key={step.flag}
                className="flex items-start gap-3 rounded-md border p-3"
              >
                <span className="mt-0.5 shrink-0 text-muted-foreground">
                  {isDone ? (
                    <CheckCircle2Icon className="size-5 text-primary" />
                  ) : (
                    <CircleIcon className="size-5" />
                  )}
                </span>
                <div className="flex-1 space-y-0.5">
                  <p
                    className={`text-sm font-medium ${
                      isDone ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {!isDone && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={step.href}>
                      {step.cta}
                      <ArrowRightIcon className="ml-1 size-3" />
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
