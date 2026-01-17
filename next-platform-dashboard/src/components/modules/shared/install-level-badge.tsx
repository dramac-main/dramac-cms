"use client";

import { Building2, Users, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InstallLevelBadgeProps {
  level: string;
  className?: string;
  showIcon?: boolean;
}

const levelConfig = {
  agency: { 
    icon: Building2, 
    label: "Agency", 
    variant: "default" as const,
    description: "Tools for your agency",
  },
  client: { 
    icon: Users, 
    label: "Client", 
    variant: "secondary" as const,
    description: "Standalone client apps",
  },
  site: { 
    icon: Globe, 
    label: "Site", 
    variant: "outline" as const,
    description: "Website modules",
  },
};

export function InstallLevelBadge({ level, className, showIcon = true }: InstallLevelBadgeProps) {
  const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.site;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn("gap-1", className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

export function getInstallLevelDescription(level: string): string {
  return levelConfig[level as keyof typeof levelConfig]?.description || "Unknown level";
}
