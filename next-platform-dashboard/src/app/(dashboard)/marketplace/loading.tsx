import { Loader2 } from "lucide-react";

export default function MarketplaceLoading() {
  return (
    <div className="container py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="h-9 w-64 bg-muted rounded animate-pulse mb-2" />
        <div className="h-5 w-80 bg-muted rounded animate-pulse" />
      </div>

      {/* Search & Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="h-10 flex-1 bg-muted rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-[160px] bg-muted rounded animate-pulse" />
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Category Filter Skeleton */}
      <div className="mb-6 flex gap-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-muted rounded animate-pulse" />
        ))}
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
