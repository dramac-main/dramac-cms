/**
 * AI Assistant Panel
 * 
 * Floating AI assistant panel for the Puck editor.
 * Provides AI-powered content editing and generation features.
 * Part of PHASE-ED-05A: AI Editor - Puck AI Plugin Integration
 */

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Loader2,
  Wand2,
  FileText,
  Maximize2,
  Minimize2,
  Languages,
  RefreshCw,
  Briefcase,
  Smile,
  Type,
  MousePointerClick,
  AlignLeft,
  MessageSquare,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePuckAI } from "./use-puck-ai";
import {
  AI_ACTIONS,
  AIActionType,
  QUICK_ACTIONS,
  SUPPORTED_LANGUAGES,
} from "./puck-ai-config";

// ============================================
// Types
// ============================================

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText?: string;
  componentContext?: {
    type: string;
    props: Record<string, unknown>;
  };
  onApplyResult?: (result: string) => void;
  className?: string;
}

// ============================================
// Icon Map
// ============================================

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  FileText,
  Maximize2,
  Minimize2,
  Languages,
  RefreshCw,
  Briefcase,
  Smile,
  Check,
  Type,
  MousePointerClick,
  AlignLeft,
};

// ============================================
// Component
// ============================================

export function AIAssistantPanel({
  isOpen,
  onClose,
  selectedText = "",
  componentContext,
  onApplyResult,
  className,
}: AIAssistantPanelProps) {
  // State
  const [inputText, setInputText] = useState(selectedText);
  const [translationLanguage, setTranslationLanguage] = useState("es");
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"actions" | "generate" | "custom">("actions");

  // AI Hook
  const {
    isLoading,
    lastResult,
    executeAction,
    clearResult,
  } = usePuckAI({
    showToasts: true,
    onSuccess: (result) => {
      if (result.result && onApplyResult) {
        // Auto-apply for single results
        if (!result.alternatives || result.alternatives.length <= 1) {
          onApplyResult(result.result);
        }
      }
    },
  });

  // Update input when selected text changes
  useState(() => {
    if (selectedText) {
      setInputText(selectedText);
    }
  });

  // Handle action execution
  const handleAction = useCallback(
    async (action: AIActionType) => {
      if (!inputText.trim() && !["generate_headline", "generate_cta", "generate_description"].includes(action)) {
        return;
      }

      const context = componentContext
        ? `Component: ${componentContext.type}`
        : undefined;

      if (action === "translate") {
        const language = SUPPORTED_LANGUAGES.find(
          (l) => l.code === translationLanguage
        );
        await executeAction(action, inputText, context, {
          language: language?.name || translationLanguage,
        });
      } else if (["generate_headline", "generate_cta", "generate_description"].includes(action)) {
        await executeAction(action, "", inputText || context || "");
      } else {
        await executeAction(action, inputText, context);
      }
    },
    [inputText, componentContext, translationLanguage, executeAction]
  );

  // Handle copy
  const handleCopy = useCallback(async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  // Handle apply
  const handleApply = useCallback(
    (text: string) => {
      onApplyResult?.(text);
      clearResult();
    },
    [onApplyResult, clearResult]
  );

  // Render action button
  const renderActionButton = (actionType: AIActionType) => {
    const action = AI_ACTIONS[actionType];
    const Icon = iconMap[action.icon] || Sparkles;

    return (
      <TooltipProvider key={actionType}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction(actionType)}
              disabled={isLoading}
              className="h-9 px-3"
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {action.label}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{action.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed bottom-4 right-4 z-50 w-[420px]",
          isMinimized && "w-auto",
          className
        )}
      >
        <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-lg">
          {/* Header */}
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">AI Assistant</CardTitle>
                {!isMinimized && (
                  <CardDescription className="text-xs">
                    Enhance your content with AI
                  </CardDescription>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 w-7 p-0"
              >
                {isMinimized ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="pt-0">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="w-full mb-3">
                  <TabsTrigger value="actions" className="flex-1">
                    <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </TabsTrigger>
                  <TabsTrigger value="generate" className="flex-1">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Generate
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="flex-1">
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Custom
                  </TabsTrigger>
                </TabsList>

                {/* Edit Actions Tab */}
                <TabsContent value="actions" className="space-y-3 mt-0">
                  {/* Input */}
                  <div>
                    <Textarea
                      placeholder="Enter or select text to transform..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="min-h-[80px] resize-none text-sm"
                    />
                    {componentContext && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {componentContext.type}
                      </Badge>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ACTIONS.map((actionType) =>
                      renderActionButton(actionType)
                    )}
                  </div>

                  {/* More Actions */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">More actions</p>
                    <div className="flex flex-wrap gap-2">
                      {renderActionButton("rephrase")}
                      {renderActionButton("make_professional")}
                      {renderActionButton("make_friendly")}
                    </div>
                  </div>

                  {/* Translation */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Translate</p>
                    <div className="flex gap-2">
                      <Select
                        value={translationLanguage}
                        onValueChange={setTranslationLanguage}
                      >
                        <SelectTrigger className="h-9 flex-1">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_LANGUAGES.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction("translate")}
                        disabled={isLoading || !inputText.trim()}
                        className="h-9"
                      >
                        <Languages className="h-4 w-4 mr-1.5" />
                        Translate
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Generate Tab */}
                <TabsContent value="generate" className="space-y-3 mt-0">
                  <div>
                    <Textarea
                      placeholder="Describe what you need or provide context..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="min-h-[80px] resize-none text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {renderActionButton("generate_headline")}
                    {renderActionButton("generate_cta")}
                    {renderActionButton("generate_description")}
                  </div>
                </TabsContent>

                {/* Custom Tab */}
                <TabsContent value="custom" className="space-y-3 mt-0">
                  <div className="text-sm text-muted-foreground">
                    <p>Custom AI prompts coming soon...</p>
                    <p className="mt-2 text-xs">
                      You'll be able to create and save your own AI prompts for
                      specific use cases.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              )}

              {/* Results */}
              {lastResult && lastResult.success && !isLoading && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Results</p>
                  <ScrollArea className="max-h-[200px]">
                    {lastResult.alternatives && lastResult.alternatives.length > 1 ? (
                      <div className="space-y-2">
                        {lastResult.alternatives.map((alt, index) => (
                          <div
                            key={index}
                            className="group relative p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <p className="text-sm pr-16">{alt}</p>
                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(alt, index)}
                                className="h-6 w-6 p-0"
                              >
                                {copiedIndex === index ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApply(alt)}
                                className="h-6 px-2 text-xs"
                              >
                                Apply
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="group relative p-3 rounded-lg bg-muted/50">
                        <p className="text-sm">{lastResult.result}</p>
                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(lastResult.result || "", 0)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedIndex === 0 ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleApply(lastResult.result || "")}
                            className="h-6 px-2 text-xs"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    )}
                  </ScrollArea>

                  {/* Clear Results */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearResult}
                    className="mt-2 w-full text-xs"
                  >
                    Clear results
                  </Button>
                </div>
              )}

              {/* Error State */}
              {lastResult && !lastResult.success && !isLoading && (
                <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{lastResult.error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearResult}
                    className="mt-2 text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// AI Button for Toolbar
// ============================================

interface AIToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}

export function AIToolbarButton({
  onClick,
  isActive,
  className,
}: AIToolbarButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={onClick}
            className={cn(
              "h-8 px-3 gap-1.5",
              isActive && "bg-gradient-to-r from-violet-500 to-purple-600 border-0",
              className
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>AI Assistant</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
