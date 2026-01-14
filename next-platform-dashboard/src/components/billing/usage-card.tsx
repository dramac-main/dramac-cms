"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useBilling } from "@/lib/hooks/use-billing";
import { Users, Globe } from "lucide-react";

interface UsageCardProps {
  agencyId: string;
}

export function UsageCard({ agencyId }: UsageCardProps) {
  const { data: billing, isLoading } = useBilling(agencyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const subscription = billing?.subscription;
  const totalClients = billing?.totalClients || 0;
  const currentSeats = subscription?.quantity || 0;
  const usagePercent = currentSeats > 0 ? (totalClients / currentSeats) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Usage
        </CardTitle>
        <CardDescription>Current resource usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Client seats used</span>
            <span className="font-medium">{totalClients} / {currentSeats}</span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          {usagePercent >= 90 && (
            <p className="text-xs text-yellow-600">
              You&apos;re approaching your seat limit. Adding more clients will increase your subscription.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{totalClients}</div>
            <div className="text-xs text-muted-foreground">Active Clients</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <Globe className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{currentSeats}</div>
            <div className="text-xs text-muted-foreground">Seats Included</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Your subscription automatically adjusts based on the number of active clients.
        </p>
      </CardContent>
    </Card>
  );
}
