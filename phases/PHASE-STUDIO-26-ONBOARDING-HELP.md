# PHASE-STUDIO-26: Onboarding & Help

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-26 |
| Title | Onboarding & Help |
| Priority | Medium |
| Estimated Time | 10-14 hours |
| Dependencies | STUDIO-01 through STUDIO-25 (Waves 1-8) |
| Risk Level | Low |

## Problem Statement

New users opening DRAMAC Studio for the first time face several challenges:
1. **Unfamiliar interface**: Multiple panels, tools, and concepts to learn
2. **No guidance**: Users don't know where to start or how features work
3. **Feature discovery**: Power features like AI, Symbols, and Templates go unused
4. **Help access**: No easy way to get help or documentation

A comprehensive onboarding system solves these problems by:
- Walking new users through a guided tutorial
- Providing contextual tooltips on hover
- Offering a help panel with documentation links
- Showing "What's New" updates for returning users
- Guiding users when the canvas is empty

## Goals

- [ ] Create first-time user tutorial with step-by-step walkthrough
- [ ] Implement contextual tooltips on key UI elements
- [ ] Build help panel with documentation links and video tutorials
- [ ] Add "What's New" panel for changelog/updates
- [ ] Show empty canvas guidance for new pages
- [ ] Store tutorial completion status per user
- [ ] Allow users to restart the tutorial

## Technical Approach

### Onboarding System Architecture

```
Onboarding System
├── Tutorial
│   ├── TutorialProvider (context)
│   ├── TutorialOverlay (modal backdrop)
│   ├── TutorialHighlight (element spotlight)
│   ├── TutorialTooltip (step content)
│   └── TutorialProgress (step indicator)
├── Contextual Help
│   ├── TooltipProvider (wraps app)
│   ├── HelpTooltip (individual tooltips)
│   └── TooltipContent (tooltip data)
├── Help Panel
│   ├── HelpSheet (slide-out panel)
│   ├── HelpSection (grouped items)
│   └── HelpItem (individual links)
├── What's New
│   ├── WhatsNewPopover
│   ├── ChangelogItem
│   └── UnreadIndicator
└── Empty State
    └── EmptyCanvasGuide
```

### Tutorial Flow

1. User opens Studio for the first time
2. Check localStorage for `studio-tutorial-completed`
3. If not completed, show tutorial overlay
4. Guide through 9 steps highlighting key UI areas
5. User can skip or complete tutorial
6. Store completion status

## Implementation Tasks

### Task 1: Tutorial Types and Data

**Description:** Define tutorial step structure and content.

**Files:**
- CREATE: `src/lib/studio/onboarding/tutorial-steps.ts`

**Code:**

```typescript
// src/lib/studio/onboarding/tutorial-steps.ts

/**
 * Tutorial step position relative to target element
 */
export type TutorialPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

/**
 * Action the user should take (optional - for interactive tutorials)
 */
export type TutorialAction = 'click' | 'drag' | 'type' | 'hover' | null;

/**
 * A single tutorial step
 */
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or 'body' for center
  position: TutorialPosition;
  action?: TutorialAction;
  spotlight?: boolean; // Whether to spotlight the target element
  nextButtonText?: string; // Custom text for next button
}

/**
 * Tutorial state
 */
export interface TutorialState {
  isActive: boolean;
  currentStep: number;
  completedAt: string | null;
}

/**
 * Tutorial context value
 */
export interface TutorialContextValue {
  state: TutorialState;
  currentStepData: TutorialStep | null;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  restartTutorial: () => void;
}

/**
 * The tutorial steps - order matters!
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to DRAMAC Studio! 🎨',
    description: 'Let\'s take a quick tour of the editor. This will only take about a minute. You can skip anytime.',
    target: 'body',
    position: 'center',
    spotlight: false,
    nextButtonText: 'Start Tour',
  },
  {
    id: 'components',
    title: 'Component Library',
    description: 'This is your toolbox! Drag components from here onto your page. You can search or browse by category.',
    target: '[data-panel="left"]',
    position: 'right',
    spotlight: true,
  },
  {
    id: 'canvas',
    title: 'Your Page Canvas',
    description: 'This is where you build your page. Click any component to select it, or drag to reposition.',
    target: '[data-panel="canvas"]',
    position: 'bottom',
    spotlight: true,
  },
  {
    id: 'properties',
    title: 'Properties Panel',
    description: 'Edit the selected component here. Change text, colors, spacing, and more.',
    target: '[data-panel="right"]',
    position: 'left',
    spotlight: true,
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant ✨',
    description: 'Click "Ask AI" to edit any component using natural language. Try "make this text bigger" or "change the color to blue".',
    target: '[data-ai-button]',
    position: 'left',
    spotlight: true,
  },
  {
    id: 'layers',
    title: 'Layers Panel',
    description: 'See your page structure here. Drag to reorder, click to select, or toggle visibility.',
    target: '[data-panel="bottom"]',
    position: 'top',
    spotlight: true,
  },
  {
    id: 'responsive',
    title: 'Responsive Preview',
    description: 'Switch between mobile, tablet, and desktop views to design for all screen sizes.',
    target: '[data-responsive-controls]',
    position: 'bottom',
    spotlight: true,
  },
  {
    id: 'templates',
    title: 'Section Templates',
    description: 'Click "Add Section" to insert pre-designed sections like hero, pricing, or testimonials.',
    target: '[data-template-button]',
    position: 'bottom',
    spotlight: true,
  },
  {
    id: 'save',
    title: 'Save Your Work',
    description: 'Click Save or press Ctrl+S to save. Your changes are also auto-saved every few minutes.',
    target: '[data-save-button]',
    position: 'bottom',
    spotlight: true,
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 🚀',
    description: 'Start building by dragging a component to the canvas, or use a template to get started faster. Press ? anytime for keyboard shortcuts.',
    target: 'body',
    position: 'center',
    spotlight: false,
    nextButtonText: 'Start Building',
  },
];

/**
 * Storage key for tutorial completion
 */
export const TUTORIAL_STORAGE_KEY = 'studio-tutorial-completed';

/**
 * Check if tutorial was completed
 */
export function isTutorialCompleted(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
}

/**
 * Mark tutorial as completed
 */
export function markTutorialCompleted(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  localStorage.setItem('studio-tutorial-completed-at', new Date().toISOString());
}

/**
 * Clear tutorial completion (for restart)
 */
export function clearTutorialCompletion(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  localStorage.removeItem('studio-tutorial-completed-at');
}
```

