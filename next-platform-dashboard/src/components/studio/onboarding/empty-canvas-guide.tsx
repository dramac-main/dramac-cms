/**
 * DRAMAC Studio Empty Canvas Guide
 * 
 * Shows guidance when the canvas is empty.
 * Animated to draw attention and help users get started.
 * 
 * @phase STUDIO-26
 */

"use client";

import { MousePointer, LayoutTemplate, Sparkles, ArrowDown, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface EmptyCanvasGuideProps {
  /** Called when user clicks to open templates */
  onOpenTemplates: () => void;
  /** Called when user clicks to open AI generator */
  onOpenAIGenerator: () => void;
}

export function EmptyCanvasGuide({
  onOpenTemplates,
  onOpenAIGenerator,
}: EmptyCanvasGuideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-col items-center justify-center h-full text-center p-8"
    >
      {/* Icon */}
      <div className="relative mb-6">
        <motion.div
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center"
        >
          <MousePointer className="w-10 h-10 text-primary" />
        </motion.div>

        {/* Arrow pointing down */}
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2"
        >
          <ArrowDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </div>

      {/* Text */}
      <h2 className="text-2xl font-bold mb-2">Start Building Your Page</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Drag components from the left panel, or use one of these quick options to
        get started faster.
      </p>

      {/* Quick action buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button size="lg" onClick={onOpenTemplates} className="gap-2">
          <LayoutTemplate className="w-5 h-5" />
          Choose a Template
        </Button>

        <Button size="lg" variant="outline" onClick={onOpenAIGenerator} className="gap-2">
          <Sparkles className="w-5 h-5" />
          Generate with AI
        </Button>
      </div>

      {/* Tips */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
        <TipCard
          icon={<GripVertical className="w-5 h-5 text-primary" />}
          title="Drag & Drop"
          description="Drag any component from the left panel onto this canvas"
        />
        <TipCard
          icon={<LayoutTemplate className="w-5 h-5 text-primary" />}
          title="Templates"
          description="Pre-designed sections help you build faster"
        />
        <TipCard
          icon={<Sparkles className="w-5 h-5 text-primary" />}
          title="AI Magic"
          description="Describe what you want and AI will create it"
        />
      </div>

      {/* Keyboard hint */}
      <p className="mt-8 text-xs text-muted-foreground">
        Press{" "}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+K</kbd>{" "}
        to search components
      </p>
    </motion.div>
  );
}

// =============================================================================
// TIP CARD
// =============================================================================

interface TipCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function TipCard({ icon, title, description }: TipCardProps) {
  return (
    <div className="text-left p-4 rounded-lg bg-muted/50 border border-border/50">
      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center mb-3 shadow-sm">
        {icon}
      </div>
      <h4 className="font-medium text-sm mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export default EmptyCanvasGuide;
