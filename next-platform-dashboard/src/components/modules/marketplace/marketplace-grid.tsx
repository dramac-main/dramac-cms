import Link from "next/link";
import { Package, Users, Building2, Globe, Check, Sparkles, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/locale-config";
import { ModuleIconContainer } from "@/components/modules/shared/module-icon-container";

interface Module {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  install_level: string;
  wholesale_price_monthly: number | null;
  install_count: number;
  rating_average: number | null;
  is_featured: boolean;
  source?: string; // 'catalog' or 'studio'
  status?: string; // 'published' or 'testing'
}

interface MarketplaceGridProps {
  modules: Module[];
  subscribedModuleIds: Set<string>;
}

export function MarketplaceGrid({ modules, subscribedModuleIds }: MarketplaceGridProps) {
  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">No modules found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  const formatPrice = (cents: number | null) => {
    if (!cents || cents === 0) return "Free";
    return `${formatCurrency(cents / 100)}/mo`;
  };

  const getInstallLevelIcon = (level: string) => {
    switch (level) {
      case "agency": return <Building2 className="h-3 w-3" />;
      case "client": return <Users className="h-3 w-3" />;
      case "site": return <Globe className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {modules.map((module) => {
        const isSubscribed = subscribedModuleIds.has(module.id);
        const isStudioModule = module.source === "studio";
        
        // Debug logging
        if (module.status === "testing") {
          console.log('[Grid] Testing module found:', module.name, module.slug, 'status:', module.status);
        }
        
        return (
          <Link key={module.id} href={`/marketplace/${module.slug}`}>
            <Card className="group h-full hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <ModuleIconContainer
                      icon={module.icon}
                      category={module.category}
                      size="lg"
                    />
                    <div className="min-w-0">
                      <CardTitle className="text-lg line-clamp-1">{module.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className="text-xs text-muted-foreground gap-1"
                        >
                          {getInstallLevelIcon(module.install_level)}
                          <span className="capitalize">{module.install_level}</span>
                        </Badge>
                        {isStudioModule && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Studio
                          </Badge>
                        )}
                        {module.status === "testing" && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <FlaskConical className="h-3 w-3" />
                            Beta
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSubscribed && (
                    <Badge variant="secondary" className="flex-shrink-0 gap-1 text-xs">
                      <Check className="h-3 w-3" />
                      Subscribed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {module.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-semibold">
                      {formatPrice(module.wholesale_price_monthly)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">wholesale</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {module.install_count || 0} installs
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
