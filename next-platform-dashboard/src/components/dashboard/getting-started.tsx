"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Globe,
  Sparkles,
  Rocket,
  CheckCircle2,
  Circle,
  X,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GettingStartedProps {
  totalClients: number;
  totalSites: number;
  publishedSites: number;
}

interface Step {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: typeof Users;
  isComplete: boolean;
}

const DISMISSED_KEY = "dramac-getting-started-dismissed";

export function GettingStartedCard({
  totalClients,
  totalSites,
  publishedSites,
}: GettingStartedProps) {
  const [dismissed, setDismissed] = useState(() => {
    // SSR-safe: default to true (hidden) on server, check localStorage on client
    if (typeof window === "undefined") return true;
    return localStorage.getItem(DISMISSED_KEY) === "true";
  });

  const steps: Step[] = [
    {
      id: "client",
      title: "Add your first client",
      description: "Create a client profile to organize your work",
      href: "/dashboard/clients",
      icon: Users,
      isComplete: totalClients > 0,
    },
    {
      id: "site",
      title: "Create a website",
      description: "Use the AI Builder to generate a site in minutes",
      href: "/dashboard/sites/new?mode=ai",
      icon: Sparkles,
      isComplete: totalSites > 0,
    },
    {
      id: "publish",
      title: "Publish your site",
      description: "Go live and share your site with the world",
      href: "/dashboard/sites",
      icon: Rocket,
      isComplete: publishedSites > 0,
    },
  ];

  const completedCount = steps.filter((s) => s.isComplete).length;
  const allDone = completedCount === steps.length;

  // Don't show if dismissed or all steps are complete
  if (dismissed || allDone) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative border-primary/20 bg-linear-to-br from-primary/5 via-background to-background">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>

          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Getting Started</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete these steps to set up your agency
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {completedCount} of {steps.length} complete
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {steps.map((step, i) => {
              return (
                <Link key={step.id} href={step.href}>
                  <motion.div
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      step.isComplete
                        ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30"
                        : "border-border hover:border-primary/30 hover:bg-accent/50"
                    )}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {step.isComplete ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          step.isComplete && "text-green-700 dark:text-green-300"
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {step.description}
                      </p>
                    </div>

                    {!step.isComplete && (
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
