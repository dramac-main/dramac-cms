"use client";

import { Layers } from "@craftjs/layers";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Layers as LayersIcon } from "lucide-react";

export function LayersToggle() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <LayersIcon className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Layers</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <Layers expandRootOnLoad />
        </div>
      </SheetContent>
    </Sheet>
  );
}
