"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserPlus, Globe, Sparkles, Upload, Package, Settings, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  variant: "default" | "outline" | "secondary";
  disabled?: boolean;
  disabledReason?: string;
  shortcut?: string;
  badge?: string;
}

interface QuickActionsProps {
  hasClients: boolean;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

export function QuickActions({ hasClients, className }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      label: "Add Client",
      description: "Register a new client account",
      icon: UserPlus,
      href: "/dashboard/clients/new",
      variant: "outline",
      shortcut: "C",
    },
    {
      label: "Create Site",
      description: hasClients ? "Build a new website" : "Add a client first",
      icon: Globe,
      href: "/dashboard/sites/new",
      variant: "outline",
      disabled: !hasClients,
      disabledReason: "You need to add a client before creating a site",
      shortcut: "S",
    },
    {
      label: "AI Builder",
      description: "Generate site with AI",
      icon: Sparkles,
      href: "/dashboard/sites/new?mode=ai",
      variant: "default",
      disabled: !hasClients,
      disabledReason: "You need to add a client before using AI Builder",
      badge: "AI",
    },
    {
      label: "Upload Media",
      description: "Add images and files",
      icon: Upload,
      href: "/dashboard/media",
      variant: "secondary",
    },
    {
      label: "Browse Modules",
      description: "Explore the marketplace",
      icon: Package,
      href: "/marketplace",
      variant: "secondary",
    },
    {
      label: "Settings",
      description: "Configure your account",
      icon: Settings,
      href: "/settings",
      variant: "outline",
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {actions.map((action) => {
              const Icon = action.icon;
              const content = (
                <motion.div variants={itemVariants} key={action.label}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        {action.disabled ? (
                          <Button
                            variant={action.variant}
                            disabled
                            className={cn(
                              "w-full h-auto py-3 px-4 flex flex-col items-center gap-2",
                              "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="relative">
                              <div className={cn(
                                "p-2 rounded-lg",
                                action.variant === "default" 
                                  ? "bg-primary-foreground/10" 
                                  : "bg-muted"
                              )}>
                                <Icon className="h-5 w-5" />
                              </div>
                              {action.badge && (
                                <Badge 
                                  variant="secondary" 
                                  className="absolute -top-1 -right-1 text-[10px] px-1 py-0"
                                >
                                  {action.badge}
                                </Badge>
                              )}
                            </div>
                            <div className="text-center">
                              <span className="font-medium text-sm">{action.label}</span>
                              {action.shortcut && (
                                <kbd className="ml-1 text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                                  {action.shortcut}
                                </kbd>
                              )}
                            </div>
                          </Button>
                        ) : (
                          <Link href={action.href} className="block">
                            <Button
                              variant={action.variant}
                              className={cn(
                                "w-full h-auto py-3 px-4 flex flex-col items-center gap-2",
                                "hover:scale-[1.02] active:scale-[0.98] transition-transform",
                                action.variant === "default" && "shadow-sm"
                              )}
                            >
                              <div className="relative">
                                <div className={cn(
                                  "p-2 rounded-lg transition-colors",
                                  action.variant === "default" 
                                    ? "bg-primary-foreground/10" 
                                    : "bg-muted group-hover:bg-muted/80"
                                )}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                {action.badge && (
                                  <Badge 
                                    variant="secondary" 
                                    className="absolute -top-1 -right-1 text-[10px] px-1 py-0"
                                  >
                                    {action.badge}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-center">
                                <span className="font-medium text-sm">{action.label}</span>
                                {action.shortcut && (
                                  <kbd className="ml-1 text-[10px] px-1 py-0.5 rounded bg-muted/50 text-muted-foreground">
                                    {action.shortcut}
                                  </kbd>
                                )}
                              </div>
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                      <p className="font-medium">{action.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {action.disabled ? action.disabledReason : action.description}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              );

              return content;
            })}
          </motion.div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
