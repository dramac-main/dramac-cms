"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useSiteModules,
  useEnableSiteModule,
  useDisableSiteModule,
} from "@/hooks/use-site-modules";
import {
  Package,
  Settings,
  Loader2,
  ExternalLink,
  BarChart3,
  Search,
  FileText,
  ShoppingCart,
  Newspaper,
  Globe,
  Users,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

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

interface SiteModulesTabProps {
  siteId: string;
}

export function SiteModulesTab({ siteId }: SiteModulesTabProps) {
  const { data: modules, isLoading } = useSiteModules(siteId);
  const enableMutation = useEnableSiteModule(siteId);
  const disableMutation = useDisableSiteModule(siteId);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (moduleId: string, currentlyEnabled: boolean) => {
    setTogglingId(moduleId);
    
    try {
      if (currentlyEnabled) {
        await disableMutation.mutateAsync(moduleId);
        toast.success("Module disabled");
      } else {
        await enableMutation.mutateAsync({ moduleId });
        toast.success("Module enabled");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update module");
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!modules?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">No modules available</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Subscribe to modules in the marketplace to enable them for this site
        </p>
        <Button asChild>
          <Link href="/marketplace">
            <ExternalLink className="w-4 h-4 mr-2" />
            Browse Marketplace
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Site Modules</h3>
          <p className="text-sm text-muted-foreground">
            Enable or disable modules for this site
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/marketplace">
            <Package className="w-4 h-4 mr-2" />
            Get More Modules
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {modules.map(({ module, siteModule, isEnabled }) => {
          const Icon = iconMap[module.icon] || Package;
          const isToggling = togglingId === module.id;

          return (
            <Card key={module.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{module.name}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isEnabled && (
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4 mr-1" />
                        Configure
                      </Button>
                    )}
                    <Switch
                      checked={isEnabled}
                      disabled={isToggling}
                      onCheckedChange={() => handleToggle(module.id, isEnabled)}
                    />
                  </div>
                </div>
              </CardHeader>
              {isEnabled && siteModule && (
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">Enabled</Badge>
                    <span>
                      Since {new Date(siteModule.enabled_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
