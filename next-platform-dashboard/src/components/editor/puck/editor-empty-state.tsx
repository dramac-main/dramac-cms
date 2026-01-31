/**
 * Editor Empty State
 * 
 * Helpful guidance shown when the editor canvas is empty.
 * Provides quick actions to get users started.
 */

"use client";

import { motion } from "framer-motion";
import {
  MousePointer2,
  Wand2,
  LayoutTemplate,
  Plus,
  Lightbulb,
  ArrowRight,
  Sparkles,
  BookOpen,
  Grid3X3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorEmptyStateProps {
  onAddComponent?: () => void;
  onShowTemplates?: () => void;
  onGenerateWithAI?: () => void;
  className?: string;
}

/**
 * Quick action card component
 */
function QuickActionCard({
  icon,
  title,
  description,
  onClick,
  color,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  color: "primary" | "violet" | "emerald" | "blue";
  delay?: number;
}) {
  const colors = {
    primary: {
      bg: "bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/15",
      icon: "text-primary",
      border: "border-primary/20",
    },
    violet: {
      bg: "bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/30",
      icon: "text-violet-600 dark:text-violet-400",
      border: "border-violet-200 dark:border-violet-800",
    },
    emerald: {
      bg: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30",
      icon: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
    },
    blue: {
      bg: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30",
      icon: "text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
    },
  };

  const c = colors[color];

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      className={cn(
        "group flex flex-col items-start gap-3 p-5 rounded-xl border transition-all text-left w-full",
        c.bg,
        c.border
      )}
    >
      <div className={cn("p-2.5 rounded-lg bg-background shadow-sm", c.icon)}>
        {icon}
      </div>
      <div>
        <h3 className="font-semibold flex items-center gap-2">
          {title}
          <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </motion.button>
  );
}

/**
 * Tip item component
 */
function TipItem({
  icon,
  text,
  delay = 0,
}: {
  icon: React.ReactNode;
  text: string;
  delay?: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-start gap-2 text-sm text-muted-foreground"
    >
      <span className="text-primary mt-0.5">{icon}</span>
      <span>{text}</span>
    </motion.li>
  );
}

/**
 * Main Editor Empty State Component
 */
export function EditorEmptyState({
  onAddComponent,
  onShowTemplates,
  onGenerateWithAI,
  className,
}: EditorEmptyStateProps) {
  return (
    <div className={cn(
      "flex-1 flex items-center justify-center p-8",
      className
    )}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-4">
            <MousePointer2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Start Building</h2>
          <p className="text-muted-foreground">
            Your canvas is empty. Choose one of the options below to get started.
          </p>
        </motion.div>

        {/* Quick actions grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <QuickActionCard
            icon={<Plus className="w-5 h-5" />}
            title="Add Components"
            description="Drag components from the left panel to start building"
            onClick={onAddComponent}
            color="primary"
            delay={0.1}
          />
          <QuickActionCard
            icon={<LayoutTemplate className="w-5 h-5" />}
            title="Use a Template"
            description="Start with a pre-designed template and customize it"
            onClick={onShowTemplates}
            color="blue"
            delay={0.2}
          />
          <QuickActionCard
            icon={<Wand2 className="w-5 h-5" />}
            title="Generate with AI"
            description="Describe your page and let AI create it for you"
            onClick={onGenerateWithAI}
            color="violet"
            delay={0.3}
          />
        </div>

        {/* Tips section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-muted/30 rounded-xl p-6"
        >
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Quick Tips
          </h3>
          <ul className="space-y-3">
            <TipItem
              icon={<Grid3X3 className="w-3.5 h-3.5" />}
              text="Drag components from the left sidebar onto the canvas to add them"
              delay={0.5}
            />
            <TipItem
              icon={<MousePointer2 className="w-3.5 h-3.5" />}
              text="Click any component to select it and edit its properties in the right panel"
              delay={0.55}
            />
            <TipItem
              icon={<Sparkles className="w-3.5 h-3.5" />}
              text="Use AI tools in the toolbar to generate content, optimize SEO, and more"
              delay={0.6}
            />
            <TipItem
              icon={<BookOpen className="w-3.5 h-3.5" />}
              text="Press ? anytime to see all keyboard shortcuts"
              delay={0.65}
            />
          </ul>
        </motion.div>

        {/* Component categories hint */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Over <span className="font-semibold text-foreground">110+ components</span> available including 
            layouts, content, forms, e-commerce, 3D elements, and more
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Compact empty state for smaller containers
 */
export function EditorEmptyStateCompact({
  onAddComponent,
  onShowTemplates,
  className,
}: {
  onAddComponent?: () => void;
  onShowTemplates?: () => void;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-6 text-center",
      className
    )}>
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
        <MousePointer2 className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium mb-1">Empty Canvas</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Drag components here or choose an option below
      </p>
      <div className="flex items-center gap-2">
        {onAddComponent && (
          <button
            onClick={onAddComponent}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4 inline-block mr-1" />
            Add Component
          </button>
        )}
        {onShowTemplates && (
          <button
            onClick={onShowTemplates}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
          >
            <LayoutTemplate className="w-4 h-4 inline-block mr-1" />
            Templates
          </button>
        )}
      </div>
    </div>
  );
}

export default EditorEmptyState;
