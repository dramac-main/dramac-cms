import Link from "next/link";
import { Package, Users, Building2, Globe, Check, Sparkles, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/locale-config";

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

  const getInstallLevelColor = (level: string) => {
    switch (level) {
      case "agency": return "text-purple-600 bg-purple-100 dark:bg-purple-900";
      case "client": return "text-blue-600 bg-blue-100 dark:bg-blue-900";
      case "site": return "text-green-600 bg-green-100 dark:bg-green-900";
      default: return "";
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
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-3xl flex-shrink-0">{module.icon || "📦"}</span>
                    <div className="min-w-0">
                      <CardTitle className="text-lg line-clamp-1">{module.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getInstallLevelColor(module.install_level)}`}
                        >
                          {getInstallLevelIcon(module.install_level)}
                          <span className="ml-1 capitalize">{module.install_level}</span>
                        </Badge>
                        {isStudioModule && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Studio
                          </Badge>
                        )}
                        {module.status === "testing" && (
                          <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700">
                            <FlaskConical className="h-3 w-3 mr-1" />
                            Beta
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSubscribed && (
                    <Badge className="bg-green-500 hover:bg-green-600 flex-shrink-0">
                      <Check className="h-3 w-3 mr-1" />
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
                    <span className="text-lg font-semibold text-primary">
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
