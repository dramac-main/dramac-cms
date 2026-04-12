/**
 * Marketing Hub Skeleton
 * Loading state for the marketing hub dashboard.
 * Layout matches MarketingHubClient exactly.
 */
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function MarketingHubSkeleton() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-28 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div>
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-4">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Campaigns + Active Sequences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[0, 1].map((section) => (
          <Card key={section}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-28 mt-1" />
              </div>
              <Skeleton className="h-8 w-20" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-9 w-16 mx-auto" />
                <Skeleton className="h-3 w-24 mx-auto mt-2" />
                <Skeleton className="h-2 w-28 mx-auto mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-56 mt-1" />
          </div>
          <Skeleton className="h-8 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6">
            <Skeleton className="h-8 w-8 rounded-full mb-3" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-64 mt-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
