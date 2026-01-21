/**
 * @dramac/sdk - Main Entry Point
 * 
 * Official SDK for building Dramac modules
 */

import type { DramacModuleConfig } from './types/module';

// Re-export types
export * from './types';

// Re-export database utilities
export * from './database';

// Re-export auth utilities
export * from './auth';

// Re-export UI utilities
export * from './ui';

/**
 * Define a Dramac module configuration
 * 
 * @example
 * ```typescript
 * import { defineModule } from '@dramac/sdk';
 * 
 * export default defineModule({
 *   id: 'my-module',
 *   name: 'My Module',
 *   version: '1.0.0',
 *   description: 'A sample Dramac module',
 *   icon: 'Package',
 *   category: 'utility',
 *   type: 'app',
 *   entry: {
 *     dashboard: './src/Dashboard.tsx',
 *     settings: './src/Settings.tsx',
 *   },
 * });
 * ```
 */
export function defineModule(config: DramacModuleConfig): DramacModuleConfig {
  // Validate required fields
  if (!config.id) {
    throw new Error('Module id is required');
  }
  if (!config.name) {
    throw new Error('Module name is required');
  }
  if (!config.version) {
    throw new Error('Module version is required');
  }
  if (!config.entry || (!config.entry.dashboard && !config.entry.settings && !config.entry.embed)) {
    throw new Error('Module must have at least one entry point (dashboard, settings, or embed)');
  }

  // Set defaults
  return {
    ...config,
    type: config.type || 'app',
    category: config.category || 'utility',
    tags: config.tags || [],
    permissions: config.permissions || [],
    roles: config.roles || [],
    routes: config.routes || [],
    webhooks: config.webhooks || [],
  };
}

/**
 * Create an API route handler with context
 * 
 * @example
 * ```typescript
 * import { createHandler } from '@dramac/sdk';
 * 
 * export const get = createHandler(async (req, ctx) => {
 *   const items = await ctx.db.from('items').select();
 *   return { data: items };
 * });
 * ```
 */
export function createHandler<T>(
  handler: (
    req: Request,
    ctx: {
      moduleId: string;
      siteId: string;
      userId?: string;
      db: ReturnType<typeof import('./database').createModuleClient>;
      user: { id: string; email: string } | null;
      site: { id: string; name: string } | null;
    }
  ) => Promise<T>
): typeof handler {
  return handler;
}

/**
 * SDK version
 */
export const SDK_VERSION = '1.0.0';

/**
 * SDK configuration
 */
export interface SDKConfig {
  apiUrl?: string;
  debug?: boolean;
}

let sdkConfig: SDKConfig = {};

/**
 * Configure the SDK
 */
export function configure(config: SDKConfig): void {
  sdkConfig = { ...sdkConfig, ...config };
}

/**
 * Get current SDK configuration
 */
export function getConfig(): SDKConfig {
  return { ...sdkConfig };
}
