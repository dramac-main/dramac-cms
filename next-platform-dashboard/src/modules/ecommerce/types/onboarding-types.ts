/**
 * E-Commerce Onboarding Type Definitions
 * 
 * PHASE-ECOM-53: Onboarding Wizard & Configuration
 * 
 * Types for the onboarding wizard and store setup.
 */

// ============================================================================
// ONBOARDING DATA TYPES
// ============================================================================

/**
 * Complete onboarding data collected across all steps
 */
export interface OnboardingData {
  // Step 1: Store Basics
  storeBasics: {
    storeName: string;
    storeDescription?: string;
    contactEmail: string;
    contactPhone?: string;
    businessAddress?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    logoUrl?: string;
  };

  // Step 2: Currency & Tax
  currencyTax: {
    currency: string;
    currencySymbol: string;
    currencyPosition: 'before' | 'after';
    thousandsSeparator: string;
    decimalSeparator: string;
    taxEnabled: boolean;
    taxRate: number;
    taxIncludedInPrice: boolean;
    taxDisplayText?: string;
  };

  // Step 3: Shipping
  shipping: {
    shippingEnabled: boolean;
    freeShippingEnabled: boolean;
    freeShippingThreshold?: number;
    defaultShippingRate?: number;
    shippingConfiguredLater: boolean;
  };

  // Step 4: Payments
  payments: {
    paymentProviders: PaymentProviderConfig[];
    manualOrdersEnabled: boolean;
    paymentsConfiguredLater: boolean;
  };

  // Step 5: First Product (optional)
  firstProduct?: {
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
    skipped: boolean;
  };
}

/**
 * Payment provider configuration
 */
export interface PaymentProviderConfig {
  provider: 'flutterwave' | 'pesapal' | 'paddle' | 'stripe' | 'manual';
  enabled: boolean;
  configured: boolean;
  credentials?: Record<string, string>;
}

// ============================================================================
// ONBOARDING STATE TYPES
// ============================================================================

/**
 * Onboarding status tracking
 */
export interface OnboardingStatus {
  completed: boolean;
  currentStep: number;
  stepStatuses: StepStatus[];
  startedAt?: string;
  completedAt?: string;
}

/**
 * Individual step status
 */
export interface StepStatus {
  stepNumber: number;
  stepId: string;
  completed: boolean;
  skipped: boolean;
  data?: Partial<OnboardingData>;
}

/**
 * Step definition for the wizard
 */
export interface OnboardingStep {
  id: string;
  number: number;
  title: string;
  description: string;
  required: boolean;
  canSkip: boolean;
  estimatedTime?: string;
}

// ============================================================================
// WIZARD COMPONENT PROPS
// ============================================================================

/**
 * Props for the main OnboardingWizard component
 */
export interface OnboardingWizardProps {
  siteId: string;
  onComplete: () => void;
  onSkip?: () => void;
  initialStep?: number;
  className?: string;
}

/**
 * Common props for step components
 */
export interface StepComponentProps {
  siteId: string;
  data: Partial<OnboardingData>;
  onDataChange: (stepData: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * Result of saving onboarding step
 */
export interface SaveOnboardingStepResult {
  success: boolean;
  error?: string;
}

/**
 * Result of completing onboarding
 */
export interface CompleteOnboardingResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

/**
 * Result of getting onboarding status
 */
export interface GetOnboardingStatusResult {
  success: boolean;
  status: OnboardingStatus | null;
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Available currencies
 */
export const AVAILABLE_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
] as const;

/**
 * Onboarding steps definition
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'store-basics',
    number: 1,
    title: 'Store Basics',
    description: 'Set up your store name, logo, and contact information',
    required: true,
    canSkip: false,
    estimatedTime: '2 min',
  },
  {
    id: 'currency-tax',
    number: 2,
    title: 'Currency & Tax',
    description: 'Configure your pricing currency and tax settings',
    required: true,
    canSkip: false,
    estimatedTime: '1 min',
  },
  {
    id: 'shipping',
    number: 3,
    title: 'Shipping',
    description: 'Set up shipping options and rates',
    required: false,
    canSkip: true,
    estimatedTime: '2 min',
  },
  {
    id: 'payments',
    number: 4,
    title: 'Payments',
    description: 'Connect a payment provider to accept orders',
    required: false,
    canSkip: true,
    estimatedTime: '3 min',
  },
  {
    id: 'first-product',
    number: 5,
    title: 'First Product',
    description: 'Add your first product to the store',
    required: false,
    canSkip: true,
    estimatedTime: '2 min',
  },
  {
    id: 'launch',
    number: 6,
    title: 'Ready to Launch',
    description: 'Review your setup and launch your store',
    required: true,
    canSkip: false,
    estimatedTime: '1 min',
  },
];

/**
 * Default onboarding data
 */
export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  storeBasics: {
    storeName: '',
    contactEmail: '',
  },
  currencyTax: {
    currency: 'USD',
    currencySymbol: '$',
    currencyPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    taxEnabled: false,
    taxRate: 0,
    taxIncludedInPrice: false,
  },
  shipping: {
    shippingEnabled: true,
    freeShippingEnabled: false,
    shippingConfiguredLater: false,
  },
  payments: {
    paymentProviders: [],
    manualOrdersEnabled: true,
    paymentsConfiguredLater: false,
  },
};
