"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { MobileActionSheet } from "./mobile-action-sheet";
import { cn } from "@/lib/utils";

interface MobileFABProps {
  className?: string;
}

/**
 * Mobile Floating Action Button.
 * Positioned above the bottom navigation.
 * Opens the action sheet for quick creation.
 */
export function MobileFAB({ className }: MobileFABProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className={cn(
          "fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden",
          "bottom-20 right-4", // Above bottom nav
          "active:bg-primary/90 touch-manipulation",
          className
        )}
        aria-label="Create new"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      <MobileActionSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