**Acceptance Criteria:**
- [ ] All tutorial steps defined
- [ ] Targets match actual UI elements
- [ ] Storage functions work correctly

---

### Task 2: Tutorial Provider and Context

**Description:** Create context provider for tutorial state.

**Files:**
- CREATE: `src/components/studio/onboarding/tutorial-provider.tsx`

**Code:**

```typescript
// src/components/studio/onboarding/tutorial-provider.tsx

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { TutorialContextValue, TutorialState } from '@/lib/studio/onboarding/tutorial-steps';
import {
  TUTORIAL_STEPS,
  isTutorialCompleted,
  markTutorialCompleted,
  clearTutorialCompletion,
} from '@/lib/studio/onboarding/tutorial-steps';

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TutorialState>({
    isActive: false,
    currentStep: 0,
    completedAt: null,
  });

  // Check if should show tutorial on mount
  useEffect(() => {
    // Small delay to let the UI render first
    const timer = setTimeout(() => {
      if (!isTutorialCompleted()) {
        setState(prev => ({ ...prev, isActive: true }));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const currentStepData = useMemo(() => {
    if (!state.isActive) return null;
    return TUTORIAL_STEPS[state.currentStep] || null;
  }, [state.isActive, state.currentStep]);

  const nextStep = useCallback(() => {
    setState(prev => {
      if (prev.currentStep >= TUTORIAL_STEPS.length - 1) {
        // Last step - complete tutorial
        markTutorialCompleted();
        return {
          ...prev,
          isActive: false,
          completedAt: new Date().toISOString(),
        };
      }
      return { ...prev, currentStep: prev.currentStep + 1 };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  const skipTutorial = useCallback(() => {
    markTutorialCompleted();
    setState(prev => ({
      ...prev,
      isActive: false,
      completedAt: new Date().toISOString(),
    }));
  }, []);

  const completeTutorial = useCallback(() => {
    markTutorialCompleted();
    setState(prev => ({
      ...prev,
      isActive: false,
      completedAt: new Date().toISOString(),
    }));
  }, []);

  const restartTutorial = useCallback(() => {
    clearTutorialCompletion();
    setState({
      isActive: true,
      currentStep: 0,
      completedAt: null,
    });
  }, []);

  const value: TutorialContextValue = {
    state,
    currentStepData,
    totalSteps: TUTORIAL_STEPS.length,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    restartTutorial,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

export default TutorialProvider;
```

**Acceptance Criteria:**
- [ ] Provider manages tutorial state
- [ ] Auto-starts for new users
- [ ] Skip and complete work correctly
- [ ] Restart clears storage and restarts

---

### Task 3: Tutorial Overlay Component

**Description:** Create the visual tutorial overlay with spotlight.

**Files:**
- CREATE: `src/components/studio/onboarding/tutorial-overlay.tsx`

**Code:**

