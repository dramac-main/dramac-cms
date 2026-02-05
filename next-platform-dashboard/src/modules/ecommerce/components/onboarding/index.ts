/**
 * Onboarding Module Index
 * 
 * PHASE-ECOM-53: Onboarding Wizard & Configuration
 * 
 * Exports all onboarding-related components, types, and actions.
 */

// Main wizard component
export { OnboardingWizard } from './OnboardingWizard';

// Step components
export {
  StoreBasicsStep,
  CurrencyTaxStep,
  ShippingStep,
  PaymentsStep,
  FirstProductStep,
  LaunchStep,
} from './steps';
