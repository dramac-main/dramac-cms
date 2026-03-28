/**
 * ProductStockBadge - Stock status indicator
 *
 * Phase ECOM-21: Product Display Components
 *
 * Displays stock status with appropriate styling.
 */
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check, X, AlertCircle, Package } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface ProductStockBadgeProps {
  /** Current stock quantity */
  stockQuantity: number;
  /** Whether inventory is tracked */
  trackInventory?: boolean;
  /** Whether to show the quantity number */
  showQuantity?: boolean;
  /** Low stock threshold */
  lowStockThreshold?: number;
  /** Additional class name */
  className?: string;
}

type StockStatus = "in-stock" | "low-stock" | "out-of-stock" | "unlimited";

// ============================================================================
// HELPERS
// ============================================================================

function getStockStatus(
  quantity: number,
  trackInventory: boolean,
  threshold: number,
): { status: StockStatus; quantity: number | null } {
  if (!trackInventory) {
    return { status: "unlimited", quantity: null };
  }

  if (quantity <= 0) {
    return { status: "out-of-stock", quantity: 0 };
  }

  if (quantity <= threshold) {
    return { status: "low-stock", quantity };
  }

  return { status: "in-stock", quantity };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductStockBadge({
  stockQuantity,
  trackInventory = true,
  showQuantity = false,
  lowStockThreshold = 5,
  className,
}: ProductStockBadgeProps) {
  const { status, quantity } = getStockStatus(
    stockQuantity,
    trackInventory,
    lowStockThreshold,
  );

  const statusConfig = {
    "in-stock": {
      icon: Check,
      text: "In Stock",
      bgClass: "bg-success/10",
      textClass: "text-success",
      iconClass: "text-success",
    },
    "low-stock": {
      icon: AlertCircle,
      text: `Only ${quantity} left`,
      bgClass: "bg-warning/10",
      textClass: "text-warning",
      iconClass: "text-warning",
    },
    "out-of-stock": {
      icon: X,
      text: "Out of Stock",
      bgClass: "bg-destructive/10",
      textClass: "text-destructive",
      iconClass: "text-destructive",
    },
    unlimited: {
      icon: Package,
      text: "Available",
      bgClass: "bg-primary/10",
      textClass: "text-primary",
      iconClass: "text-primary",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.bgClass,
        config.textClass,
        className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", config.iconClass)} />
      <span>{config.text}</span>
      {showQuantity && status === "in-stock" && quantity && (
        <span className="text-muted-foreground">({quantity})</span>
      )}
    </div>
  );
}