```typescript
// src/components/studio/onboarding/tutorial-overlay.tsx

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTutorial } from './tutorial-provider';
import type { TutorialStep, TutorialPosition } from '@/lib/studio/onboarding/tutorial-steps';

export function TutorialOverlay() {
  const {
    state,
    currentStepData,
    totalSteps,
    nextStep,
    prevStep,
    skipTutorial,
  } = useTutorial();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Find and measure target element
  useEffect(() => {
    if (!state.isActive || !currentStepData) return;

    const updateTargetRect = () => {
      if (currentStepData.target === 'body') {
        // Center of screen
        setTargetRect(null);
      } else {
        const element = document.querySelector(currentStepData.target);
        if (element) {
          setTargetRect(element.getBoundingClientRect());
        } else {
          setTargetRect(null);
        }
      }
    };

    updateTargetRect();

    // Update on resize
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [state.isActive, currentStepData]);

  if (!state.isActive || !currentStepData) return null;

  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === totalSteps - 1;
  const showSpotlight = currentStepData.spotlight && targetRect;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999]">
        {/* Backdrop with spotlight cutout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
        >
          {showSpotlight ? (
            <SpotlightBackdrop targetRect={targetRect} />
          ) : (
            <div className="absolute inset-0 bg-black/60" />
          )}
        </motion.div>

        {/* Tooltip */}
        <TutorialTooltip
          ref={tooltipRef}
          step={currentStepData}
          stepNumber={state.currentStep + 1}
          totalSteps={totalSteps}
          targetRect={targetRect}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTutorial}
        />
      </div>
    </AnimatePresence>
  );
}

// Spotlight backdrop with SVG cutout
interface SpotlightBackdropProps {
  targetRect: DOMRect;
}

function SpotlightBackdrop({ targetRect }: SpotlightBackdropProps) {
  const padding = 8;
  const radius = 8;

  const x = targetRect.left - padding;
  const y = targetRect.top - padding;
  const width = targetRect.width + padding * 2;
  const height = targetRect.height + padding * 2;

  return (
    <svg className="absolute inset-0 w-full h-full">
      <defs>
        <mask id="spotlight-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={radius}
            ry={radius}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(0, 0, 0, 0.6)"
        mask="url(#spotlight-mask)"
      />
      {/* Highlight border around target */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={radius}
        ry={radius}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        className="animate-pulse"
      />
    </svg>
  );
}

// Tutorial tooltip with step content
interface TutorialTooltipProps {
  step: TutorialStep;
  stepNumber: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

const TutorialTooltip = ({
  step,
  stepNumber,
  totalSteps,
  targetRect,
  isFirstStep,
  isLastStep,
  onNext,
  onPrev,
  onSkip,
}: TutorialTooltipProps) => {
  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || step.position === 'center') {
      // Center on screen
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const gap = 16;
    const style: React.CSSProperties = { position: 'fixed' };

    switch (step.position) {
      case 'top':
        style.bottom = window.innerHeight - targetRect.top + gap;
        style.left = targetRect.left + targetRect.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        style.top = targetRect.bottom + gap;
        style.left = targetRect.left + targetRect.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'left':
        style.right = window.innerWidth - targetRect.left + gap;
        style.top = targetRect.top + targetRect.height / 2;
        style.transform = 'translateY(-50%)';
        break;
      case 'right':
        style.left = targetRect.right + gap;
        style.top = targetRect.top + targetRect.height / 2;
        style.transform = 'translateY(-50%)';
        break;
    }

    return style;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={getTooltipStyle()}
      className={cn(
        'w-80 bg-card border rounded-xl shadow-2xl p-4',
        'max-w-[calc(100vw-32px)]'
      )}
    >
      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Skip tutorial"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 rounded-full transition-all',
              i === stepNumber - 1
                ? 'w-4 bg-primary'
                : i < stepNumber - 1
                  ? 'w-2 bg-primary/50'
                  : 'w-2 bg-muted'
            )}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-2">
          {stepNumber} of {totalSteps}
        </span>
      </div>

      {/* Content */}
      <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={isFirstStep}
          className={cn(isFirstStep && 'invisible')}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        <div className="flex gap-2">
          {!isLastStep && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              <SkipForward className="w-4 h-4 mr-1" />
              Skip
            </Button>
          )}
          <Button size="sm" onClick={onNext}>
            {step.nextButtonText || (isLastStep ? 'Done' : 'Next')}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default TutorialOverlay;
```

**Acceptance Criteria:**
- [ ] Overlay covers screen with backdrop
- [ ] Spotlight highlights target element
- [ ] Tooltip positioned correctly
- [ ] Progress dots show current step
- [ ] Navigation buttons work
- [ ] Skip button closes tutorial

---

### Task 4: Contextual Tooltips

**Description:** Add hover tooltips to key UI elements.

**Files:**
- CREATE: `src/lib/studio/onboarding/tooltip-content.ts`
- CREATE: `src/components/studio/onboarding/help-tooltip.tsx`

**Code:**

