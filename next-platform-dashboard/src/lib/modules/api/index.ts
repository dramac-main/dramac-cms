/**
 * Module API Gateway - Barrel Export
 * 
 * Phase EM-12: Module API Gateway
 * 
 * This module exports all API-related functionality:
 * - API Gateway (request routing, auth, rate limiting)
 * - API Key Management (create, list, revoke keys)
 * - Route Registration (register, manage, document routes)
 * 
 * @see phases/enterprise-modules/PHASE-EM-12-MODULE-API-GATEWAY.md
 */

// =============================================================
// API GATEWAY
// =============================================================

export {
  handleModuleApiRequest,
  routeModuleAPI,
  listModuleAPIRoutes,
  hasModuleAPIRoute,
  validateAPIRoute,
  type GatewayContext,
  type AuthResult,
  type RateLimitResult,
  type ModuleAPIRequest,
  type ModuleAPIResponse
} from './module-api-gateway'

// =============================================================
// API KEY MANAGEMENT
// =============================================================

export {
  // Key operations
  createApiKey,
  listApiKeys,
  getApiKey,
  revokeApiKey,
  updateApiKey,
  regenerateApiKey,
  getApiKeyStats,
  
  // Scope utilities
  API_SCOPES,
  hasScope,
  
  // Validation
  isValidApiKeyFormat,
  maskApiKey,
  
  // Types
  type CreateApiKeyInput,
  type ApiKeyResult,
  type ApiKeyListItem,
  type ApiKeyStats
} from './api-key-service'

// =============================================================
// ROUTE REGISTRATION
// =============================================================

export {
  // Route registration
  registerModuleRoutes,
  registerRoute,
  registerProxyRoute,
  
  // Route management
  getModuleRoutes,
  deactivateRoute,
  activateRoute,
  deleteRoute,
  deactivateModuleRoutes,
  
  // OpenAPI generation
  generateModuleOpenApiSpec,
  generateModuleOpenApiYaml,
  
  // Validation
  validateRouteDefinition,
  
  // Helpers
  createCrudRoutes,
  
  // Types
  type RouteDefinition,
  type RegisteredRoute,
  type OpenAPISpec
} from './route-registration'
