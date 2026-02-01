// src/types/email.ts
// Public Email Types for Business Email Integration

export type EmailPlanType = 'eeliteus' | 'eelitein' | 'eeliteuk';

export type EmailOrderStatus = 
  | 'Active'
  | 'Pending'
  | 'Suspended'
  | 'Deleted'
  | 'InActive'
  | 'Expired';

export type EmailAccountStatus = 'active' | 'suspended' | 'deleted';

export interface EmailPlan {
  planKey: EmailPlanType;
  name: string;
  description: string;
  storage: number; // GB per account
  features: string[];
  pricing: {
    monthly: number;
    yearly: number;
  };
}

export const EMAIL_PLANS: EmailPlan[] = [
  {
    planKey: 'eeliteus',
    name: 'Business Email (US)',
    description: 'Professional email hosted in US datacenter',
    storage: 10,
    features: [
      '10GB storage per mailbox',
      'Custom email domain',
      'Mobile apps (iOS & Android)',
      'Calendar & contacts sync',
      'Spam & virus protection',
      '24/7 email support',
    ],
    pricing: {
      monthly: 1.50,
      yearly: 12.00,
    },
  },
  {
    planKey: 'eelitein',
    name: 'Business Email (India)',
    description: 'Professional email hosted in India datacenter',
    storage: 10,
    features: [
      '10GB storage per mailbox',
      'Custom email domain',
      'Mobile apps (iOS & Android)',
      'Calendar & contacts sync',
      'Spam & virus protection',
      '24/7 email support',
    ],
    pricing: {
      monthly: 1.50,
      yearly: 12.00,
    },
  },
  {
    planKey: 'eeliteuk',
    name: 'Business Email (UK)',
    description: 'Professional email hosted in UK datacenter',
    storage: 10,
    features: [
      '10GB storage per mailbox',
      'Custom email domain',
      'Mobile apps (iOS & Android)',
      'Calendar & contacts sync',
      'Spam & virus protection',
      '24/7 email support',
    ],
    pricing: {
      monthly: 1.50,
      yearly: 12.00,
    },
  },
];

export const WEBMAIL_URL = 'https://app.titan.email';

export const EMAIL_SUBSCRIPTION_PERIODS = [
  { months: 1, label: '1 Month' },
  { months: 3, label: '3 Months' },
  { months: 6, label: '6 Months' },
  { months: 12, label: '1 Year', recommended: true },
  { months: 24, label: '2 Years' },
  { months: 36, label: '3 Years' },
] as const;

export function getEmailStatusColor(status: EmailOrderStatus | EmailAccountStatus): string {
  switch (status) {
    case 'Active':
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Suspended':
    case 'suspended':
      return 'bg-orange-100 text-orange-800';
    case 'Deleted':
    case 'deleted':
      return 'bg-red-100 text-red-800';
    case 'InActive':
      return 'bg-gray-100 text-gray-800';
    case 'Expired':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function formatStorageSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}