```typescript
// src/lib/studio/onboarding/tooltip-content.ts

/**
 * Tooltip content for UI elements
 * Key is a data-tooltip attribute value
 */
export const TOOLTIP_CONTENT: Record<string, string> = {
  // Panels
  'component-library': 'Drag components from here to your page',
  'properties-panel': 'Edit the selected component here',
  'layers-panel': 'View and reorder page structure',
  'history-panel': 'View change history and restore versions',

  // Responsive
  'responsive-mobile': 'Preview how your page looks on mobile (320px)',
  'responsive-tablet': 'Preview how your page looks on tablet (768px)',
  'responsive-desktop': 'Preview how your page looks on desktop (1024px+)',
  'device-selector': 'Choose a device to preview',
  'orientation-toggle': 'Switch between portrait and landscape',

  // Zoom
  'zoom-in': 'Zoom in (Ctrl +)',
  'zoom-out': 'Zoom out (Ctrl -)',
  'zoom-fit': 'Fit canvas to screen (Ctrl 0)',
  'zoom-100': 'Reset to 100% zoom (Ctrl 1)',

  // Actions
  'undo-button': 'Undo last action (Ctrl+Z)',
  'redo-button': 'Redo last action (Ctrl+Shift+Z)',
  'save-button': 'Save your page (Ctrl+S)',
  'preview-button': 'Open page preview in new tab',
  'publish-button': 'Publish your page live',

  // Features
  'ai-button': 'Ask AI to help edit this component',
  'template-button': 'Insert a pre-designed section',
  'symbols-button': 'View and insert reusable symbols',
  'settings-button': 'Page settings (title, SEO, etc.)',

  // Component actions
  'component-duplicate': 'Duplicate this component (Ctrl+D)',
  'component-delete': 'Delete this component (Del)',
  'component-copy': 'Copy this component (Ctrl+C)',
  'component-paste': 'Paste copied component (Ctrl+V)',
  'component-lock': 'Lock/unlock this component',
  'component-hide': 'Show/hide this component',

  // Layers
  'layer-visibility': 'Toggle visibility',
  'layer-lock': 'Toggle lock (prevent editing)',
  'layer-expand': 'Expand/collapse children',

  // Misc
  'command-palette': 'Open command palette (Ctrl+K)',
  'shortcuts-help': 'View keyboard shortcuts (?)',
};

/**
 * Get tooltip content for a key
 */
export function getTooltipContent(key: string): string | null {
  return TOOLTIP_CONTENT[key] || null;
}
```

```typescript
// src/components/studio/onboarding/help-tooltip.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getTooltipContent } from '@/lib/studio/onboarding/tooltip-content';

interface HelpTooltipProps {
  tooltipKey: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayDuration?: number;
}

export function HelpTooltip({
  tooltipKey,
  children,
  side = 'top',
  delayDuration = 500, // Half second delay to not be annoying
}: HelpTooltipProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const content = getTooltipContent(tooltipKey);

  // Allow disabling tooltips (e.g., during tutorial)
  useEffect(() => {
    const checkTutorial = () => {
      const tutorialActive = document.querySelector('[data-tutorial-active]');
      setIsEnabled(!tutorialActive);
    };

    checkTutorial();
    // Could add an event listener here if needed
  }, []);

  if (!content || !isEnabled) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Usage example:
 *
 * <HelpTooltip tooltipKey="save-button">
 *   <Button>Save</Button>
 * </HelpTooltip>
 */

export default HelpTooltip;
```

**Acceptance Criteria:**
- [ ] Tooltips show on hover with delay
- [ ] All key UI elements have tooltips
- [ ] Tooltips disabled during tutorial
- [ ] Content is helpful and includes shortcuts

---

### Task 5: Help Panel

**Description:** Create slide-out help panel with documentation links.

**Files:**
- CREATE: `src/lib/studio/onboarding/help-content.ts`
- CREATE: `src/components/studio/features/help-panel.tsx`

**Code:**

```typescript
// src/lib/studio/onboarding/help-content.ts

/**
 * Help section structure
 */
export interface HelpSection {
  title: string;
  items: HelpItem[];
}

export interface HelpItem {
  title: string;
  description: string;
  icon?: string;
  link?: string; // External documentation link
  video?: string; // Tutorial video URL
  action?: string; // Internal action (e.g., 'openShortcuts')
}

/**
 * Help panel content organized by section
 */
export const HELP_SECTIONS: HelpSection[] = [
  {
    title: 'Getting Started',
    items: [
      {
        title: 'Adding Components',
        description: 'Learn how to add and arrange components on your page',
        icon: 'plus-square',
        link: '/docs/studio/adding-components',
      },
      {
        title: 'Editing Content',
        description: 'How to edit text, images, and other content',
        icon: 'edit',
        link: '/docs/studio/editing-content',
      },
      {
        title: 'Using Templates',
        description: 'Insert pre-designed sections to build faster',
        icon: 'layout-template',
        link: '/docs/studio/templates',
      },
      {
        title: 'Responsive Design',
        description: 'Make your site look great on all devices',
        icon: 'smartphone',
        link: '/docs/studio/responsive',
      },
    ],
  },
  {
    title: 'Advanced Features',
    items: [
      {
        title: 'AI Assistant',
        description: 'Use AI to edit components with natural language',
        icon: 'sparkles',
        link: '/docs/studio/ai-assistant',
      },
      {
        title: 'Symbols',
        description: 'Create reusable components that sync across pages',
        icon: 'puzzle',
        link: '/docs/studio/symbols',
      },
      {
        title: 'Custom CSS',
        description: 'Add custom styles to your components',
        icon: 'code',
        link: '/docs/studio/custom-css',
      },
      {
        title: 'SEO Settings',
        description: 'Optimize your pages for search engines',
        icon: 'search',
        link: '/docs/studio/seo',
      },
    ],
  },
  {
    title: 'Quick Reference',
    items: [
      {
        title: 'Keyboard Shortcuts',
        description: 'Speed up your workflow with shortcuts',
        icon: 'keyboard',
        action: 'openShortcuts',
      },
      {
        title: 'Restart Tutorial',
        description: 'Take the guided tour again',
        icon: 'refresh-cw',
        action: 'restartTutorial',
      },
    ],
  },
  {
    title: 'Resources',
    items: [
      {
        title: 'Video Tutorials',
        description: 'Watch step-by-step video guides',
        icon: 'play-circle',
        link: 'https://youtube.com/@dramac',
      },
      {
        title: 'Community Forum',
        description: 'Get help from other DRAMAC users',
        icon: 'users',
        link: 'https://community.dramac.io',
      },
      {
        title: 'Contact Support',
        description: 'Reach out to our support team',
        icon: 'mail',
        link: 'mailto:support@dramac.io',
      },
    ],
  },
];
```

