"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileCommandSheet } from "./mobile-command-sheet";
import { cn } from "@/lib/utils";

interface MobileSearchTriggerProps {
  sites?: Array<{ id: string; name: string; subdomain: string }>;
  clients?: Array<{ id: string; name: string }>;
  className?: string;
}

/**
 * Search trigger button for mobile header.
 * Opens the mobile command sheet.
 */
export function MobileSearchTrigger({ sites, clients, className }: MobileSearchTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-10 w-10 touch-manipulation", className)}
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </Button>

      <MobileCommandSheet
        open={open}
        onOpenChange={setOpen}
        sites={sites}
        clients={clients}
      />
    </>
  );
}
