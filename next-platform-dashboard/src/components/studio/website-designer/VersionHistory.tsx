/**
 * PHASE AWD-08: Preview & Iteration System
 * Version History Component
 *
 * Displays version history with comparison capabilities
 * and allows reverting to previous versions.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronRight, Check, RotateCcw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PreviewState, Change } from "@/lib/ai/website-designer/preview/types";

interface VersionHistoryProps {
  stateHistory: PreviewState[];
  currentIndex: number;
  onRevert: (index: number) => void;
}

export function VersionHistory({
  stateHistory,
  currentIndex,
  onRevert,
}: VersionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [showChanges, setShowChanges] = useState(false);

  const handleRevert = (index: number) => {
    onRevert(index);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <History className="h-4 w-4" />
        v{stateHistory[currentIndex]?.version || 1}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </DialogTitle>
            <DialogDescription>
              View and restore previous versions of your website
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-auto">
            {stateHistory
              .slice()
              .reverse()
              .map((state, reversedIndex) => {
                const actualIndex = stateHistory.length - 1 - reversedIndex;
                const isCurrent = actualIndex === currentIndex;
                const isSelected = selectedVersion === actualIndex;
                const iteration = state.iterations[state.currentIteration];

                return (
                  <div
                    key={state.id}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all",
                      isCurrent && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                      isSelected && !isCurrent && "border-gray-400",
                      !isCurrent && !isSelected && "hover:border-gray-300"
                    )}
                    onClick={() =>
                      setSelectedVersion(isSelected ? null : actualIndex)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                            isCurrent
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 dark:bg-gray-700"
                          )}
                        >
                          {state.version}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Version {state.version}
                            </span>
                            {isCurrent && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                            {state.status === "approved" && (
                              <span className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Approved
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {iteration?.request || "Initial generation"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {formatDate(state.generatedAt)}
                        </span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isSelected && "rotate-90"
                          )}
                        />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t">
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold">
                                  {state.pages.length}
                                </div>
                                <div className="text-xs text-gray-500">Pages</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold">
                                  {state.pages.reduce(
                                    (acc, p) => acc + p.components.length,
                                    0
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Components
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold">
                                  {state.iterations.length}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Iterations
                                </div>
                              </div>
                            </div>

                            {/* Changes */}
                            {iteration?.changes && iteration.changes.length > 0 && (
                              <div className="mb-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowChanges(!showChanges);
                                  }}
                                  className="text-sm text-blue-600 hover:underline mb-2"
                                >
                                  {showChanges
                                    ? "Hide changes"
                                    : `View ${iteration.changes.length} changes`}
                                </button>
                                {showChanges && (
                                  <ChangeList changes={iteration.changes} />
                                )}
                              </div>
                            )}

                            {/* Actions */}
                            {!isCurrent && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRevert(actualIndex);
                                  }}
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Restore this version
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Compare
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Change List Component
 */
interface ChangeListProps {
  changes: Change[];
}

function ChangeList({ changes }: ChangeListProps) {
  return (
    <ul className="text-sm space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
      {changes.map((change, index) => (
        <li key={index} className="flex items-start gap-2">
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              change.type === "component" && "bg-blue-100 text-blue-700",
              change.type === "style" && "bg-purple-100 text-purple-700",
              change.type === "content" && "bg-green-100 text-green-700",
              change.type === "page" && "bg-orange-100 text-orange-700"
            )}
          >
            {change.type}
          </span>
          <span className="text-gray-600 dark:text-gray-300">
            {change.description}
          </span>
        </li>
      ))}
    </ul>
  );
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
