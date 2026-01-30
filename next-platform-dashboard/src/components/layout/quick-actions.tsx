"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Globe,
  Users,
  ImageIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}

const actions: QuickAction[] = [
  {
    id: "new-site",
    title: "New Site",
    href: "/dashboard/sites?action=new",
    icon: Globe,
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    id: "new-client",
    title: "New Client",
    href: "/dashboard/clients?action=new",
    icon: Users,
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    id: "upload-media",
    title: "Upload Media",
    href: "/dashboard/media?action=upload",
    icon: ImageIcon,
    color: "bg-purple-500 hover:bg-purple-600",
  },
];

interface QuickActionsProps {
  /** Position on screen */
  position?: "bottom-right" | "bottom-left";
  /** Additional class name */
  className?: string;
}

/**
 * Floating quick actions button (FAB) with expandable menu.
 * Provides quick access to common creation actions.
 */
export function QuickActions({ position = "bottom-right", className }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleAction = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "fixed z-50 hidden lg:block",
          position === "bottom-right" && "bottom-6 right-6",
          position === "bottom-left" && "bottom-6 left-6",
          className
        )}
      >
        {/* Action buttons (expanded) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-16 right-0 flex flex-col gap-2"
            >
              {actions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        className={cn(
                          "h-12 w-12 rounded-full shadow-lg text-white",
                          action.color
                        )}
                        onClick={() => handleAction(action.href)}
                      >
                        <action.icon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" sideOffset={10}>
                      {action.title}
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className={cn(
                "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
                isOpen
                  ? "bg-muted hover:bg-muted text-foreground rotate-45"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Plus className="h-6 w-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={10}>
            {isOpen ? "Close" : "Quick Actions"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

/**
 * Inline quick actions bar for sidebar bottom.
 * Alternative to floating FAB.
 */
export function SidebarQuickActions({ collapsed }: { collapsed?: boolean }) {
  const router = useRouter();

  if (collapsed) {
    return (
      <TooltipProvider>
        <div className="flex flex-col items-center gap-1 px-2 py-2">
          {actions.slice(0, 2).map((action) => (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => router.push(action.href)}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {action.title}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 px-3 py-2">
        {actions.map((action) => (
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-8 gap-1.5 text-xs"
                onClick={() => router.push(action.href)}
              >
                <action.icon className="h-3.5 w-3.5" />
                <span className="truncate">{action.title.replace("New ", "")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {action.title}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
