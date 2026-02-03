/**
 * DRAMAC Studio Shortcuts Panel
 * 
 * Modal showing all available keyboard shortcuts organized by category.
 * 
 * @phase STUDIO-20
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/lib/studio/store";
import { SHORTCUT_DEFINITIONS } from "@/lib/studio/hooks/use-studio-shortcuts";
import { cn } from "@/lib/utils";

// =============================================================================
// COMPONENT
// =============================================================================

export function ShortcutsPanel() {
  const open = useUIStore((s) => s.shortcutsPanelOpen);
  const setOpen = useUIStore((s) => s.setShortcutsPanelOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>⌨️</span>
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to work faster in DRAMAC Studio
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {SHORTCUT_DEFINITIONS.map((group) => (
            <div key={group.category}>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                {group.category}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center">
                          <kbd
                            className={cn(
                              "inline-flex items-center justify-center",
                              "min-w-[24px] px-1.5 py-0.5",
                              "text-xs font-medium",
                              "bg-muted text-muted-foreground",
                              "border border-border rounded",
                              "shadow-sm"
                            )}
                          >
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="mx-0.5 text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          <p>
            Use{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">⌘/Ctrl</kbd> +{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">K</kbd> to open the
            command palette
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShortcutsPanel;
