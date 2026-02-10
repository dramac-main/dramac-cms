"use client";

import { useState } from "react";
import { Package, Settings, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import Link from "next/link";
import { formatCurrency } from "@/lib/locale-config";
import { ModuleIconContainer } from "@/components/modules/shared/module-icon-container";

interface ClientModule {
  id: string;
  client_id: string;
  module_id: string;
  is_enabled: boolean;
  price_paid: number;
  billing_status: string;
  installed_at: string;
  settings?: Record<string, unknown>;
  module: {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    category: string;
  };
}

interface ClientModulesListProps {
  modules: ClientModule[];
  clientId: string;
}

export function ClientModulesList({ modules, clientId }: ClientModulesListProps) {
  const [uninstallModule, setUninstallModule] = useState<ClientModule | null>(null);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const handleToggle = async (moduleId: string, currentEnabled: boolean) => {
    setIsToggling(moduleId);
    try {
      const response = await fetch(`/api/clients/${clientId}/modules/${moduleId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });

      if (!response.ok) throw new Error("Failed to toggle module");

      toast.success(currentEnabled ? "Module disabled" : "Module enabled");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to toggle module");
    } finally {
      setIsToggling(null);
    }
  };

  const handleUninstall = async () => {
    if (!uninstallModule) return;
    setIsUninstalling(true);

    try {
      const response = await fetch(
        `/api/clients/${clientId}/modules/${uninstallModule.module_id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to uninstall module");

      toast.success("Module uninstalled");
      setUninstallModule(null);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to uninstall module");
    } finally {
      setIsUninstalling(false);
    }
  };

  if (modules.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium mb-1">No modules installed</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Install modules from the &quot;Available&quot; tab to give this client access to apps and tools
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((item) => (
          <Card key={item.id} className={`group ${!item.is_enabled ? "opacity-60" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <ModuleIconContainer
                    icon={item.module.icon}
                    category={item.module.category}
                    size="md"
                  />
                  <div>
                    <CardTitle className="text-lg">{item.module.name}</CardTitle>
                    <Badge variant="outline" className="mt-1 text-muted-foreground">
                      {item.module.category}
                    </Badge>
                  </div>
                </div>
                <Badge variant={item.is_enabled ? "default" : "outline"}>
                  {item.is_enabled ? "Active" : "Disabled"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {item.module.description}
              </p>

              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-muted-foreground">Monthly cost:</span>
                <span className="font-medium">
                  {item.price_paid === 0 
                    ? <span className="text-muted-foreground">Free</span>
                    : `${formatCurrency(item.price_paid / 100)}/mo`
                  }
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={isToggling === item.module_id}
                  onClick={() => handleToggle(item.module_id, item.is_enabled)}
                >
                  {item.is_enabled ? (
                    <>
                      <ToggleRight className="h-4 w-4 mr-1" />
                      Disable
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-4 w-4 mr-1" />
                      Enable
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/clients/${clientId}/modules`}>
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUninstallModule(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Uninstall Confirmation Dialog */}
      <Dialog open={!!uninstallModule} onOpenChange={() => setUninstallModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uninstall Module</DialogTitle>
            <DialogDescription>
              Are you sure you want to uninstall &quot;{uninstallModule?.module.name}&quot;? 
              This will remove access for this client and stop billing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUninstallModule(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUninstall}
              disabled={isUninstalling}
            >
              {isUninstalling ? "Uninstalling..." : "Uninstall"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
