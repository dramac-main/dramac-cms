/**
 * DRAMAC Studio Tutorial Provider
 * 
 * Context provider for managing tutorial state.
 * Auto-starts for first-time users.
 * Ensures panels are visible during tutorial.
 * 
 * @phase STUDIO-26
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { TutorialContextValue, TutorialState } from "@/lib/studio/onboarding/tutorial-steps";
import {
  TUTORIAL_STEPS,
  isTutorialCompleted,
  markTutorialCompleted,
  clearTutorialCompletion,
} from "@/lib/studio/onboarding/tutorial-steps";
import { useUIStore } from "@/lib/studio/store";

// =============================================================================
// CONTEXT
// =============================================================================

const TutorialContext = createContext<TutorialContextValue | null>(null);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

interface TutorialProviderProps {
  children: ReactNode;
  /** If true, won't auto-start the tutorial even for new users */
  disabled?: boolean;
}

export function TutorialProvider({ children, disabled = false }: TutorialProviderProps) {
  const [state, setState] = useState<TutorialState>({
    isActive: false,
    currentStep: 0,
    completedAt: null,
  });
  
  // Get panel controls to ensure panels are visible during tutorial
  const setPanelOpen = useUIStore((s) => s.setPanelOpen);

  // Ensure panels are visible when tutorial starts and for specific steps
  useEffect(() => {
    if (!state.isActive) return;
    
    const currentStep = TUTORIAL_STEPS[state.currentStep];
    if (!currentStep) return;
    
    // Ensure relevant panels are open based on current step
    if (currentStep.target.includes('data-panel="left"')) {
      setPanelOpen('left', true);
    } else if (currentStep.target.includes('data-panel="right"')) {
      setPanelOpen('right', true);
    } else if (currentStep.target.includes('data-panel="bottom"')) {
      setPanelOpen('bottom', true);
    }
  }, [state.isActive, state.currentStep, setPanelOpen]);

  // Check if should show tutorial on mount
  useEffect(() => {
    if (disabled) return;
    
    // Small delay to let the UI render first
    const timer = setTimeout(() => {
      if (!isTutorialCompleted()) {
        // Ensure all panels are visible when tutorial starts
        setPanelOpen('left', true);
        setPanelOpen('right', true);
        setPanelOpen('bottom', true);
        setState(prev => ({ ...prev, isActive: true }));
      }
    }, 1500); // 1.5 seconds to let page fully load

    return () => clearTimeout(timer);
  }, [disabled, setPanelOpen]);

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

  const value: TutorialContextValue = useMemo(() => ({
    state,
    currentStepData,
    totalSteps: TUTORIAL_STEPS.length,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    restartTutorial,
  }), [state, currentStepData, nextStep, prevStep, skipTutorial, completeTutorial, restartTutorial]);

  return (
    <TutorialContext.Provider value={value}>
      {/* Add data attribute for tutorial state detection */}
      {state.isActive && <div data-tutorial-active="true" className="hidden" />}
      {children}
    </TutorialContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}

// =============================================================================
// OPTIONAL HOOK (doesn't throw if outside provider)
// =============================================================================

export function useTutorialOptional() {
  return useContext(TutorialContext);
}

export default TutorialProvider;
