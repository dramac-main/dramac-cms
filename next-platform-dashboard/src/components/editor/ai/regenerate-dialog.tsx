"use client";

import { useState, useCallback } from "react";
import { Loader2, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type {
  SectionContent,
  RegenerationOptions,
} from "@/lib/ai/regeneration-types";

interface RegenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionContent: SectionContent;
  siteId: string;
  onRegenerate: (newContent: SectionContent) => void;
}

export function RegenerateDialog({
  open,
  onOpenChange,
  sectionContent,
  siteId,
  onRegenerate,
}: RegenerateDialogProps) {
  const [instructions, setInstructions] = useState("");
  const [preserveStructure, setPreserveStructure] = useState(true);
  const [preserveImages, setPreserveImages] = useState(true);
  const [targetLength, setTargetLength] = useState<"shorter" | "same" | "longer">(
    "same"
  );
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<SectionContent | null>(null);

  const resetState = useCallback(() => {
    setPreview(null);
    setInstructions("");
    setPreserveStructure(true);
    setPreserveImages(true);
    setTargetLength("same");
    setKeywords("");
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        resetState();
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, resetState]
  );

  async function handleGenerate() {
    if (!instructions.trim()) {
      toast.error("Please provide instructions");
      return;
    }

    setLoading(true);
    try {
      const { regenerateSectionAction } = await import(
        "@/lib/actions/ai/regenerate-section"
      );

      const keywordList = keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const options: RegenerationOptions = {
        mode: "custom",
        customInstructions: instructions,
        preserveStructure,
        preserveImages,
        targetLength,
        keywords: keywordList.length > 0 ? keywordList : undefined,
      };

      const result = await regenerateSectionAction(
        siteId,
        sectionContent,
        options
      );

      if (result.success && result.content) {
        setPreview(result.content);
        toast.success("Preview generated", {
          description: "Review the changes before applying",
        });
      } else {
        toast.error("Generation failed", {
          description: result.error || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Generation failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (preview) {
      onRegenerate(preview);
      handleOpenChange(false);
      toast.success("Changes applied", {
        description: "Section content updated",
      });
    }
  }

  function handleResetPreview() {
    setPreview(null);
  }

  // Format preview content for display
  function formatPreviewContent(content: SectionContent): string {
    return JSON.stringify(content, null, 2);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom AI Regeneration</DialogTitle>
          <DialogDescription>
            Provide custom instructions to regenerate this section. You can
            preview the changes before applying them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Make it more compelling, add a call to action, focus on benefits, highlight key features..."
              rows={4}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Describe how you want the content to change
            </p>
          </div>

          {/* Options Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Preserve Structure */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
              <div>
                <Label htmlFor="preserve-structure" className="cursor-pointer">
                  Preserve Structure
                </Label>
                <p className="text-xs text-muted-foreground">
                  Keep same headings & layout
                </p>
              </div>
              <Switch
                id="preserve-structure"
                checked={preserveStructure}
                onCheckedChange={setPreserveStructure}
                disabled={loading}
              />
            </div>

            {/* Preserve Images */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
              <div>
                <Label htmlFor="preserve-images" className="cursor-pointer">
                  Preserve Images
                </Label>
                <p className="text-xs text-muted-foreground">
                  Keep image references
                </p>
              </div>
              <Switch
                id="preserve-images"
                checked={preserveImages}
                onCheckedChange={setPreserveImages}
                disabled={loading}
              />
            </div>
          </div>

          {/* Target Length */}
          <div className="space-y-2">
            <Label>Target Length</Label>
            <Select
              value={targetLength}
              onValueChange={(v) =>
                setTargetLength(v as "shorter" | "same" | "longer")
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shorter">Shorter (~30% less)</SelectItem>
                <SelectItem value="same">About the same</SelectItem>
                <SelectItem value="longer">Longer (~50% more)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords (optional)</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., innovation, quality, customer satisfaction"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated keywords to include naturally
            </p>
          </div>

          {/* Current Content Preview */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Current Content</Label>
            <div className="p-3 rounded-lg border bg-muted/30 max-h-32 overflow-auto">
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {formatPreviewContent(sectionContent)}
              </pre>
            </div>
          </div>

          {/* AI Generated Preview */}
          {preview && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-green-600 dark:text-green-400">
                  <Eye className="inline h-4 w-4 mr-1" />
                  Preview (Generated)
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetPreview}
                  className="h-6 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
              <div className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30 max-h-48 overflow-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {formatPreviewContent(preview)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          {preview ? (
            <>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={loading || !instructions.trim()}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Regenerate
              </Button>
              <Button onClick={handleApply}>Apply Changes</Button>
            </>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={loading || !instructions.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Preview
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
