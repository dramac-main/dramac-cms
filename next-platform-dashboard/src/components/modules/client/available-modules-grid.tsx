"use client";

import { useState } from "react";
import { Package, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/locale-config";
import { ModuleIconContainer } from "@/components/modules/shared/module-icon-container";

interface ModuleSubscription {
  id: string;
  module_id: string;
  agency_id: string;
  status: string;
  markup_type: string;
  markup_percentage: number | null;
  markup_fixed_amount: number | null;
  custom_price_monthly: number | null;
  module: {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    category: string;
    wholesale_price_monthly: number;
    install_level: string;
  };
}

interface AvailableModulesGridProps {
  subscriptions: ModuleSubscription[];
  clientId: string;
  agencyId: string;
}

export function AvailableModulesGrid({ 
  subscriptions, 
  clientId, 
  agencyId 
}: AvailableModulesGridProps) {
  const [installModule, setInstallModule] = useState<ModuleSubscription | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  const calculateClientPrice = (sub: ModuleSubscription): number => {
    const wholesale = sub.module.wholesale_price_monthly;
    
    switch (sub.markup_type) {
      case 'percentage':
        return Math.round(wholesale * (1 + (sub.markup_percentage || 0) / 100));
      case 'fixed':
        return wholesale + (sub.markup_fixed_amount || 0);
      case 'custom':
        return sub.custom_price_monthly || wholesale;
      default:
        return wholesale;
    }
  };

  const handleInstall = async () => {
    if (!installModule) return;
    setIsInstalling(true);

    try {
      const clientPrice = calculateClientPrice(installModule);
      
      const response = await fetch(`/api/clients/${clientId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: installModule.module_id,
          agencyId: agencyId,
          pricePaid: clientPrice,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to install module");
      }

      toast.success("Module installed successfully!", {
        description: `${installModule.module.name} is now available for this client.`,
      });
      setInstallModule(null);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to install module");
    } finally {
      setIsInstalling(false);
    }
  };

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium mb-1">No modules available</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Subscribe to client-level modules in the marketplace to make them available here.
          </p>
          <Button asChild>
            <a href="/marketplace">Browse Marketplace</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map((sub) => {
          const clientPrice = calculateClientPrice(sub);
          
          return (
            <Card key={sub.id} className="group hover:border-primary/30 hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <ModuleIconContainer
                    icon={sub.module.icon}
                    category={sub.module.category}
                    size="md"
                  />
                  <div>
                    <CardTitle className="text-lg">{sub.module.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {sub.module.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {sub.module.description}
                </CardDescription>

                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-muted-foreground">Client pays:</span>
                  <span className="font-semibold">
                    {clientPrice === 0 
                      ? <span className="text-muted-foreground">Free</span>
                      : `${formatCurrency(clientPrice / 100)}/mo`
                    }
                  </span>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => setInstallModule(sub)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Install for Client
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Install Confirmation Dialog */}
      <Dialog open={!!installModule} onOpenChange={() => setInstallModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install Module</DialogTitle>
            <DialogDescription>
              Install &quot;{installModule?.module.name}&quot; for this client?
            </DialogDescription>
          </DialogHeader>
          
          {installModule && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <ModuleIconContainer
                  icon={installModule.module.icon}
                  category={installModule.module.category}
                  size="md"
                />
                <div>
                  <p className="font-medium">{installModule.module.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {installModule.module.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground mb-1">Your cost</p>
                  <p className="font-semibold">
                    {formatCurrency(installModule.module.wholesale_price_monthly / 100)}/mo
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-muted-foreground mb-1">Client pays</p>
                  <p className="font-semibold">
                    {formatCurrency(calculateClientPrice(installModule) / 100)}/mo
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                The client will be billed through your agency. You can manage billing in Settings.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setInstallModule(null)}>
              Cancel
            </Button>
            <Button onClick={handleInstall} disabled={isInstalling}>
              {isInstalling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Install Module
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
