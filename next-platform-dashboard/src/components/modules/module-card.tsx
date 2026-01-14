"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Module } from "@/types/modules";
import {
  BarChart3,
  Search,
  FileText,
  ShoppingCart,
  Newspaper,
  Globe,
  Users,
  Calendar,
  Package,
  Check,
  Star,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  Search,
  FileText,
  ShoppingCart,
  Newspaper,
  Globe,
  Users,
  Calendar,
  Package,
};

interface ModuleCardProps {
  module: Module;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
  onViewDetails?: () => void;
  isLoading?: boolean;
}

export function ModuleCard({
  module,
  isSubscribed,
  onSubscribe,
  onViewDetails,
  isLoading,
}: ModuleCardProps) {
  const Icon = iconMap[module.icon] || Package;

  return (
    <div className="bg-card border rounded-xl p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{module.name}</h3>
            <p className="text-sm text-muted-foreground">{module.category}</p>
          </div>
        </div>
        {module.is_featured && (
          <Badge variant="secondary" className="gap-1">
            <Star className="w-3 h-3" />
            Featured
          </Badge>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 flex-1">
        {module.description}
      </p>

      {/* Features preview */}
      {module.features.length > 0 && (
        <ul className="space-y-1 mb-4">
          {module.features.slice(0, 3).map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              {feature}
            </li>
          ))}
          {module.features.length > 3 && (
            <li className="text-xs text-muted-foreground">
              +{module.features.length - 3} more features
            </li>
          )}
        </ul>
      )}

      {/* Pricing */}
      <div className="mb-4 pt-4 border-t">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">${module.price_monthly}</span>
          <span className="text-sm text-muted-foreground">/month</span>
        </div>
        {module.price_yearly && (
          <p className="text-xs text-muted-foreground">
            or ${module.price_yearly}/year (save{" "}
            {Math.round((1 - module.price_yearly / (module.price_monthly * 12)) * 100)}%)
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onViewDetails}
        >
          Details
        </Button>
        {isSubscribed ? (
          <Button className="flex-1" disabled>
            <Check className="w-4 h-4 mr-2" />
            Subscribed
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={onSubscribe}
            disabled={isLoading}
          >
            {isLoading ? "Subscribing..." : "Subscribe"}
          </Button>
        )}
      </div>
    </div>
  );
}
