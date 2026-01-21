/**
 * @dramac/sdk - Event Types
 * 
 * TypeScript definitions for module events and messaging
 */

/**
 * Base event structure
 */
export interface ModuleEvent<T = unknown> {
  id: string;
  type: string;
  moduleId: string;
  siteId: string;
  userId?: string;
  timestamp: Date;
  payload: T;
  metadata?: Record<string, unknown>;
}

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (event: ModuleEvent<T>) => void | Promise<void>;

/**
 * Event subscription configuration
 */
export interface EventSubscription {
  eventType: string;
  handler: EventHandler;
  filter?: EventFilter;
}

/**
 * Event filter for subscriptions
 */
export interface EventFilter {
  moduleId?: string;
  siteId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Platform events that modules can subscribe to
 */
export type PlatformEventType =
  | 'site.created'
  | 'site.updated'
  | 'site.deleted'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.login'
  | 'user.logout'
  | 'module.installed'
  | 'module.uninstalled'
  | 'module.enabled'
  | 'module.disabled'
  | 'module.configured'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'payment.completed'
  | 'payment.failed';

/**
 * Webhook event payload
 */
export interface WebhookEvent<T = unknown> {
  id: string;
  type: string;
  apiVersion: string;
  created: number;
  data: {
    object: T;
  };
  request?: {
    id: string;
    idempotencyKey?: string;
  };
}

/**
 * Real-time subscription message
 */
export interface RealtimeMessage<T = unknown> {
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  old?: T;
  new?: T;
  commitTimestamp: string;
}

/**
 * Event emitter interface
 */
export interface EventEmitter {
  emit<T>(eventType: string, payload: T): Promise<void>;
  on<T>(eventType: string, handler: EventHandler<T>): () => void;
  off(eventType: string, handler?: EventHandler): void;
  once<T>(eventType: string, handler: EventHandler<T>): () => void;
}

/**
 * Inter-module communication message
 */
export interface ModuleMessage<T = unknown> {
  from: string;
  to: string;
  type: string;
  payload: T;
  correlationId?: string;
  replyTo?: string;
}

/**
 * Message response
 */
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Background job definition
 */
export interface JobDefinition<T = unknown> {
  name: string;
  handler: (payload: T) => Promise<void>;
  retries?: number;
  timeout?: number;
  schedule?: string; // Cron expression
}

/**
 * Job execution status
 */
export interface JobStatus {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  result?: unknown;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  moduleId: string;
  siteId: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