```typescript
// src/components/studio/features/help-panel.tsx

'use client';

import { useState } from 'react';
import {
  HelpCircle,
  ExternalLink,
  Play,
  ChevronRight,
  RefreshCw,
  Keyboard,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { HELP_SECTIONS, type HelpItem, type HelpSection } from '@/lib/studio/onboarding/help-content';
import { useTutorial } from '../onboarding/tutorial-provider';

// Icon mapping
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'plus-square': ({ className }) => <span className={className}>➕</span>,
  'edit': ({ className }) => <span className={className}>✏️</span>,
  'layout-template': ({ className }) => <span className={className}>📐</span>,
  'smartphone': ({ className }) => <span className={className}>📱</span>,
  'sparkles': ({ className }) => <span className={className}>✨</span>,
  'puzzle': ({ className }) => <span className={className}>🧩</span>,
  'code': ({ className }) => <span className={className}>💻</span>,
  'search': ({ className }) => <span className={className}>🔍</span>,
  'keyboard': Keyboard,
  'refresh-cw': RefreshCw,
  'play-circle': Play,
  'users': ({ className }) => <span className={className}>👥</span>,
  'mail': ({ className }) => <span className={className}>📧</span>,
};

interface HelpPanelProps {
  onOpenShortcuts?: () => void;
}

export function HelpPanel({ onOpenShortcuts }: HelpPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { restartTutorial } = useTutorial();

  const handleAction = (action: string) => {
    switch (action) {
      case 'openShortcuts':
        setIsOpen(false);
        onOpenShortcuts?.();
        break;
      case 'restartTutorial':
        setIsOpen(false);
        restartTutorial();
        break;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          data-tooltip="shortcuts-help"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Help</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[450px] p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Help & Resources
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="px-6 pb-6 space-y-6">
            {HELP_SECTIONS.map((section, i) => (
              <HelpSectionComponent
                key={section.title}
                section={section}
                onAction={handleAction}
              />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface HelpSectionProps {
  section: HelpSection;
  onAction: (action: string) => void;
}

function HelpSectionComponent({ section, onAction }: HelpSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        {section.title}
      </h3>
      <div className="space-y-1">
        {section.items.map((item) => (
          <HelpItemComponent
            key={item.title}
            item={item}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
}

interface HelpItemProps {
  item: HelpItem;
  onAction: (action: string) => void;
}

function HelpItemComponent({ item, onAction }: HelpItemProps) {
  const IconComponent = item.icon ? ICONS[item.icon] : null;
  
  const handleClick = () => {
    if (item.action) {
      onAction(item.action);
    } else if (item.link) {
      window.open(item.link, '_blank');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-lg text-left',
        'hover:bg-muted/50 transition-colors group'
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        {IconComponent && <IconComponent className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{item.title}</span>
          {item.link?.startsWith('http') && (
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          )}
          {item.video && (
            <Play className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {item.description}
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
    </button>
  );
}

export default HelpPanel;
```

**Acceptance Criteria:**
- [ ] Panel slides out from right
- [ ] Sections organized logically
- [ ] External links open in new tab
- [ ] Actions trigger correctly
- [ ] Restart tutorial works

---

### Task 6: What's New Panel

**Description:** Create changelog popover for updates.

**Files:**
- CREATE: `src/lib/studio/onboarding/changelog.ts`
- CREATE: `src/components/studio/features/whats-new-panel.tsx`

**Code:**

