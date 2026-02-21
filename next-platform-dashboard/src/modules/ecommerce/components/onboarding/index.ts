/**
 * Onboarding Module Index
 * 
 * PHASE-ECOM-53: Onboarding Wizard & Configuration
 * 
 * Exports all onboarding-related components, types, and actions.
 */

// Main wizard component
export { OnboardingWizard } from './OnboardingWizard';

// Store template selector
export { StoreTemplateSelector } from './StoreTemplateSelector';

// Step components
export {
  StoreBasicsStep,
  CurrencyTaxStep,
  ShippingStep,
  PaymentsStep,
  FirstProductStep,
  LaunchStep,
} from './steps';
