"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Download, Loader2, Check, ExternalLink, Sparkles } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ModuleDefinition } from "@/lib/modules/module-types";
import { formatPrice } from "@/lib/modules/module-catalog";
import { cn } from "@/lib/utils";

interface MarketplaceModuleCardProps {
  module: ModuleDefinition;
  isInstalled?: boolean;
  onInstall?: (moduleId: string) => Promise<void>;
  showInstallButton?: boolean;
  siteId?: string;
}

export function MarketplaceModuleCard({
  module,
  isInstalled = false,
  onInstall,
  showInstallButton = true,
}: MarketplaceModuleCardProps) {
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    if (!onInstall || isInstalled) return;
    setInstalling(true);
    try {
      await onInstall(module.id);
    } finally {
      setInstalling(false);
    }
  };

  const isFree = module.pricing.type === "free";
  const isBeta = module.status === "beta";
  const isStudioModule = module.source === "studio";

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-3xl flex-shrink-0">{module.icon}</span>
            <div className="min-w-0">
              <Link
                href={`/marketplace/${module.slug}`}
                className="font-semibold hover:text-primary transition-colors block truncate"
              >
                {module.name}
              </Link>
              <p className="text-xs text-muted-foreground truncate">
                by {module.author.name}
                {module.author.verified && (
                  <span className="ml-1 text-blue-500">✓</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            {isStudioModule && (
              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                <Sparkles className="h-3 w-3 mr-1" />
                Studio
              </Badge>
            )}
            {isBeta && (
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                Beta
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {module.description}
        </p>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          {module.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{module.rating.toFixed(1)}</span>
              <span>({module.reviewCount})</span>
            </div>
          )}
          {module.installCount && (
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              <span>{module.installCount.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {module.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t flex items-center justify-between">
        <div
          className={cn(
            "font-semibold",
            isFree ? "text-green-600" : "text-primary"
          )}
        >
          {formatPrice(module.pricing)}
        </div>

        {showInstallButton && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/marketplace/${module.slug}`}>
                <ExternalLink className="h-3 w-3 mr-1" />
                Details
              </Link>
            </Button>

            {isInstalled ? (
              <Button size="sm" variant="secondary" disabled>
                <Check className="h-3 w-3 mr-1" />
                Installed
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleInstall}
                disabled={installing}
              >
                {installing ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                {isFree ? "Install" : "Purchase"}
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