```typescript
// src/lib/studio/onboarding/changelog.ts

/**
 * Change type for changelog items
 */
export type ChangeType = 'feature' | 'improvement' | 'fix';

/**
 * Individual change entry
 */
export interface ChangelogEntry {
  type: ChangeType;
  title: string;
  description: string;
}

/**
 * Release version with changes
 */
export interface ChangelogRelease {
  version: string;
  date: string;
  changes: ChangelogEntry[];
}

/**
 * Changelog data
 */
export const CHANGELOG: ChangelogRelease[] = [
  {
    version: '1.2.0',
    date: '2026-02-03',
    changes: [
      {
        type: 'feature',
        title: 'Section Templates',
        description: 'Insert pre-designed sections like hero, pricing, and testimonials',
      },
      {
        type: 'feature',
        title: 'Symbols',
        description: 'Create reusable components that sync across all pages',
      },
      {
        type: 'feature',
        title: 'Onboarding Tutorial',
        description: 'New guided tour for first-time users',
      },
      {
        type: 'improvement',
        title: 'Help Panel',
        description: 'Easy access to documentation and resources',
      },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-02-02',
    changes: [
      {
        type: 'feature',
        title: 'Keyboard Shortcuts',
        description: 'Full keyboard navigation and shortcuts for power users',
      },
      {
        type: 'feature',
        title: 'Command Palette',
        description: 'Quick access to all actions with Ctrl+K',
      },
      {
        type: 'feature',
        title: 'Component States',
        description: 'Edit hover, active, and focus states for buttons and links',
      },
      {
        type: 'improvement',
        title: 'Performance',
        description: 'Editor now handles 500+ components smoothly',
      },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-01-28',
    changes: [
      {
        type: 'feature',
        title: 'DRAMAC Studio Launch',
        description: 'Brand new visual editor with drag-and-drop components',
      },
      {
        type: 'feature',
        title: 'AI Assistant',
        description: 'Edit any component using natural language',
      },
      {
        type: 'feature',
        title: 'Responsive Preview',
        description: 'Design for mobile, tablet, and desktop in one place',
      },
      {
        type: 'feature',
        title: 'Layers Panel',
        description: 'Visual page structure with drag-to-reorder',
      },
    ],
  },
];

/**
 * Storage key for last seen version
 */
export const CHANGELOG_STORAGE_KEY = 'studio-changelog-seen';

/**
 * Get the latest version
 */
export function getLatestVersion(): string {
  return CHANGELOG[0]?.version || '1.0.0';
}

/**
 * Check if there are unread updates
 */
export function hasUnreadUpdates(): boolean {
  if (typeof window === 'undefined') return false;
  const lastSeen = localStorage.getItem(CHANGELOG_STORAGE_KEY);
  return lastSeen !== getLatestVersion();
}

/**
 * Mark updates as read
 */
export function markUpdatesAsRead(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHANGELOG_STORAGE_KEY, getLatestVersion());
}
```

```typescript
// src/components/studio/features/whats-new-panel.tsx

'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ExternalLink, Rocket, Zap, Wrench } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  CHANGELOG,
  hasUnreadUpdates,
  markUpdatesAsRead,
  type ChangeType,
  type ChangelogRelease,
} from '@/lib/studio/onboarding/changelog';

const CHANGE_TYPE_CONFIG: Record<ChangeType, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  feature: {
    label: 'New',
    icon: Rocket,
    color: 'bg-green-500/10 text-green-600 border-green-500/30',
  },
  improvement: {
    label: 'Improved',
    icon: Zap,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  },
  fix: {
    label: 'Fixed',
    icon: Wrench,
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  },
};

export function WhatsNewPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Check for unread updates on mount
  useEffect(() => {
    setHasUnread(hasUnreadUpdates());
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && hasUnread) {
      markUpdatesAsRead();
      setHasUnread(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="What's new"
        >
          <Sparkles className="w-4 h-4" />
          
          {/* Unread indicator */}
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent
        className="w-96 p-0"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">What's New</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Latest updates and improvements
          </p>
        </div>

        <Separator />

        {/* Changelog */}
        <ScrollArea className="h-80">
          <div className="p-4 space-y-6">
            {CHANGELOG.map((release, i) => (
              <ReleaseSection key={release.version} release={release} isLatest={i === 0} />
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
            asChild
          >
            <a href="/changelog" target="_blank" rel="noopener noreferrer">
              View full changelog
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ReleaseSectionProps {
  release: ChangelogRelease;
  isLatest: boolean;
}

function ReleaseSection({ release, isLatest }: ReleaseSectionProps) {
  const formattedDate = new Date(release.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div>
      {/* Version header */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant={isLatest ? 'default' : 'secondary'}>
          v{release.version}
        </Badge>
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
        {isLatest && (
          <Badge variant="outline" className="text-green-600 border-green-500">
            Latest
          </Badge>
        )}
      </div>

      {/* Changes */}
      <div className="space-y-2">
        {release.changes.map((change, i) => {
          const config = CHANGE_TYPE_CONFIG[change.type];
          const Icon = config.icon;

          return (
            <div key={i} className="flex gap-3">
              {/* Type badge */}
              <Badge
                variant="outline"
                className={cn('flex-shrink-0 gap-1 text-xs', config.color)}
              >
                <Icon className="w-3 h-3" />
                {config.label}
              </Badge>

              {/* Change content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{change.title}</p>
                <p className="text-xs text-muted-foreground">
                  {change.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WhatsNewPanel;
```

