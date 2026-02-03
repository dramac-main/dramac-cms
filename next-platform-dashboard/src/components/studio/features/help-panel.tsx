/**
 * DRAMAC Studio Help Panel
 * 
 * Slide-out help panel with documentation links and resources.
 * 
 * @phase STUDIO-26
 */

"use client";

import { useState } from "react";
import {
  HelpCircle,
  ExternalLink,
  Play,
  ChevronRight,
  RefreshCw,
  Keyboard,
  PlusSquare,
  Pencil,
  LayoutTemplate,
  Smartphone,
  Sparkles,
  Puzzle,
  Code,
  Search,
  PlayCircle,
  Users,
  Mail,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { HELP_SECTIONS, type HelpItem, type HelpSection } from "@/lib/studio/onboarding/help-content";
import { useTutorialOptional } from "../onboarding/tutorial-provider";
import { useUIStore } from "@/lib/studio/store";
import type { LucideIcon } from "lucide-react";

// =============================================================================
// ICON MAPPING
// =============================================================================

const ICONS: Record<string, LucideIcon> = {
  "plus-square": PlusSquare,
  edit: Pencil,
  "layout-template": LayoutTemplate,
  smartphone: Smartphone,
  sparkles: Sparkles,
  puzzle: Puzzle,
  code: Code,
  search: Search,
  keyboard: Keyboard,
  "refresh-cw": RefreshCw,
  "play-circle": PlayCircle,
  users: Users,
  mail: Mail,
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface HelpPanelProps {
  /** Callback when shortcuts should be opened */
  onOpenShortcuts?: () => void;
}

export function HelpPanel({ onOpenShortcuts }: HelpPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tutorial = useTutorialOptional();
  const setShortcutsPanelOpen = useUIStore((s) => s.setShortcutsPanelOpen);

  const handleAction = (action: string) => {
    switch (action) {
      case "openShortcuts":
        setIsOpen(false);
        if (onOpenShortcuts) {
          onOpenShortcuts();
        } else {
          setShortcutsPanelOpen(true);
        }
        break;
      case "restartTutorial":
        setIsOpen(false);
        tutorial?.restartTutorial();
        break;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          data-tooltip="help-panel"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Help</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[400px] sm:w-[450px] p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Help & Resources
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="p-6 space-y-6">
            {HELP_SECTIONS.map((section) => (
              <HelpSectionComponent
                key={section.title}
                section={section}
                onAction={handleAction}
              />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// =============================================================================
// HELP SECTION
// =============================================================================

interface HelpSectionProps {
  section: HelpSection;
  onAction: (action: string) => void;
}

function HelpSectionComponent({ section, onAction }: HelpSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
        {section.title}
      </h3>
      <div className="space-y-1">
        {section.items.map((item) => (
          <HelpItemComponent key={item.title} item={item} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// HELP ITEM
// =============================================================================

interface HelpItemProps {
  item: HelpItem;
  onAction: (action: string) => void;
}

function HelpItemComponent({ item, onAction }: HelpItemProps) {
  const IconComponent = item.icon ? ICONS[item.icon] : null;

  const handleClick = () => {
    if (item.action) {
      onAction(item.action);
    } else if (item.link) {
      window.open(item.link, "_blank");
    }
  };

  const isExternal = item.link?.startsWith("http");

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg text-left",
        "hover:bg-muted/50 transition-colors group"
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        {IconComponent && <IconComponent className="w-4 h-4 text-muted-foreground" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{item.title}</span>
          {isExternal && (
            <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          )}
          {item.video && (
            <Play className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
    </button>
  );
}

export default HelpPanel;
