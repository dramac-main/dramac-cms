// src/components/marketplace/ModuleCard.tsx

"use client";

import Link from "next/link";
import { Star, Download, Shield, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/locale-config";
import { ModuleIconContainer } from "@/components/modules/shared/module-icon-container";

interface ModuleCardProps {
  module: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    category: string | null;
    type: string | null;
    rating: number;
    review_count: number;
    install_count: number;
    price: number | null;
    developer?: {
      name: string;
      slug: string;
      is_verified: boolean;
    } | null;
    tags?: string[];
  };
  featured?: boolean;
}

export function ModuleCard({ module, featured }: ModuleCardProps) {
  const formatDownloads = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Link href={`/marketplace/modules/${module.slug}`}>
      <Card
        className={`group h-full hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer ${
          featured ? "border-2 border-primary" : ""
        }`}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <ModuleIconContainer
              icon={module.icon}
              category={module.category}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{module.name}</h3>
              {module.developer && (
                <Link
                  href={`/marketplace/developers/${module.developer.slug}`}
                  className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {module.developer.name}
                  {module.developer.is_verified && (
                    <Shield className="h-3 w-3 text-muted-foreground/70" />
                  )}
                </Link>
              )}
            </div>
            {featured && (
              <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                Featured
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {module.description || "No description available"}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
              <span className="text-foreground font-medium">{module.rating.toFixed(1)}</span>
              <span className="text-xs">({module.review_count})</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              <span>{formatDownloads(module.install_count)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 flex-wrap">
              {module.type && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {module.type}
                </Badge>
              )}
              {module.category && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {module.category}
                </Badge>
              )}
            </div>
            <div className="font-semibold text-sm">
              {module.price && module.price > 0
                ? `${formatCurrency(module.price)}/mo`
                : <span className="text-muted-foreground">Free</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Skeleton for loading state
export function ModuleCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-5 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        </div>
        <div className="flex gap-4 mb-3">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex justify-between">
          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
