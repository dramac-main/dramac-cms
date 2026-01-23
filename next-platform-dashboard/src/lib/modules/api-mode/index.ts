/**
 * Phase EM-33: API-Only Mode
 * 
 * Export all API mode components for module headless/API access
 * 
 * @see phases/enterprise-modules/PHASE-EM-33-API-ONLY-MODE.md
 */

// REST API Generator
export {
  RESTAPIGenerator,
  createRESTAPI,
  type APIConfig,
  type EntityConfig,
  type FieldConfig,
  type FieldType,
  type ValidationRule,
  type RelationConfig,
  type PaginationParams,
  type PaginatedResponse,
  type APIResponse,
  type ConsumerContext
} from './rest-api-generator';

// GraphQL Generator
export {
  GraphQLSchemaGenerator,
  createGraphQLSchema,
  type GraphQLSchemaOptions,
  type GeneratedSchema
} from './graphql-generator';

// SDK Generator
export {
  SDKGenerator,
  createSDKGenerator,
  type SDKLanguage,
  type SDKOptions,
  type GeneratedSDK
} from './sdk-generator';

// API Documentation Generator
export {
  APIDocsGenerator,
  createAPIDocsGenerator,
  type DocsOptions,
  type OpenAPISpec
} from './docs-generator';

// Consumer Service
export {
  APIConsumerService,
  createAPIConsumerService,
  type APIConsumer,
  type CreateConsumerInput,
  type UpdateConsumerInput,
  type RateLimitStatus,
  type ValidatedConsumer,
  type ConsumerUsageStats
} from './consumer-service';

// Webhook Delivery Service
export {
  WebhookDeliveryService,
  createWebhookDeliveryService,
  type WebhookDelivery,
  type WebhookConfig,
  type DeliveryResult
} from './webhook-delivery';
