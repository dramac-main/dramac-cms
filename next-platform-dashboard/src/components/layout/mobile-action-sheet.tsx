"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  Plus,
  Globe,
  Users,
  ImageIcon,
  FileText,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const actions: ActionItem[] = [
  {
    id: "new-site",
    title: "New Site",
    description: "Create a new website",
    href: "/dashboard/sites?action=new",
    icon: Globe,
    color: "bg-blue-500",
  },
  {
    id: "new-client",
    title: "New Client",
    description: "Add a client account",
    href: "/dashboard/clients?action=new",
    icon: Users,
    color: "bg-green-500",
  },
  {
    id: "upload-media",
    title: "Upload Media",
    description: "Add images or files",
    href: "/dashboard/media?action=upload",
    icon: ImageIcon,
    color: "bg-purple-500",
  },
  {
    id: "new-page",
    title: "New Page",
    description: "Create a new page",
    href: "/dashboard/sites?action=new-page",
    icon: FileText,
    color: "bg-orange-500",
  },
];

interface MobileActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Mobile action sheet for quick creation actions.
 * Triggered by FAB or long-press on bottom nav.
 */
export function MobileActionSheet({ open, onOpenChange }: MobileActionSheetProps) {
  const router = useRouter();

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange]
  );

  // Handle drag to dismiss
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onOpenChange(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-background shadow-xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <div>
                <h2 className="text-lg font-semibold">Quick Actions</h2>
                <p className="text-sm text-muted-foreground">Create something new</p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted active:bg-muted/80 touch-manipulation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Actions grid */}
            <div className="grid grid-cols-2 gap-3 px-4 pb-8">
              {actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelect(action.href)}
                  className="flex flex-col items-start gap-3 rounded-2xl bg-muted/50 p-4 text-left active:bg-muted transition-colors touch-manipulation"
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl text-white",
                      action.color
                    )}
                  >
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{action.title}</p>
                    {action.description && (
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
