/**
 * OnboardingWizard Component
 * 
 * PHASE-ECOM-53: Onboarding Wizard & Configuration
 * 
 * Main wizard component that orchestrates the onboarding flow.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  OnboardingWizardProps,
  OnboardingData,
} from '../../types/onboarding-types';
import {
  ONBOARDING_STEPS,
  DEFAULT_ONBOARDING_DATA,
} from '../../types/onboarding-types';
import {
  getOnboardingStatus,
  saveOnboardingStep,
  skipOnboardingStep,
  completeOnboarding,
  skipOnboarding,
} from '../../actions/onboarding-actions';

// Step components
import { StoreBasicsStep } from './steps/StoreBasicsStep';
import { CurrencyTaxStep } from './steps/CurrencyTaxStep';
import { ShippingStep } from './steps/ShippingStep';
import { PaymentsStep } from './steps/PaymentsStep';
import { FirstProductStep } from './steps/FirstProductStep';
import { LaunchStep } from './steps/LaunchStep';

// ============================================================================
// COMPONENT
// ============================================================================

export function OnboardingWizard({
  siteId,
  onComplete,
  onSkip,
  initialStep = 1,
  className,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [data, setData] = useState<Partial<OnboardingData>>(DEFAULT_ONBOARDING_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing onboarding data on mount
  useEffect(() => {
    async function loadStatus() {
      try {
        const result = await getOnboardingStatus(siteId);
        if (result.success && result.status) {
          setCurrentStep(result.status.currentStep);
          // Merge any existing data
        }
      } catch (err) {
        console.error('Failed to load onboarding status:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStatus();
  }, [siteId]);

  // Handle data change from step components
  const handleDataChange = useCallback((stepData: Partial<OnboardingData>) => {
    setData(prev => ({
      ...prev,
      ...stepData,
    }));
  }, []);

  // Handle next step
  const handleNext = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Save current step data
      const result = await saveOnboardingStep(siteId, currentStep, data);
      
      if (!result.success) {
        setError(result.error || 'Failed to save step');
        setIsSaving(false);
        return;
      }

      if (currentStep < ONBOARDING_STEPS.length) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Complete onboarding
        const completeResult = await completeOnboarding(siteId, data);
        if (completeResult.success) {
          onComplete();
        } else {
          setError(completeResult.error || 'Failed to complete onboarding');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  }, [siteId, currentStep, data, onComplete]);

  // Handle back
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Handle skip step
  const handleSkipStep = useCallback(async () => {
    setIsSaving(true);

    try {
      await skipOnboardingStep(siteId, currentStep);
      
      if (currentStep < ONBOARDING_STEPS.length) {
        setCurrentStep(prev => prev + 1);
      }
    } catch (err) {
      setError('Failed to skip step');
    } finally {
      setIsSaving(false);
    }
  }, [siteId, currentStep]);

  // Handle skip all
  const handleSkipAll = useCallback(async () => {
    const confirmed = window.confirm(
      'Are you sure you want to skip the setup wizard? You can configure these settings later from the Settings page.'
    );

    if (!confirmed) return;

    setIsSaving(true);

    try {
      const result = await skipOnboarding(siteId);
      if (result.success) {
        onSkip?.();
        onComplete();
      } else {
        setError(result.error || 'Failed to skip onboarding');
      }
    } catch (err) {
      setError('Failed to skip onboarding');
    } finally {
      setIsSaving(false);
    }
  }, [siteId, onSkip, onComplete]);

  // Get current step definition
  const stepDef = ONBOARDING_STEPS[currentStep - 1];
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === ONBOARDING_STEPS.length;

  // Render step component
  const renderStep = () => {
    const commonProps = {
      siteId,
      data,
      onDataChange: handleDataChange,
      onNext: handleNext,
      onBack: handleBack,
      onSkip: stepDef?.canSkip ? handleSkipStep : undefined,
      isFirstStep,
      isLastStep,
    };

    switch (currentStep) {
      case 1:
        return <StoreBasicsStep {...commonProps} />;
      case 2:
        return <CurrencyTaxStep {...commonProps} />;
      case 3:
        return <ShippingStep {...commonProps} />;
      case 4:
        return <PaymentsStep {...commonProps} />;
      case 5:
        return <FirstProductStep {...commonProps} />;
      case 6:
        return <LaunchStep {...commonProps} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4',
        className
      )}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Set Up Your Store
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Step {currentStep} of {ONBOARDING_STEPS.length}: {stepDef?.title}
              </p>
            </div>
            <button
              onClick={handleSkipAll}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Skip setup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex items-center gap-2">
            {ONBOARDING_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                    index + 1 < currentStep
                      ? 'bg-green-500 text-white'
                      : index + 1 === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  )}
                >
                  {index + 1 < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < ONBOARDING_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-1 rounded-full transition-colors',
                      index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <div>
            {!isFirstStep && (
              <button
                onClick={handleBack}
                disabled={isSaving}
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {stepDef?.canSkip && (
              <button
                onClick={handleSkipStep}
                disabled={isSaving}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Skip
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={isSaving}
              className={cn(
                'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors',
                'bg-blue-600 text-white hover:bg-blue-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : isLastStep ? (
                <>
                  Complete Setup
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingWizard;
