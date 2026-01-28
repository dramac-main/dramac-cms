import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Puzzle, ArrowRight, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ModuleSubscriptionInfo } from "@/lib/actions/dashboard";

interface ModuleSubscriptionsProps {
  subscriptions: ModuleSubscriptionInfo[];
}

export function ModuleSubscriptions({ subscriptions }: ModuleSubscriptionsProps) {
  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Installed Modules</CardTitle>
          <CardDescription>No modules installed yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Puzzle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Browse the marketplace to find modules.
            </p>
            <Link href="/marketplace">
              <Button>
                <Package className="mr-2 h-4 w-4" />
                Browse Modules
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Installed Modules</CardTitle>
          <CardDescription>Active module subscriptions</CardDescription>
        </div>
        <Link href="/dashboard/modules/subscriptions">
          <Button variant="ghost" size="sm">
            Manage
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <Puzzle className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{sub.moduleName}</p>
                  {sub.installedAt && (
                    <p className="text-xs text-muted-foreground">
                      Installed {formatDistanceToNow(new Date(sub.installedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className={sub.status === "active" 
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                  : "bg-muted text-muted-foreground"
                }
              >
                {sub.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
