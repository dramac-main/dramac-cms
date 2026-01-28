import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUpRight } from "lucide-react";

interface WelcomeCardProps {
  userName?: string;
  agencyName?: string | null;
  subscriptionPlan?: string | null;
}

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pro: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export function WelcomeCard({ userName, agencyName, subscriptionPlan }: WelcomeCardProps) {
  const displayName = userName || "there";
  const plan = subscriptionPlan?.toLowerCase() || "free";
  const planColor = planColors[plan] || planColors.free;

  return (
    <Card className="bg-linear-to-br from-primary/5 via-transparent to-secondary/5 border-primary/10">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {displayName}! 👋
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              {agencyName && (
                <span className="font-medium text-foreground">{agencyName}</span>
              )}
              {subscriptionPlan && (
                <Badge variant="secondary" className={planColor}>
                  {subscriptionPlan} Plan
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground pt-1">
              Here&apos;s an overview of your platform activity and quick actions.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/sites/new?mode=ai">
              <Button className="gap-2">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
