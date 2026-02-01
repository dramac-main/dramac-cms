// src/components/domains/index.ts
// Domain Components - Barrel Exports

// DM-04: Search & Registration Components
export { DomainSearch } from './domain-search';
export { DomainResults } from './domain-results';
export { DomainSuggestions } from './domain-suggestions';
export { DomainPricingCard } from './domain-pricing-card';
export { DomainCartComponent } from './domain-cart';
export { DomainCheckout } from './domain-checkout';
export { DomainContactForm, type ContactFormData } from './domain-contact-form';
export { DomainList } from './domain-list';
export { DomainFiltersComponent } from './domain-filters';

// DM-05: Management Dashboard Components
export { DomainStatusBadge } from './domain-status-badge';
export { DomainExpiryBadge, formatExpiryDate } from './domain-expiry-badge';
export { DomainDetailHeader } from './domain-detail-header';
export { DomainInfoCard } from './domain-info-card';
export { DomainNameservers } from './domain-nameservers';
export { DomainAutoRenew } from './domain-auto-renew';
export { DomainAssignment } from './domain-assignment';
export { DomainQuickActions } from './domain-quick-actions';
export { ExpiringDomainsWidget } from './expiring-domains-widget';
export { DomainOverviewCard } from './domain-overview-card';
