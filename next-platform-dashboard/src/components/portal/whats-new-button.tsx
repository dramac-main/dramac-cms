"use client";

/**
 * What's New popover button.
 *
 * Lives in the portal header. Reads localStorage to determine whether
 * any entries are newer than what the user last acknowledged and shows
 * a small dot indicator if so. On open, marks the latest version seen.
 */

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import whatsNewData from "@/data/whats-new.json";

const STORAGE_KEY = "portal:whats-new:last-seen-version";

interface Entry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

const entries = (whatsNewData.entries ?? []) as Entry[];
const latestVersion = entries[0]?.version ?? "";

export function WhatsNewButton() {
  const [open, setOpen] = useState(false);
  const [hasUnseen, setHasUnseen] = useState(false);

  useEffect(() => {
    if (!latestVersion) {
      setHasUnseen(false);
      return;
    }
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      setHasUnseen(seen !== latestVersion);
    } catch {
      setHasUnseen(false);
    }
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && latestVersion) {
      try {
        window.localStorage.setItem(STORAGE_KEY, latestVersion);
      } catch {
        // ignore storage errors (private mode, etc.)
      }
      setHasUnseen(false);
    }
  };

  if (entries.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="What's new"
        >
          <Sparkles className="h-5 w-5" />
          {hasUnseen && (
            <span
              className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary"
              aria-hidden
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-h-[70vh] overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">What's new</h3>
          </div>
          {entries.map((entry) => (
            <div
              key={entry.version}
              className="space-y-2 border-b pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-sm font-medium">{entry.title}</h4>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {entry.date}
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {entry.highlights.map((h, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span aria-hidden>•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
