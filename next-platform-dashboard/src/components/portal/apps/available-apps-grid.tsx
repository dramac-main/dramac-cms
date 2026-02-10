"use client";

import { useState } from "react";
import { Star, Check } from "lucide-react";
import { icons } from "lucide-react";
import { resolveIconName } from "@/lib/utils/icon-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RequestAppDialog } from "./request-app-dialog";
import { DEFAULT_CURRENCY_SYMBOL } from "@/lib/locale-config";

interface Module {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  agencyPrice: number; // in cents
  is_featured: boolean;
}

interface AvailableAppsGridProps {
  modules: Module[];
  clientId: string;
}

export function AvailableAppsGrid({ modules, clientId }: AvailableAppsGridProps) {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [requestedModules, setRequestedModules] = useState<Set<string>>(new Set());

  const formatPrice = (cents: number) => {
    if (!cents || cents === 0) return "Free";
    return `${DEFAULT_CURRENCY_SYMBOL}${(cents / 100).toFixed(2)}/mo`;
  };

  // Sort: featured first, then alphabetically
  const sortedModules = [...modules].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedModules.map((module) => {
          const isRequested = requestedModules.has(module.id);
          
          return (
            <Card key={module.id} className="group hover:border-primary/30 hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:animate-iconBreathe">
                    {(() => { const I = icons[resolveIconName(module.icon) as keyof typeof icons] || icons.Package; return <I className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />; })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg truncate">{module.name}</CardTitle>
                      {module.is_featured && (
                        <Star className="h-4 w-4 fill-current text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <Badge variant="outline" className="mt-1">{module.category}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {module.description || "No description available"}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {formatPrice(module.agencyPrice)}
                  </span>
                  
                  {isRequested ? (
                    <Button variant="outline" disabled>
                      <Check className="h-4 w-4 mr-2" />
                      Requested
                    </Button>
                  ) : (
                    <Button onClick={() => setSelectedModule(module)}>
                      Request App
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Request Dialog */}
      {selectedModule && (
        <RequestAppDialog
          module={selectedModule}
          clientId={clientId}
          open={!!selectedModule}
          onOpenChange={(open) => !open && setSelectedModule(null)}
          onSuccess={() => {
            setRequestedModules(prev => new Set([...prev, selectedModule.id]));
            setSelectedModule(null);
          }}
        />
      )}
    </>
  );
}
