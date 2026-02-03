/**
 * DRAMAC Studio What's New Panel
 * 
 * Popover showing changelog and updates.
 * Shows unread indicator when new updates are available.
 * 
 * @phase STUDIO-26
 */

"use client";

import { useState, useEffect } from "react";
import { Sparkles, ExternalLink, Rocket, Zap, Wrench } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  CHANGELOG,
  hasUnreadUpdates,
  markUpdatesAsRead,
  type ChangeType,
  type ChangelogRelease,
} from "@/lib/studio/onboarding/changelog";
import type { LucideIcon } from "lucide-react";

// =============================================================================
// CHANGE TYPE CONFIG
// =============================================================================

const CHANGE_TYPE_CONFIG: Record<
  ChangeType,
  {
    label: string;
    icon: LucideIcon;
    color: string;
  }
> = {
  feature: {
    label: "New",
    icon: Rocket,
    color: "bg-green-500/10 text-green-600 border-green-500/30",
  },
  improvement: {
    label: "Improved",
    icon: Zap,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  fix: {
    label: "Fixed",
    icon: Wrench,
    color: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function WhatsNewPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Check for unread updates on mount
  useEffect(() => {
    setHasUnread(hasUnreadUpdates());
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && hasUnread) {
      markUpdatesAsRead();
      setHasUnread(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label="What's new"
          data-tooltip="whats-new"
        >
          <Sparkles className="w-4 h-4" />

          {/* Unread indicator */}
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">What&apos;s New</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Latest updates and improvements
          </p>
        </div>

        <Separator />

        {/* Changelog */}
        <ScrollArea className="h-80">
          <div className="p-4 space-y-6">
            {CHANGELOG.map((release, i) => (
              <ReleaseSection
                key={release.version}
                release={release}
                isLatest={i === 0}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <div className="p-3">
          <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
            <a href="/changelog" target="_blank" rel="noopener noreferrer">
              View full changelog
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// RELEASE SECTION
// =============================================================================

interface ReleaseSectionProps {
  release: ChangelogRelease;
  isLatest: boolean;
}

function ReleaseSection({ release, isLatest }: ReleaseSectionProps) {
  const formattedDate = new Date(release.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      {/* Version header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge variant={isLatest ? "default" : "secondary"}>v{release.version}</Badge>
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
        {isLatest && (
          <Badge variant="outline" className="text-green-600 border-green-500">
            Latest
          </Badge>
        )}
      </div>

      {/* Changes */}
      <div className="space-y-3">
        {release.changes.map((change, i) => {
          const config = CHANGE_TYPE_CONFIG[change.type];
          const Icon = config.icon;

          return (
            <div key={i} className="flex gap-3">
              {/* Type badge */}
              <Badge
                variant="outline"
                className={cn("flex-shrink-0 gap-1 text-xs h-6", config.color)}
              >
                <Icon className="w-3 h-3" />
                {config.label}
              </Badge>

              {/* Change content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{change.title}</p>
                <p className="text-xs text-muted-foreground">{change.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WhatsNewPanel;
