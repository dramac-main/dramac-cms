/**
 * LP Migration Preview Dialog — Side-by-Side Comparison
 *
 * Phase LPB-11: Shows converted Studio tree, warnings, and a "Migrate" action.
 */
"use client";

import { useState, useEffect, useTransition } from "react";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { previewBlockMigration } from "../../actions/lp-migration";

interface LPMigrationPreviewDialogProps {
  lpId: string;
  open: boolean;
  onClose: () => void;
  onMigrate: () => void;
}

export function LPMigrationPreviewDialog({
  lpId,
  open,
  onClose,
  onMigrate,
}: LPMigrationPreviewDialogProps) {
  const [preview, setPreview] = useState<{
    originalBlocks: unknown[];
    convertedTree: unknown;
    warnings: string[];
  } | null>(null);
  const [isLoading, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !lpId) return;
    setPreview(null);
    startTransition(async () => {
      const result = await previewBlockMigration(lpId);
      setPreview(result);
    });
  }, [open, lpId]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Migration Preview</DialogTitle>
        </DialogHeader>

        {isLoading || !preview ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Side by side view */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-2 text-sm font-medium">
                  Original Blocks (
                  {(preview.originalBlocks as unknown[]).length})
                </h4>
                <ScrollArea className="h-[300px] rounded border p-3">
                  <pre className="text-xs">
                    {JSON.stringify(preview.originalBlocks, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">
                  Studio Components{" "}
                  {preview.convertedTree != null ? (
                    <Badge variant="secondary" className="ml-1">
                      {String(
                        Object.keys(
                          (preview.convertedTree as Record<string, unknown>)
                            .components || {},
                        ).length,
                      )}{" "}
                      components
                    </Badge>
                  ) : null}
                </h4>
                <ScrollArea className="h-[300px] rounded border p-3">
                  <pre className="text-xs">
                    {JSON.stringify(preview.convertedTree, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <h4 className="mb-2 flex items-center gap-1 text-sm font-medium text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings ({preview.warnings.length})
                </h4>
                <ul className="space-y-1 text-xs text-amber-700">
                  {preview.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {preview.warnings.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                No warnings — clean migration.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onMigrate}
            disabled={isLoading || !preview || !preview.convertedTree}
          >
            Looks Good — Migrate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
