"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RegenerateDialog } from "./regenerate-dialog";
import { toast } from "sonner";
import type {
  RegenerationMode,
  SectionContent,
} from "@/lib/ai/regeneration-types";

interface RegenerateButtonProps {
  sectionContent: SectionContent;
  siteId: string;
  onRegenerate: (newContent: SectionContent) => void;
  disabled?: boolean;
  className?: string;
}

const QUICK_MODES: { mode: RegenerationMode; label: string; icon: string }[] = [
  { mode: "improve", label: "Improve", icon: "✨" },
  { mode: "expand", label: "Expand", icon: "📝" },
  { mode: "simplify", label: "Simplify", icon: "📉" },
  { mode: "professional", label: "Professional", icon: "👔" },
  { mode: "casual", label: "Casual", icon: "💬" },
  { mode: "seo", label: "SEO Optimize", icon: "🔍" },
  { mode: "rewrite", label: "Rewrite", icon: "🔄" },
];

export function RegenerateButton({
  sectionContent,
  siteId,
  onRegenerate,
  disabled = false,
  className,
}: RegenerateButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quickLoading, setQuickLoading] = useState<RegenerationMode | null>(
    null
  );

  async function handleQuickRegenerate(mode: RegenerationMode) {
    if (disabled) return;

    setQuickLoading(mode);
    try {
      const { regenerateSectionAction } = await import(
        "@/lib/actions/ai/regenerate-section"
      );
      const result = await regenerateSectionAction(siteId, sectionContent, {
        mode,
        preserveStructure: true,
        preserveImages: true,
      });

      if (result.success && result.content) {
        onRegenerate(result.content);
        toast.success("Section regenerated", {
          description: `Applied "${mode}" transformation`,
        });
      } else {
        toast.error("Regeneration failed", {
          description: result.error || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Quick regeneration error:", error);
      toast.error("Regeneration failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setQuickLoading(null);
    }
  }

  const isLoading = quickLoading !== null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={className}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            AI
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {QUICK_MODES.map(({ mode, label, icon }) => (
            <DropdownMenuItem
              key={mode}
              onClick={() => handleQuickRegenerate(mode)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              {quickLoading === mode ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <span className="mr-2">{icon}</span>
              )}
              {label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDialogOpen(true)}
            disabled={isLoading}
            className="cursor-pointer"
          >
            <span className="mr-2">🎯</span>
            Custom Instructions...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RegenerateDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        sectionContent={sectionContent}
        siteId={siteId}
        onRegenerate={onRegenerate}
      />
    </>
  );
}