**Acceptance Criteria:**
- [ ] Shows unread indicator when new updates
- [ ] Opens popover with changelog
- [ ] Groups changes by version
- [ ] Shows change type badges
- [ ] Marks as read on open
- [ ] Links to full changelog

---

### Task 7: Empty Canvas Guide

**Description:** Show guidance when canvas is empty.

**Files:**
- CREATE: `src/components/studio/onboarding/empty-canvas-guide.tsx`

**Code:**

```typescript
// src/components/studio/onboarding/empty-canvas-guide.tsx

'use client';

import { MousePointer, LayoutTemplate, Sparkles, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyCanvasGuideProps {
  onOpenTemplates: () => void;
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
            ease: 'easeInOut',
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
        Drag components from the left panel, or use one of these quick options to get started faster.
      </p>

      {/* Quick action buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          size="lg"
          onClick={onOpenTemplates}
          className="gap-2"
        >
          <LayoutTemplate className="w-5 h-5" />
          Choose a Template
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          onClick={onOpenAIGenerator}
          className="gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Generate with AI
        </Button>
      </div>

      {/* Tips */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
        <TipCard
          icon="💡"
          title="Drag & Drop"
          description="Drag any component from the left panel onto this canvas"
        />
        <TipCard
          icon="🎨"
          title="Templates"
          description="Pre-designed sections help you build faster"
        />
        <TipCard
          icon="✨"
          title="AI Magic"
          description="Describe what you want and AI will create it"
        />
      </div>
    </motion.div>
  );
}

interface TipCardProps {
  icon: string;
  title: string;
  description: string;
}

function TipCard({ icon, title, description }: TipCardProps) {
  return (
    <div className="text-left p-4 rounded-lg bg-muted/50 border border-border/50">
      <span className="text-2xl mb-2 block">{icon}</span>
      <h4 className="font-medium text-sm mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export default EmptyCanvasGuide;
```

**Acceptance Criteria:**
- [ ] Shows when canvas has no components
- [ ] Animated to draw attention
- [ ] Template button opens template browser
- [ ] AI button opens AI generator
- [ ] Tips provide guidance

---

### Task 8: Integration with Studio

**Description:** Integrate all onboarding components into Studio.

**Files:**
- MODIFY: `src/components/studio/core/studio-provider.tsx`
- MODIFY: `src/components/studio/layout/studio-toolbar.tsx`
- MODIFY: `src/components/studio/canvas/editor-canvas.tsx`

**Code:**

```typescript
// Add to studio-provider.tsx
import { TutorialProvider } from '../onboarding/tutorial-provider';
import { TutorialOverlay } from '../onboarding/tutorial-overlay';

export function StudioProvider({ children }: { children: React.ReactNode }) {
  return (
    <TutorialProvider>
      {/* Other providers */}
      {children}
      
      {/* Tutorial overlay (renders on top of everything) */}
      <TutorialOverlay />
    </TutorialProvider>
  );
}
```

```typescript
// Add to studio-toolbar.tsx
import { HelpPanel } from '../features/help-panel';
import { WhatsNewPanel } from '../features/whats-new-panel';
import { ShortcutsPanel } from '../features/shortcuts-panel';
import { useState } from 'react';

export function StudioToolbar() {
  const [isShortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <div className="toolbar">
      {/* ... existing toolbar items ... */}
      
      <div className="flex items-center gap-1">
        {/* What's New */}
        <WhatsNewPanel />
        
        {/* Help */}
        <HelpPanel onOpenShortcuts={() => setShortcutsOpen(true)} />
      </div>
      
      {/* Shortcuts Panel (modal) */}
      <ShortcutsPanel
        isOpen={isShortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}
```

