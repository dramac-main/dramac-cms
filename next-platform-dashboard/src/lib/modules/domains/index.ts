/**
 * Phase EM-32: Custom Domain Support
 * Module exports for domain management, routing, and white-label
 */

// Main Services
export { 
  CustomDomainService,
  encryptPrivateKey,
  decryptPrivateKey,
  type CustomDomain,
  type DomainStatus,
  type SSLStatus,
  type VerificationMethod,
  type DomainConfig,
  type WhiteLabelConfig,
  type DNSRecord,
  type SSLCertificate,
  type AddDomainInput,
  type ACMECertificate
} from './custom-domain-service';

export { 
  EdgeRouter,
  type RouteResult,
  type RequestLogEntry
} from './edge-router';

// Middleware
export { handleCustomDomain } from './middleware';

// Convenience re-exports
export { CustomDomainService as DomainService } from './custom-domain-service';
