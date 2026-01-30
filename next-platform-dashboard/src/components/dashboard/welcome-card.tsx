"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUpRight, Lightbulb, TrendingUp, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface WelcomeCardProps {
  userName?: string;
  agencyName?: string | null;
  subscriptionPlan?: string | null;
  showTips?: boolean;
}

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pro: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

// Tips to show randomly
const quickTips = [
  {
    icon: Sparkles,
    text: "Try the AI Builder to create pages 10x faster",
    link: "/dashboard/sites/new?mode=ai",
  },
  {
    icon: TrendingUp,
    text: "Install modules to add powerful features to your sites",
    link: "/marketplace",
  },
  {
    icon: Clock,
    text: "Schedule social media posts to keep your clients engaged",
    link: "/marketplace/v2",
  },
];

function getGreeting(): { greeting: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) {
    return { greeting: "Good morning", emoji: "🌅" };
  } else if (hour < 17) {
    return { greeting: "Good afternoon", emoji: "☀️" };
  } else if (hour < 21) {
    return { greeting: "Good evening", emoji: "🌆" };
  }
  return { greeting: "Good night", emoji: "🌙" };
}

export function WelcomeCard({ 
  userName, 
  agencyName, 
  subscriptionPlan,
  showTips = true,
}: WelcomeCardProps) {
  const displayName = userName || "there";
  const plan = subscriptionPlan?.toLowerCase() || "free";
  const planColor = planColors[plan] || planColors.free;
  const { greeting, emoji } = getGreeting();

  // Pick a random tip on mount
  const randomTip = useMemo(() => {
    return quickTips[Math.floor(Math.random() * quickTips.length)];
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="relative overflow-hidden border-primary/10">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            background: "radial-gradient(circle at 80% 20%, hsl(var(--primary) / 0.1) 0%, transparent 50%)",
          }}
        />
        
        <CardContent className="relative pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <motion.h1 
                className="text-2xl font-bold tracking-tight"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {greeting}, {displayName}! {emoji}
              </motion.h1>
              <motion.div 
                className="flex flex-wrap items-center gap-2 text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {agencyName && (
                  <span className="font-medium text-foreground">{agencyName}</span>
                )}
                {subscriptionPlan && (
                  <Badge variant="secondary" className={cn("capitalize", planColor)}>
                    {subscriptionPlan} Plan
                  </Badge>
                )}
              </motion.div>
              <motion.p 
                className="text-sm text-muted-foreground pt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                Here&apos;s an overview of your platform activity and quick actions.
              </motion.p>
            </div>
            
            <motion.div 
              className="flex gap-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Link href="/dashboard/sites/new?mode=ai">
                <Button className="gap-2 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  AI Builder
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="outline" className="gap-2">
                  Marketplace
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Quick Tip Section */}
          {showTips && (
            <motion.div
              className="mt-4 pt-4 border-t border-border/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <Link 
                href={randomTip.link}
                className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="font-medium">Quick tip:</span>
                <span>{randomTip.text}</span>
                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
