"use client";

import { useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRegenerateSection } from "@/hooks/use-regenerate-section";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function AIRegenerate() {
  const { id, props, name } = useNode((node) => ({
    props: node.data.props,
    name: node.data.displayName || node.data.type,
  }));
  
  const { actions } = useEditor();
  const { regenerate, isRegenerating } = useRegenerateSection();
  
  const [instruction, setInstruction] = useState("");
  const [open, setOpen] = useState(false);

  const handleRegenerate = async () => {
    if (!instruction.trim()) {
      toast.error("Please provide an instruction");
      return;
    }

    try {
      const newProps = await regenerate({
        sectionType: name as string,
        currentContent: props as Record<string, unknown>,
        instruction,
      });

      // Update the node with new props
      actions.setProp(id, (nodeProps) => {
        Object.assign(nodeProps, newProps);
      });

      toast.success("Section regenerated!");
      setInstruction("");
      setOpen(false);
    } catch (err) {
      toast.error("Failed to regenerate section");
    }
  };

  // Quick regeneration presets
  const presets = [
    { label: "Make it shorter", value: "Make the text more concise" },
    { label: "Make it longer", value: "Expand the content with more details" },
    { label: "More professional", value: "Use more professional, formal language" },
    { label: "More casual", value: "Use friendlier, casual language" },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          AI Edit
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Regenerate with AI</h4>
            <p className="text-xs text-muted-foreground">
              Describe how you want to change this section
            </p>
          </div>

          <Input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., Make the title more engaging"
            disabled={isRegenerating}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRegenerate();
            }}
          />

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setInstruction(preset.value)}
                className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80"
                disabled={isRegenerating}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating || !instruction.trim()}
            className="w-full"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Section
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
