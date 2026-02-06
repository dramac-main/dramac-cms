/**
 * PHASE AWD-08: Preview & Iteration System
 * Iteration Panel Component
 *
 * Slide-out panel for refinement requests,
 * quick actions, and iteration history.
 */

"use client";

import { useState, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X, Sparkles, History, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QUICK_REFINEMENTS } from "@/lib/ai/website-designer/preview/iteration-engine";
import type { Iteration } from "@/lib/ai/website-designer/preview/types";

interface IterationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRefine: (request: string) => Promise<void>;
  isRefining: boolean;
  iterations: Iteration[];
}

export function IterationPanel({
  isOpen,
  onClose,
  onRefine,
  isRefining,
  iterations,
}: IterationPanelProps) {
  const [refinementInput, setRefinementInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const handleRefine = async () => {
    if (!refinementInput.trim() || isRefining) return;
    await onRefine(refinementInput);
    setRefinementInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleRefine();
    }
  };

  const handleQuickAction = (suggestion: string) => {
    setRefinementInput(suggestion);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 400, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-l bg-white dark:bg-gray-800 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="h-14 border-b flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Refine Website</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className={cn(showHistory && "bg-gray-100 dark:bg-gray-700")}
              >
                <History className="h-4 w-4 mr-1" />
                History ({iterations.length})
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {showHistory ? (
              <IterationHistory iterations={iterations} />
            ) : (
              <>
                {/* Quick Actions */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2 font-medium">
                    Quick refinements:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_REFINEMENTS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleQuickAction(suggestion)}
                        className={cn(
                          "px-3 py-1.5 text-xs rounded-full border transition-colors",
                          refinementInput === suggestion
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Request */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2 font-medium">
                    Or describe what you want to change:
                  </p>
                  <div className="relative">
                    <textarea
                      value={refinementInput}
                      onChange={(e) => setRefinementInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g., Make the hero section taller and add a video background..."
                      className="w-full h-32 p-3 border rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      Press Enter to refine
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                    💡 Tips for better results:
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• Be specific about which section to change</li>
                    <li>• Mention colors, sizes, or fonts if needed</li>
                    <li>• Describe the feeling you want (professional, playful, etc.)</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!showHistory && (
            <div className="border-t p-4">
              <Button
                onClick={handleRefine}
                disabled={!refinementInput.trim() || isRefining}
                className="w-full"
              >
                {isRefining ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Refining...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Apply Refinement
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Iteration History List
 */
interface IterationHistoryProps {
  iterations: Iteration[];
}

function IterationHistory({ iterations }: IterationHistoryProps) {
  if (iterations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-400">
        <History className="h-8 w-8 mb-2" />
        <p className="text-sm">No refinements yet</p>
        <p className="text-xs">Your changes will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {iterations
        .slice()
        .reverse()
        .map((iteration, index) => (
          <div
            key={iteration.id}
            className="p-3 border rounded-lg dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Version {iteration.version}
              </span>
              <span className="text-xs text-gray-400">
                {formatTimestamp(iteration.timestamp)}
              </span>
            </div>
            <p className="text-sm mb-2">{iteration.request}</p>
            <div className="text-xs text-gray-500">
              {iteration.changes.length} change(s)
            </div>
            {iteration.changes.length > 0 && (
              <ul className="mt-2 text-xs text-gray-500 space-y-1">
                {iteration.changes.slice(0, 3).map((change, i) => (
                  <li key={i} className="truncate">
                    • {change.description}
                  </li>
                ))}
                {iteration.changes.length > 3 && (
                  <li className="text-gray-400">
                    ...and {iteration.changes.length - 3} more
                  </li>
                )}
              </ul>
            )}
          </div>
        ))}
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return d.toLocaleDateString();
}