```typescript
// Add to editor-canvas.tsx
import { EmptyCanvasGuide } from '../onboarding/empty-canvas-guide';
import { useEditorStore } from '@/lib/studio/store/editor-store';

export function EditorCanvas() {
  const components = useEditorStore(s => Object.keys(s.data.components));
  const isEmpty = components.length === 0;
  
  const [isTemplateBrowserOpen, setTemplateBrowserOpen] = useState(false);
  const [isAIGeneratorOpen, setAIGeneratorOpen] = useState(false);

  return (
    <div className="canvas-container">
      {isEmpty ? (
        <EmptyCanvasGuide
          onOpenTemplates={() => setTemplateBrowserOpen(true)}
          onOpenAIGenerator={() => setAIGeneratorOpen(true)}
        />
      ) : (
        // ... existing canvas rendering
      )}
      
      {/* Template Browser Dialog */}
      <TemplateBrowser
        isOpen={isTemplateBrowserOpen}
        onClose={() => setTemplateBrowserOpen(false)}
        onInsert={handleInsertTemplate}
      />
      
      {/* AI Page Generator Dialog */}
      <AIPageGenerator
        isOpen={isAIGeneratorOpen}
        onClose={() => setAIGeneratorOpen(false)}
      />
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Tutorial starts for new users
- [ ] Toolbar has Help and What's New
- [ ] Empty canvas shows guidance
- [ ] All features work together

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | src/lib/studio/onboarding/tutorial-steps.ts | Tutorial step definitions |
| CREATE | src/components/studio/onboarding/tutorial-provider.tsx | Tutorial state context |
| CREATE | src/components/studio/onboarding/tutorial-overlay.tsx | Tutorial UI overlay |
| CREATE | src/lib/studio/onboarding/tooltip-content.ts | Tooltip text content |
| CREATE | src/components/studio/onboarding/help-tooltip.tsx | Tooltip wrapper component |
| CREATE | src/lib/studio/onboarding/help-content.ts | Help panel content |
| CREATE | src/components/studio/features/help-panel.tsx | Help slide-out panel |
| CREATE | src/lib/studio/onboarding/changelog.ts | Changelog data |
| CREATE | src/components/studio/features/whats-new-panel.tsx | What's new popover |
| CREATE | src/components/studio/onboarding/empty-canvas-guide.tsx | Empty canvas guidance |
| MODIFY | src/components/studio/core/studio-provider.tsx | Add TutorialProvider |
| MODIFY | src/components/studio/layout/studio-toolbar.tsx | Add Help and What's New |
| MODIFY | src/components/studio/canvas/editor-canvas.tsx | Add empty state |

## Testing Requirements

### Unit Tests
- [ ] Tutorial steps have valid targets
- [ ] Tutorial completion stored correctly
- [ ] Changelog version comparison works
- [ ] Tooltip content returns correct text

### Integration Tests
- [ ] Tutorial auto-starts for new users
- [ ] Tutorial navigation works (next/prev/skip)
- [ ] Tutorial completion persists
- [ ] Help panel opens and closes
- [ ] What's New shows unread indicator
- [ ] Empty canvas buttons work

### Manual Testing
- [ ] Clear localStorage, refresh - tutorial starts
- [ ] Complete tutorial - doesn't start again
- [ ] Tutorial spotlights correct elements
- [ ] Tooltip positions are correct
- [ ] Hover tooltips appear with delay
- [ ] Help panel links work
- [ ] Restart tutorial works
- [ ] What's New indicator appears for new versions
- [ ] Empty canvas shows guide
- [ ] Template button opens browser
- [ ] AI button opens generator

## Dependencies to Install

```bash
# framer-motion may already be installed
pnpm add framer-motion
```

## Environment Variables

```env
# No new environment variables required
```

## Database Changes

```sql
-- Optional: Store tutorial completion per user in database
-- (Currently using localStorage for simplicity)

-- If needed later:
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  tutorial_completed BOOLEAN DEFAULT false,
  tutorial_completed_at TIMESTAMP WITH TIME ZONE,
  changelog_seen_version TEXT,
  tooltips_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Rollback Plan

1. Remove TutorialProvider from studio-provider.tsx
2. Remove Help and What's New from toolbar
3. Remove empty canvas guide from canvas
4. Delete new files:
   - `src/lib/studio/onboarding/*`
   - `src/components/studio/onboarding/*`
   - `src/components/studio/features/help-panel.tsx`
   - `src/components/studio/features/whats-new-panel.tsx`
5. Clear localStorage keys:
   - `studio-tutorial-completed`
   - `studio-changelog-seen`

## Success Criteria

- [ ] **Tutorial**
  - [ ] Auto-starts for first-time users
  - [ ] Shows 10 steps covering all key areas
  - [ ] Spotlight highlights target elements
  - [ ] Progress dots show current step
  - [ ] Can skip at any time
  - [ ] Can go back to previous steps
  - [ ] Completion persists (doesn't show again)
  - [ ] Can restart from Help panel

- [ ] **Tooltips**
  - [ ] Show on hover with 500ms delay
  - [ ] Cover all key UI elements
  - [ ] Include keyboard shortcuts where applicable
  - [ ] Don't show during tutorial
  - [ ] Positioned correctly

- [ ] **Help Panel**
  - [ ] Opens from toolbar
  - [ ] Organized by section
  - [ ] Links open in new tab
  - [ ] Restart tutorial works
  - [ ] Open shortcuts works

- [ ] **What's New**
  - [ ] Shows unread indicator for new versions
  - [ ] Popover displays changelog
  - [ ] Groups by version with dates
  - [ ] Color-coded change types
  - [ ] Marks as read on open

- [ ] **Empty Canvas**
  - [ ] Shows when no components
  - [ ] Animated for attention
  - [ ] Template button works
  - [ ] AI button works
  - [ ] Tips provide value

- [ ] **General**
  - [ ] No TypeScript errors
  - [ ] Performance not impacted
  - [ ] Works with all existing features
  - [ ] Accessible (keyboard navigable)
