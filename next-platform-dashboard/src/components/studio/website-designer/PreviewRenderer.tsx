/**
 * PHASE AWD-08: Preview & Iteration System
 * Preview Renderer Component
 *
 * Main preview component that displays generated websites
 * with device simulation, page navigation, and refinement tools.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Check,
  X,
  Undo,
  Redo,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DeviceFrame, DeviceSelector } from "./DeviceFrame";
import { IterationPanel } from "./IterationPanel";
import { VersionHistory } from "./VersionHistory";
import {
  usePreviewStore,
  usePreviewHistory,
  DEVICE_PRESETS,
} from "@/lib/ai/website-designer/preview";
import { IterationEngine } from "@/lib/ai/website-designer/preview/iteration-engine";
import type {
  PreviewState,
  DeviceType,
  PreviewComponent,
} from "@/lib/ai/website-designer/preview/types";

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface PreviewRendererProps {
  initialState: PreviewState;
  onApprove?: (state: PreviewState) => Promise<void>;
  onDiscard?: () => void;
  className?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PreviewRenderer({
  initialState,
  onApprove,
  onDiscard,
  className,
}: PreviewRendererProps) {
  // Store state
  const previewState = usePreviewStore((s) => s.previewState);
  const stateHistory = usePreviewStore((s) => s.stateHistory);
  const currentIndex = usePreviewStore((s) => s.currentIndex);
  const activeDevice = usePreviewStore((s) => s.activeDevice);
  const activePage = usePreviewStore((s) => s.activePage);
  const showRefinementPanel = usePreviewStore((s) => s.showRefinementPanel);
  const isRefining = usePreviewStore((s) => s.isRefining);

  // Store actions
  const setPreviewState = usePreviewStore((s) => s.setPreviewState);
  const setActiveDevice = usePreviewStore((s) => s.setActiveDevice);
  const setActivePage = usePreviewStore((s) => s.setActivePage);
  const setShowRefinementPanel = usePreviewStore((s) => s.setShowRefinementPanel);
  const pushState = usePreviewStore((s) => s.pushState);
  const setRefining = usePreviewStore((s) => s.setRefining);
  const approveStore = usePreviewStore((s) => s.approve);

  // History
  const { canUndo, canRedo, undo, redo } = usePreviewHistory();

  // Initialize state on mount
  useEffect(() => {
    if (!previewState && initialState) {
      setPreviewState(initialState);
    }
  }, [initialState, previewState, setPreviewState]);

  // Current state (use store or initial)
  const currentState = previewState ?? initialState;
  const currentPage = currentState?.pages[activePage];
  const device = DEVICE_PRESETS[activeDevice];

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleRefine = useCallback(
    async (request: string) => {
      if (!currentState) return;

      setRefining(true);

      try {
        const engine = new IterationEngine(currentState);
        const result = await engine.processRefinement({
          type: "general",
          request,
        });

        if (result.success) {
          const newState = engine.applyChanges(result.changes);
          pushState(newState);
          toast.success(result.explanation);
        } else {
          toast.error("Could not apply refinement");
        }
      } catch (error) {
        console.error("[PreviewRenderer] Error refining:", error);
        toast.error("Failed to apply refinement");
      } finally {
        setRefining(false);
      }
    },
    [currentState, pushState, setRefining]
  );

  const handleApprove = useCallback(async () => {
    const approvedState = approveStore();
    if (approvedState && onApprove) {
      try {
        await onApprove(approvedState);
        toast.success("Website approved and ready to publish!");
      } catch (error) {
        console.error("[PreviewRenderer] Error approving:", error);
        toast.error("Failed to save approved website");
      }
    }
  }, [approveStore, onApprove]);

  const handleDiscard = useCallback(() => {
    if (onDiscard) {
      onDiscard();
    }
    toast.info("Preview discarded");
  }, [onDiscard]);

  const handleRevert = useCallback(
    (index: number) => {
      const targetState = stateHistory[index];
      if (targetState) {
        pushState({
          ...targetState,
          version: currentState.version + 1,
          generatedAt: new Date(),
        });
        toast.success(`Reverted to version ${targetState.version}`);
      }
    },
    [stateHistory, currentState, pushState]
  );

  if (!currentState || !currentPage) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center text-gray-500">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col bg-gray-100 dark:bg-gray-900", className)}>
      {/* Top Bar */}
      <div className="h-14 border-b bg-white dark:bg-gray-800 flex items-center justify-between px-4 shrink-0">
        {/* Page Selector */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {currentState.pages.map((page, index) => (
            <Button
              key={page.id}
              variant={activePage === index ? "default" : "ghost"}
              size="sm"
              onClick={() => setActivePage(index)}
              className="whitespace-nowrap"
            >
              {page.name}
              {page.isHomepage && (
                <span className="ml-1 text-xs opacity-60">(Home)</span>
              )}
            </Button>
          ))}
        </div>

        {/* Device Selector */}
        <DeviceSelector
          currentDevice={activeDevice}
          onDeviceChange={setActiveDevice}
        />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>

          <VersionHistory
            stateHistory={stateHistory}
            currentIndex={currentIndex}
            onRevert={handleRevert}
          />

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRefinementPanel(!showRefinementPanel)}
            className={cn(showRefinementPanel && "bg-blue-50 border-blue-500")}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Refine
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDiscard}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-2" />
            Discard
          </Button>

          <Button
            size="sm"
            onClick={handleApprove}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Approve & Apply
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <DeviceFrame device={device}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {currentPage.components.map((component) => (
                  <PreviewComponentRenderer
                    key={component.id}
                    component={component}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </DeviceFrame>
        </div>

        {/* Iteration Panel */}
        <IterationPanel
          isOpen={showRefinementPanel}
          onClose={() => setShowRefinementPanel(false)}
          onRefine={handleRefine}
          isRefining={isRefining}
          iterations={currentState.iterations}
        />
      </div>

      {/* Status Bar */}
      <div className="h-8 border-t bg-white dark:bg-gray-800 flex items-center justify-between px-4 text-xs text-gray-500 shrink-0">
        <span>
          Version {currentState.version} • {currentState.pages.length} pages •{" "}
          {currentState.pages.reduce((acc, p) => acc + p.components.length, 0)}{" "}
          components
        </span>
        <span className="flex items-center gap-2">
          {currentState.status === "generating" && (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              Generating preview...
            </>
          )}
          {currentState.status === "preview" && (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Ready for review
            </>
          )}
          {currentState.status === "iterating" && (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              Applying changes...
            </>
          )}
          {currentState.status === "approved" && (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Approved
            </>
          )}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENT RENDERER
// =============================================================================

interface PreviewComponentRendererProps {
  component: PreviewComponent;
}

/**
 * Renders a single component in the preview
 * Uses a simple placeholder if the actual component isn't available
 */
function PreviewComponentRenderer({ component }: PreviewComponentRendererProps) {
  return (
    <div
      className={cn(
        "relative transition-all",
        component.highlighted && "ring-2 ring-blue-500 ring-offset-2",
        component.hasChanges && "ring-2 ring-green-500 ring-offset-2"
      )}
    >
      {/* Placeholder component rendering */}
      <ComponentPlaceholder type={component.type} props={component.props} />

      {/* Change indicator */}
      {component.hasChanges && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-10">
          Updated
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENT PLACEHOLDER
// =============================================================================

interface ComponentPlaceholderProps {
  type: string;
  props: Record<string, unknown>;
}

/**
 * Simple placeholder rendering for preview
 * In production, this would use the actual StudioRenderer
 */
function ComponentPlaceholder({ type, props }: ComponentPlaceholderProps) {
  // Extract common props
  const headline = props.headline as string | undefined;
  const title = props.title as string | undefined;
  const description = props.description as string | undefined;
  const subtitle = props.subtitle as string | undefined;
  const ctaText = props.ctaText as string | undefined;
  const buttonText = props.buttonText as string | undefined;
  const backgroundImage = props.backgroundImage as string | undefined;

  // Render based on component type
  switch (type) {
    case "Hero":
      return (
        <div
          className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-blue-600 to-purple-700 text-white"
          style={
            backgroundImage
              ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover" }
              : undefined
          }
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {headline || title || "Welcome"}
          </h1>
          {(subtitle || description) && (
            <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-2xl">
              {subtitle || description}
            </p>
          )}
          {(ctaText || buttonText) && (
            <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold">
              {ctaText || buttonText}
            </button>
          )}
        </div>
      );

    case "Navbar":
      return (
        <nav className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div className="font-bold text-xl">
            {(props.logo as string) || "Logo"}
          </div>
          <div className="flex gap-6">
            {((props.links as unknown[]) || []).slice(0, 4).map((_, i) => (
              <span key={i} className="text-gray-600">
                Link {i + 1}
              </span>
            ))}
          </div>
        </nav>
      );

    case "Footer":
      return (
        <footer className="bg-gray-900 text-white p-12">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Careers</li>
                <li>Press</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Products</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Demo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Blog</li>
                <li>Help</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Privacy</li>
                <li>Terms</li>
              </ul>
            </div>
          </div>
          <div className="text-center text-gray-500 text-sm border-t border-gray-800 pt-8">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </footer>
      );

    case "Features":
    case "FeatureGrid":
      return (
        <section className="py-20 px-8 bg-gray-50">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {headline || title || "Features"}
            </h2>
            {description && (
              <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Feature {i}</h3>
                <p className="text-gray-600 text-sm">
                  Description of this amazing feature
                </p>
              </div>
            ))}
          </div>
        </section>
      );

    case "CTA":
    case "CallToAction":
      return (
        <section className="py-20 px-8 bg-blue-600 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            {headline || title || "Ready to get started?"}
          </h2>
          {description && (
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              {description}
            </p>
          )}
          <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold">
            {ctaText || buttonText || "Get Started"}
          </button>
        </section>
      );

    case "Testimonials":
      return (
        <section className="py-20 px-8 bg-white">
          <h2 className="text-3xl font-bold text-center mb-12">
            {headline || title || "What Our Customers Say"}
          </h2>
          <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 border rounded-lg">
                <p className="text-gray-600 mb-4 italic">
                  "This is an amazing testimonial from a happy customer."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div>
                    <div className="font-medium">Customer {i}</div>
                    <div className="text-sm text-gray-500">Company</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "Pricing":
      return (
        <section className="py-20 px-8 bg-gray-50">
          <h2 className="text-3xl font-bold text-center mb-12">
            {headline || title || "Pricing Plans"}
          </h2>
          <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto">
            {["Basic", "Pro", "Enterprise"].map((plan) => (
              <div
                key={plan}
                className={cn(
                  "p-8 rounded-lg",
                  plan === "Pro"
                    ? "bg-blue-600 text-white"
                    : "bg-white border"
                )}
              >
                <h3 className="text-xl font-bold mb-2">{plan}</h3>
                <div className="text-3xl font-bold mb-6">
                  K{plan === "Basic" ? 99 : plan === "Pro" ? 299 : 999}
                  <span className="text-sm font-normal">/mo</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li>Feature 1</li>
                  <li>Feature 2</li>
                  <li>Feature 3</li>
                </ul>
                <button
                  className={cn(
                    "w-full py-2 rounded font-medium",
                    plan === "Pro"
                      ? "bg-white text-blue-600"
                      : "bg-blue-600 text-white"
                  )}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </section>
      );

    case "Contact":
    case "ContactForm":
      return (
        <section className="py-20 px-8 bg-white">
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">
              {headline || title || "Contact Us"}
            </h2>
            <div className="space-y-4">
              <input
                placeholder="Name"
                className="w-full p-3 border rounded-lg"
              />
              <input
                placeholder="Email"
                className="w-full p-3 border rounded-lg"
              />
              <textarea
                placeholder="Message"
                rows={4}
                className="w-full p-3 border rounded-lg"
              />
              <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium">
                Send Message
              </button>
            </div>
          </div>
        </section>
      );

    default:
      // Generic section placeholder
      return (
        <section className="py-16 px-8 bg-gray-100 border-y border-dashed border-gray-300">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">{type}</div>
            {(headline || title) && (
              <h2 className="text-2xl font-bold">{headline || title}</h2>
            )}
            {description && (
              <p className="text-gray-600 mt-2">{description}</p>
            )}
          </div>
        </section>
      );
  }
}
