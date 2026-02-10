"use client";

import Link from "next/link";
import { Package, Settings, ExternalLink, Check, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/locale-config";

interface Subscription {
  id: string;
  module_id: string;
  status: string;
  billing_cycle: string;
  markup_type: string | null;
  markup_percentage: number | null;
  markup_fixed_amount: number | null;
  custom_price_monthly: number | null;
  retail_price_monthly_cached: number | null;
  current_period_end: string | null;
  created_at: string;
  module: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    description: string | null;
    category: string;
    install_level: string | null; // Optional for testing modules
    wholesale_price_monthly: number | null;
    suggested_retail_monthly: number | null;
  };
}

interface SubscriptionListProps {
  subscriptions: Subscription[];
}

export function SubscriptionList({ subscriptions }: SubscriptionListProps) {
  const formatPrice = (cents: number | null) => {
    if (!cents || cents === 0) return "Free";
    return formatCurrency(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500">
            <Check className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "past_due":
        return (
          <Badge className="bg-red-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            Past Due
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Canceled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInstallLevelColor = (level: string) => {
    switch (level) {
      case "agency": return "text-purple-600 bg-purple-100 dark:bg-purple-900";
      case "client": return "text-blue-600 bg-blue-100 dark:bg-blue-900";
      case "site": return "text-green-600 bg-green-100 dark:bg-green-900";
      default: return "";
    }
  };

  const calculateRetailPrice = (sub: Subscription): number => {
    const wholesale = (sub.module?.wholesale_price_monthly || 0) / 100;
    
    if (sub.retail_price_monthly_cached) {
      return sub.retail_price_monthly_cached / 100;
    }

    switch (sub.markup_type) {
      case "percentage":
        return wholesale + (wholesale * (sub.markup_percentage || 100) / 100);
      case "fixed":
        return wholesale + ((sub.markup_fixed_amount || 0) / 100);
      case "custom":
        return (sub.custom_price_monthly || 0) / 100;
      case "passthrough":
        return wholesale;
      default:
        return wholesale * 2; // Default 100% markup
    }
  };

  // Group by install level
  const agencyModules = subscriptions.filter(s => s.module?.install_level === "agency");
  const clientModules = subscriptions.filter(s => s.module?.install_level === "client");
  const siteModules = subscriptions.filter(s => s.module?.install_level === "site");
  // Testing modules may not have install_level set yet
  const testingModules = subscriptions.filter(s => !s.module?.install_level);

  const renderModuleCard = (sub: Subscription) => {
    const retail = calculateRetailPrice(sub);
    const wholesale = (sub.module?.wholesale_price_monthly || 0) / 100;
    const profit = retail - wholesale;

    return (
      <Card key={sub.id} className="hover:border-primary/50 transition-colors">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{sub.module?.icon || "📦"}</span>
              <div>
                <h3 className="font-medium">{sub.module?.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getInstallLevelColor(sub.module?.install_level || "")}`}
                  >
                    {sub.module?.install_level}
                  </Badge>
                  {getStatusBadge(sub.status)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/marketplace/${sub.module?.slug}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/modules/pricing">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {(sub.module?.install_level === "client" || sub.module?.install_level === "site") && (
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t text-center text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Your Cost</p>
                <p className="font-medium">{formatPrice(sub.module?.wholesale_price_monthly)}/mo</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Client Price</p>
                <p className="font-medium text-primary">{formatCurrency(retail)}/mo</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Profit</p>
                <p className="font-medium text-green-600">{formatCurrency(profit)}/mo</p>
              </div>
            </div>
          )}

          {sub.module?.install_level === "agency" && (
            <div className="mt-4 pt-4 border-t text-sm">
              <p className="text-muted-foreground">
                Monthly: <span className="font-medium text-foreground">{formatPrice(sub.module?.wholesale_price_monthly)}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Testing Modules (without install_level) */}
      {testingModules.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge variant="outline" className="text-yellow-600 bg-yellow-100">Beta Testing</Badge>
            Testing Modules
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (configure install level in module settings)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testingModules.map(renderModuleCard)}
          </div>
        </section>
      )}

      {/* Agency Tools */}
      {agencyModules.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge variant="outline" className="text-purple-600 bg-purple-100">Agency</Badge>
            Agency Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agencyModules.map(renderModuleCard)}
          </div>
        </section>
      )}

      {/* Client Apps */}
      {clientModules.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge variant="outline" className="text-blue-600 bg-blue-100">Client</Badge>
            Client Apps
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (install for clients to use)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientModules.map(renderModuleCard)}
          </div>
        </section>
      )}

      {/* Site Modules */}
      {siteModules.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 bg-green-100">Site</Badge>
            Site Modules
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (install on websites)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {siteModules.map(renderModuleCard)}
          </div>
        </section>
      )}
    </div>
  );
}
