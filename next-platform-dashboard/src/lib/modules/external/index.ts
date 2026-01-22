/**
 * Phase EM-31: External Integration Module
 * Export all external integration services
 */

// Domain Service
export {
  DomainService,
  checkOriginAllowed,
  type AllowedDomain,
  type AddDomainInput,
  type UpdateDomainInput,
  type VerificationResult
} from './domain-service';

// OAuth Service
export {
  OAuthService,
  createAuthorizationUrl,
  type OAuthClient,
  type AccessToken,
  type TokenPayload,
  type CreateClientInput,
  type AuthCodeRequest
} from './oauth-service';

// CORS Middleware
export {
  corsMiddleware,
  addCorsHeaders,
  createPreflightResponse,
  createCorsErrorResponse,
  checkRateLimit,
  applyRateLimit,
  logExternalRequest,
  externalApiMiddleware,
  type CorsConfig,
  type CorsResult,
  type ExternalApiMiddlewareOptions
} from './cors-middleware';

// Webhook Service
export {
  WebhookService,
  WebhookEvents,
  type Webhook,
  type WebhookDelivery,
  type CreateWebhookInput,
  type UpdateWebhookInput,
  type WebhookEventType
} from './webhook-service';

// Module Access Helper
export { getModuleAndVerifyAccess } from './module-access';
