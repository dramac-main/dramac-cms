"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Module } from "@/types/modules";
import {
  Check,
  Star,
  Package,
  BarChart3,
  Search,
  FileText,
  ShoppingCart,
  Newspaper,
  Globe,
  Users,
  Calendar,
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

interface ModuleDetailSheetProps {
  module: Module | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubscribed?: boolean;
  onSubscribe?: (billingCycle: "monthly" | "yearly") => void;
  isLoading?: boolean;
}

export function ModuleDetailSheet({
  module,
  open,
  onOpenChange,
  isSubscribed,
  onSubscribe,
  isLoading,
}: ModuleDetailSheetProps) {
  if (!module) return null;

  const Icon = iconMap[module.icon] || Package;
  const yearlySavings = module.price_yearly
    ? Math.round((1 - module.price_yearly / (module.price_monthly * 12)) * 100)
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">{module.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{module.category}</Badge>
                {module.is_featured && (
                  <Badge variant="outline" className="gap-1">
                    <Star className="w-3 h-3" />
                    Featured
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  v{module.version}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Description */}
          <p className="text-muted-foreground">
            {module.long_description || module.description}
          </p>

          {/* Pricing Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="p-4 rounded-lg border-2 border-border cursor-pointer hover:border-primary transition-colors"
              onClick={() => onSubscribe?.("monthly")}
            >
              <p className="text-sm font-medium mb-1">Monthly</p>
              <p className="text-2xl font-bold">${module.price_monthly}</p>
              <p className="text-xs text-muted-foreground">/month</p>
            </div>
            {module.price_yearly && (
              <div
                className="p-4 rounded-lg border-2 border-primary bg-primary/5 cursor-pointer relative"
                onClick={() => onSubscribe?.("yearly")}
              >
                <Badge className="absolute -top-2 -right-2 text-xs">
                  Save {yearlySavings}%
                </Badge>
                <p className="text-sm font-medium mb-1">Yearly</p>
                <p className="text-2xl font-bold">${module.price_yearly}</p>
                <p className="text-xs text-muted-foreground">/year</p>
              </div>
            )}
          </div>

          {/* Subscribe Button */}
          {isSubscribed ? (
            <Button className="w-full" disabled>
              <Check className="w-4 h-4 mr-2" />
              Already Subscribed
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => onSubscribe?.("monthly")}
              disabled={isLoading}
            >
              {isLoading ? "Subscribing..." : "Subscribe Now"}
            </Button>
          )}

          {/* Features Tabs */}
          <Tabs defaultValue="features">
            <TabsList className="w-full">
              <TabsTrigger value="features" className="flex-1">
                Features
              </TabsTrigger>
              <TabsTrigger value="requirements" className="flex-1">
                Requirements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="mt-4">
              <ul className="space-y-3">
                {module.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="requirements" className="mt-4">
              {module.requirements.length > 0 ? (
                <ul className="space-y-2">
                  {module.requirements.map((req, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      • {req}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No special requirements. This module works with all sites.
                </p>
              )}
            </TabsContent>
          </Tabs>

          {/* Screenshots */}
          {module.screenshots.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Screenshots</h4>
              <div className="space-y-2">
                {module.screenshots.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${module.name} screenshot ${index + 1}`}
                    className="rounded-lg border w-full"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
