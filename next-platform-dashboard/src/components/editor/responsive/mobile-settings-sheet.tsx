"use client";

import { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { X, RotateCcw, Check } from "lucide-react";

interface MobileSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Show footer with action buttons */
  showFooter?: boolean;
  /** Called when user clicks Apply/Save */
  onApply?: () => void;
  /** Called when user clicks Reset */
  onReset?: () => void;
  /** Disable Apply button */
  applyDisabled?: boolean;
  /** Show Reset button */
  showReset?: boolean;
  /** Custom Apply button text */
  applyText?: string;
}

export function MobileSettingsSheet({
  open,
  onOpenChange,
  title = "Settings",
  description,
  children,
  showFooter = false,
  onApply,
  onReset,
  applyDisabled = false,
  showReset = false,
  applyText = "Apply",
}: MobileSettingsSheetProps) {
  const handleApply = useCallback(() => {
    onApply?.();
    onOpenChange(false);
  }, [onApply, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "h-[75vh] rounded-t-xl",
          showFooter && "h-[80vh]"
        )}
      >
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <SheetDescription>{description}</SheetDescription>
          )}
        </SheetHeader>

        <ScrollArea className={cn(
          "mt-4",
          showFooter ? "h-[calc(75vh-140px)]" : "h-[calc(75vh-80px)]"
        )}>
          <div className="pb-8 pr-4">{children}</div>
        </ScrollArea>

        {showFooter && (
          <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-inset-bottom">
            <div className="flex gap-2 w-full">
              {showReset && (
                <Button
                  variant="outline"
                  onClick={onReset}
                  className="flex-1 touch-manipulation"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              )}
              <Button
                onClick={handleApply}
                disabled={applyDisabled}
                className={cn(
                  "flex-1 touch-manipulation",
                  !showReset && "w-full"
                )}
              >
                <Check className="mr-2 h-4 w-4" />
                {applyText}
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Tabbed version of settings sheet for multiple setting categories
 */
interface TabbedSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  tabs: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
  }[];
  defaultTab?: string;
}

export function TabbedSettingsSheet({
  open,
  onOpenChange,
  title = "Settings",
  tabs,
  defaultTab,
}: TabbedSettingsSheetProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-xl p-0">
        <div className="p-6 pb-2">
          <SheetHeader className="text-left">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-[calc(80vh-80px)]"
        >
          <div className="px-6">
            <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="touch-manipulation"
                >
                  {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            {tabs.map((tab) => (
              <TabsContent
                key={tab.id}
                value={tab.id}
                className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <ScrollArea className="flex-1 px-6">
                  <div className="pb-8 pt-4">{tab.content}</div>
                </ScrollArea>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Hook for managing mobile settings sheet state
 */
export function useMobileSettingsSheet(defaultOpen = false) {
  const [open, setOpen] = useState(defaultOpen);

  const openSheet = useCallback(() => setOpen(true), []);
  const closeSheet = useCallback(() => setOpen(false), []);
  const toggleSheet = useCallback(() => setOpen((prev) => !prev), []);

  return {
    open,
    setOpen,
    openSheet,
    closeSheet,
    toggleSheet,
  };
}
