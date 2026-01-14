"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useModuleSubscriptions, useCancelModuleSubscription } from "@/lib/hooks/use-module-subscription";
import { formatDate } from "@/lib/utils";
import { Layers, Trash2, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

interface ModuleSubscriptionsProps {
  agencyId: string;
}

export function ModuleSubscriptions({ agencyId }: ModuleSubscriptionsProps) {
  const { data: subscriptions, isLoading } = useModuleSubscriptions(agencyId);
  const cancelMutation = useCancelModuleSubscription();

  const handleCancel = (moduleId: string) => {
    cancelMutation.mutate({ agencyId, moduleId });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Module Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeSubscriptions = subscriptions?.filter(
    (s) => s.status === "active" && !s.cancel_at_period_end
  ) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Module Subscriptions
            </CardTitle>
            <CardDescription>Modules you&apos;ve subscribed to</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/marketplace">
              <ExternalLink className="h-4 w-4 mr-2" />
              Browse Modules
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeSubscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No module subscriptions yet.</p>
            <p className="text-sm">Visit the marketplace to add powerful features to your sites.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-md">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{sub.module?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {sub.billing_cycle === "yearly" ? "Annual" : "Monthly"} •
                      {sub.current_period_end && `Renews ${formatDate(sub.current_period_end)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{sub.module?.category}</Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Module Subscription</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel {sub.module?.name}? You&apos;ll still have access until{" "}
                          {sub.current_period_end && formatDate(sub.current_period_end)}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancel(sub.module_id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Cancel Subscription
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
