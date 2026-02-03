/**
 * DRAMAC Studio Tutorial Steps
 * 
 * Defines the tutorial flow for first-time users.
 * 
 * @phase STUDIO-26
 */

// =============================================================================
// TYPES
// =============================================================================

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

// =============================================================================
// TUTORIAL STEPS
// =============================================================================

/**
 * The tutorial steps - order matters!
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to DRAMAC Studio! 🎨',
    description: "Let's take a quick tour of the editor. This will only take about a minute. You can skip anytime.",
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
    description: 'Click "Generate Page" or "AI" to edit using natural language. Try "make this text bigger" or "change the color to blue".',
    target: '[data-ai-generate]',
    position: 'bottom',
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
    title: "You're Ready! 🚀",
    description: 'Start building by dragging a component to the canvas, or use a template to get started faster. Press ? anytime for keyboard shortcuts.',
    target: 'body',
    position: 'center',
    spotlight: false,
    nextButtonText: 'Start Building',
  },
];

// =============================================================================
// STORAGE UTILITIES
// =============================================================================

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
