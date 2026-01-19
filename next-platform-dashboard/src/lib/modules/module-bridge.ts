/**
 * Module Bridge
 * 
 * Provides a secure communication layer between modules and the platform.
 * Handles API calls, storage, database access, and inter-module events.
 * 
 * @module module-bridge
 */

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

export interface BridgeMessage {
  type: BridgeMessageType;
  moduleId: string;
  requestId: string;
  payload: unknown;
  timestamp?: number;
}

export type BridgeMessageType =
  // API
  | "API_REQUEST"
  | "API_RESPONSE"
  // Storage
  | "STORAGE_UPLOAD"
  | "STORAGE_DOWNLOAD"
  | "STORAGE_DELETE"
  | "STORAGE_LIST"
  | "STORAGE_GET_URL"
  | "STORAGE_RESPONSE"
  // Database
  | "DB_QUERY"
  | "DB_INSERT"
  | "DB_UPDATE"
  | "DB_DELETE"
  | "DB_UPSERT"
  | "DB_RESPONSE"
  // Events
  | "EVENT_EMIT"
  | "EVENT_SUBSCRIBE"
  | "EVENT_UNSUBSCRIBE"
  | "EVENT_RECEIVED"
  // Settings
  | "SETTINGS_GET"
  | "SETTINGS_SET"
  | "SETTINGS_RESPONSE"
  // Secrets
  | "SECRET_GET"
  | "SECRET_SET"
  | "SECRET_DELETE"
  | "SECRET_RESPONSE"
  // Navigation
  | "NAVIGATE"
  | "OPEN_MODAL"
  | "CLOSE_MODAL"
  | "SHOW_TOAST"
  // Platform
  | "GET_CONTEXT"
  | "CONTEXT_RESPONSE"
  // Error
  | "ERROR";

export interface ModuleContext {
  moduleId: string;
  siteId?: string;
  clientId?: string;
  agencyId?: string;
  userId?: string;
  settings: Record<string, unknown>;
  permissions: string[];
  environment: "development" | "staging" | "production";
}

export interface BridgeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

// Permission constants
export const MODULE_PERMISSIONS = {
  API_CALL: "api:call",
  STORAGE_READ: "storage:read",
  STORAGE_WRITE: "storage:write",
  DB_READ: "db:read",
  DB_WRITE: "db:write",
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",
  SECRETS_READ: "secrets:read",
  SECRETS_WRITE: "secrets:write",
  EVENTS_EMIT: "events:emit",
  EVENTS_SUBSCRIBE: "events:subscribe",
  NAVIGATION: "navigation",
} as const;

// ============================================================================
// Module Bridge Factory
// ============================================================================

/**
 * Create a module bridge instance for server-side handling
 */
export function createModuleBridge(context: ModuleContext) {
  return {
    context,
    
    /**
     * Handle incoming bridge message
     */
    async handleMessage(message: BridgeMessage): Promise<BridgeMessage> {
      const { type, payload, requestId, moduleId } = message;

      // Validate module has permission
      if (moduleId !== context.moduleId) {
        return createErrorResponse(requestId, moduleId, "Module mismatch", "MODULE_MISMATCH");
      }

      try {
        switch (type) {
          case "API_REQUEST":
            return await handleApiRequest(payload, context, requestId, moduleId);
          
          case "STORAGE_UPLOAD":
          case "STORAGE_DOWNLOAD":
          case "STORAGE_DELETE":
          case "STORAGE_LIST":
          case "STORAGE_GET_URL":
            return await handleStorageRequest(type, payload, context, requestId, moduleId);
          
          case "DB_QUERY":
          case "DB_INSERT":
          case "DB_UPDATE":
          case "DB_DELETE":
          case "DB_UPSERT":
            return await handleDatabaseRequest(type, payload, context, requestId, moduleId);
          
          case "SETTINGS_GET":
          case "SETTINGS_SET":
            return await handleSettingsRequest(type, payload, context, requestId, moduleId);
          
          case "SECRET_GET":
          case "SECRET_SET":
          case "SECRET_DELETE":
            return await handleSecretsRequest(type, payload, context, requestId, moduleId);
          
          case "EVENT_EMIT":
          case "EVENT_SUBSCRIBE":
          case "EVENT_UNSUBSCRIBE":
            return await handleEventRequest(type, payload, context, requestId, moduleId);
          
          case "GET_CONTEXT":
            return createSuccessResponse(requestId, moduleId, "CONTEXT_RESPONSE", {
              siteId: context.siteId,
              clientId: context.clientId,
              agencyId: context.agencyId,
              environment: context.environment,
              permissions: context.permissions,
            });
          
          default:
            return createErrorResponse(requestId, moduleId, `Unknown message type: ${type}`, "UNKNOWN_TYPE");
        }
      } catch (error) {
        console.error(`[ModuleBridge] Error handling ${type}:`, error);
        return createErrorResponse(
          requestId, 
          moduleId, 
          error instanceof Error ? error.message : "Internal error",
          "INTERNAL_ERROR"
        );
      }
    },

    /**
     * Check if module has a specific permission
     */
    hasPermission(permission: string): boolean {
      return context.permissions.includes(permission);
    },
  };
}

// ============================================================================
// Request Handlers
// ============================================================================

/**
 * Handle API requests from module
 */
async function handleApiRequest(
  payload: unknown,
  context: ModuleContext,
  requestId: string,
  moduleId: string
): Promise<BridgeMessage> {
  const { endpoint, method, data, headers } = payload as {
    endpoint: string;
    method?: string;
    data?: unknown;
    headers?: Record<string, string>;
  };

  // Check permission
  if (!context.permissions.includes(MODULE_PERMISSIONS.API_CALL)) {
    return createErrorResponse(requestId, moduleId, "Permission denied: api:call", "PERMISSION_DENIED");
  }

  // Validate endpoint
  if (!endpoint || typeof endpoint !== "string") {
    return createErrorResponse(requestId, moduleId, "Invalid endpoint", "INVALID_ENDPOINT");
  }

  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/modules/${moduleId}${normalizedEndpoint}`,
      {
        method: method || "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Module-Context": JSON.stringify({
            siteId: context.siteId,
            clientId: context.clientId,
            agencyId: context.agencyId,
            userId: context.userId,
          }),
          "X-Module-Id": moduleId,
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      }
    );

    let result: unknown;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      result = await response.json();
    } else {
      result = await response.text();
    }

    return {
      type: "API_RESPONSE",
      moduleId,
      requestId,
      payload: {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: result,
        headers: Object.fromEntries(response.headers.entries()),
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    return createErrorResponse(
      requestId, 
      moduleId, 
      error instanceof Error ? error.message : "API call failed",
      "API_ERROR"
    );
  }
}

/**
 * Handle storage requests from module
 */
async function handleStorageRequest(
  type: BridgeMessageType,
  payload: unknown,
  context: ModuleContext,
  requestId: string,
  moduleId: string
): Promise<BridgeMessage> {
  const isReadOperation = type === "STORAGE_LIST" || type === "STORAGE_DOWNLOAD" || type === "STORAGE_GET_URL";
  const requiredPermission = isReadOperation 
    ? MODULE_PERMISSIONS.STORAGE_READ 
    : MODULE_PERMISSIONS.STORAGE_WRITE;
  
  if (!context.permissions.includes(requiredPermission)) {
    return createErrorResponse(requestId, moduleId, `Permission denied: ${requiredPermission}`, "PERMISSION_DENIED");
  }

  if (!context.siteId) {
    return createErrorResponse(requestId, moduleId, "Site context required for storage operations", "NO_SITE_CONTEXT");
  }

  const supabase = await createClient();
  const bucketName = `module-${moduleId.replace(/-/g, "_")}-${context.siteId}`;

  try {
    const payloadData = payload as Record<string, unknown>;

    switch (type) {
      case "STORAGE_LIST": {
        const path = (payloadData.path as string) || "";
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list(path, {
            limit: (payloadData.limit as number) || 100,
            offset: (payloadData.offset as number) || 0,
            sortBy: payloadData.sortBy as { column: string; order: string } | undefined,
          });
        
        if (error) throw error;
        
        return createSuccessResponse(requestId, moduleId, "STORAGE_RESPONSE", {
          files: data,
          path,
        });
      }
      
      case "STORAGE_UPLOAD": {
        const { path, file, contentType, upsert } = payloadData as {
          path: string;
          file: Blob | ArrayBuffer | string;
          contentType?: string;
          upsert?: boolean;
        };
        
        if (!path) {
          return createErrorResponse(requestId, moduleId, "Path is required for upload", "INVALID_PATH");
        }
        
        // Check storage quota
        const quotaCheck = await checkStorageQuota(moduleId, context.siteId!, supabase);
        if (!quotaCheck.allowed) {
          return createErrorResponse(requestId, moduleId, quotaCheck.message, "QUOTA_EXCEEDED");
        }
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(path, file, { 
            contentType,
            upsert: upsert || false,
          });
        
        if (error) throw error;
        
        // Update storage usage
        await updateStorageUsage(moduleId, context.siteId!, supabase);
        
        return createSuccessResponse(requestId, moduleId, "STORAGE_RESPONSE", {
          path: data.path,
          id: data.id,
        });
      }
      
      case "STORAGE_DOWNLOAD": {
        const path = payloadData.path as string;
        if (!path) {
          return createErrorResponse(requestId, moduleId, "Path is required for download", "INVALID_PATH");
        }
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(path);
        
        if (error) throw error;
        
        // Convert Blob to base64 for transmission
        const arrayBuffer = await data.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        
        return createSuccessResponse(requestId, moduleId, "STORAGE_RESPONSE", {
          data: base64,
          contentType: data.type,
          size: data.size,
        });
      }
      
      case "STORAGE_DELETE": {
        const paths = payloadData.paths as string[] || [payloadData.path as string];
        if (!paths || paths.length === 0) {
          return createErrorResponse(requestId, moduleId, "Path(s) required for delete", "INVALID_PATH");
        }
        
        const { error } = await supabase.storage
          .from(bucketName)
          .remove(paths);
        
        if (error) throw error;
        
        // Update storage usage
        await updateStorageUsage(moduleId, context.siteId!, supabase);
        
        return createSuccessResponse(requestId, moduleId, "STORAGE_RESPONSE", {
          deleted: paths,
        });
      }
      
      case "STORAGE_GET_URL": {
        const path = payloadData.path as string;
        const expiresIn = (payloadData.expiresIn as number) || 3600; // 1 hour default
        
        if (!path) {
          return createErrorResponse(requestId, moduleId, "Path is required", "INVALID_PATH");
        }
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(path, expiresIn);
        
        if (error) throw error;
        
        return createSuccessResponse(requestId, moduleId, "STORAGE_RESPONSE", {
          signedUrl: data.signedUrl,
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
        });
      }
      
      default:
        return createErrorResponse(requestId, moduleId, "Unknown storage operation", "UNKNOWN_OPERATION");
    }
  } catch (error) {
    return createErrorResponse(
      requestId, 
      moduleId, 
      error instanceof Error ? error.message : "Storage operation failed",
      "STORAGE_ERROR"
    );
  }
}

/**
 * Handle database requests from module
 */
async function handleDatabaseRequest(
  type: BridgeMessageType,
  payload: unknown,
  context: ModuleContext,
  requestId: string,
  moduleId: string
): Promise<BridgeMessage> {
  const isReadOperation = type === "DB_QUERY";
  const requiredPermission = isReadOperation ? MODULE_PERMISSIONS.DB_READ : MODULE_PERMISSIONS.DB_WRITE;
  
  if (!context.permissions.includes(requiredPermission)) {
    return createErrorResponse(requestId, moduleId, `Permission denied: ${requiredPermission}`, "PERMISSION_DENIED");
  }

  if (!context.siteId) {
    return createErrorResponse(requestId, moduleId, "Site context required for database operations", "NO_SITE_CONTEXT");
  }

  const supabase = await createClient();

  // Modules use the generic module_data table
  const tableName = "module_data";
  const payloadData = payload as Record<string, unknown>;

  try {
    switch (type) {
      case "DB_QUERY": {
        const { dataKey, filters, orderBy, limit, offset } = payloadData as {
          dataKey?: string;
          filters?: Record<string, unknown>;
          orderBy?: { column: string; ascending?: boolean };
          limit?: number;
          offset?: number;
        };
        
        // Use type assertion for Phase 81C tables
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
          .from(tableName)
          .select("*")
          .eq("module_id", moduleId)
          .eq("site_id", context.siteId);
        
        if (dataKey) {
          query = query.eq("data_key", dataKey);
        }
        
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            if (key === "data_key") {
              query = query.eq("data_key", value);
            }
          }
        }
        
        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
        }
        
        if (limit) query = query.limit(limit);
        if (offset) query = query.range(offset, offset + (limit || 10) - 1);
        
        const { data, error, count } = await query;
        if (error) throw error;
        
        return createSuccessResponse(requestId, moduleId, "DB_RESPONSE", {
          records: data,
          count,
        });
      }
      
      case "DB_INSERT": {
        const { dataKey, value, expiresAt } = payloadData as {
          dataKey: string;
          value: unknown;
          expiresAt?: string;
        };
        
        if (!dataKey) {
          return createErrorResponse(requestId, moduleId, "dataKey is required", "INVALID_DATA_KEY");
        }
        
        const record = {
          module_id: moduleId,
          site_id: context.siteId,
          data_key: dataKey,
          data_value: value,
          data_type: typeof value === "object" ? "json" : typeof value,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Use type assertion for Phase 81C tables
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from(tableName)
          .insert(record)
          .select()
          .single();
        
        if (error) throw error;
        
        return createSuccessResponse(requestId, moduleId, "DB_RESPONSE", {
          record: data,
        });
      }
      
      case "DB_UPDATE": {
        const { dataKey, value, id } = payloadData as {
          dataKey?: string;
          value: unknown;
          id?: string;
        };
        
        // Use type assertion for Phase 81C tables
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
          .from(tableName)
          .update({
            data_value: value,
            updated_at: new Date().toISOString(),
          })
          .eq("module_id", moduleId)
          .eq("site_id", context.siteId);
        
        if (id) {
          query = query.eq("id", id);
        } else if (dataKey) {
          query = query.eq("data_key", dataKey);
        } else {
          return createErrorResponse(requestId, moduleId, "Either id or dataKey is required", "INVALID_PARAMS");
        }
        
        const { data, error } = await query.select();
        if (error) throw error;
        
        return createSuccessResponse(requestId, moduleId, "DB_RESPONSE", {
          records: data,
          updated: data?.length || 0,
        });
      }
      
      case "DB_DELETE": {
        const { dataKey, id } = payloadData as {
          dataKey?: string;
          id?: string;
        };
        
        // Use type assertion for Phase 81C tables
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
          .from(tableName)
          .delete()
          .eq("module_id", moduleId)
          .eq("site_id", context.siteId);
        
        if (id) {
          query = query.eq("id", id);
        } else if (dataKey) {
          query = query.eq("data_key", dataKey);
        } else {
          return createErrorResponse(requestId, moduleId, "Either id or dataKey is required", "INVALID_PARAMS");
        }
        
        const { error, count } = await query;
        if (error) throw error;
        
        return createSuccessResponse(requestId, moduleId, "DB_RESPONSE", {
          deleted: count,
        });
      }
      
      case "DB_UPSERT": {
        const { dataKey, value, expiresAt } = payloadData as {
          dataKey: string;
          value: unknown;
          expiresAt?: string;
        };
        
        if (!dataKey) {
          return createErrorResponse(requestId, moduleId, "dataKey is required", "INVALID_DATA_KEY");
        }
        
        const record = {
          module_id: moduleId,
          site_id: context.siteId,
          data_key: dataKey,
          data_value: value,
          data_type: typeof value === "object" ? "json" : typeof value,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        };
        
        // Use type assertion for Phase 81C tables
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from(tableName)
          .upsert(record, { onConflict: "module_id,site_id,data_key" })
          .select()
          .single();
        
        if (error) throw error;
        
        return createSuccessResponse(requestId, moduleId, "DB_RESPONSE", {
          record: data,
        });
      }
      
      default:
        return createErrorResponse(requestId, moduleId, "Unknown database operation", "UNKNOWN_OPERATION");
    }
  } catch (error) {
    return createErrorResponse(
      requestId, 
      moduleId, 
      error instanceof Error ? error.message : "Database operation failed",
      "DB_ERROR"
    );
  }
}

/**
 * Handle settings requests from module
 */
async function handleSettingsRequest(
  type: BridgeMessageType,
  payload: unknown,
  context: ModuleContext,
  requestId: string,
  moduleId: string
): Promise<BridgeMessage> {
  try {
    if (type === "SETTINGS_GET") {
      if (!context.permissions.includes(MODULE_PERMISSIONS.SETTINGS_READ)) {
        return createErrorResponse(requestId, moduleId, "Permission denied: settings:read", "PERMISSION_DENIED");
      }
      
      return createSuccessResponse(requestId, moduleId, "SETTINGS_RESPONSE", {
        settings: context.settings,
      });
    }
    
    if (type === "SETTINGS_SET") {
      if (!context.permissions.includes(MODULE_PERMISSIONS.SETTINGS_WRITE)) {
        return createErrorResponse(requestId, moduleId, "Permission denied: settings:write", "PERMISSION_DENIED");
      }
      
      if (!context.siteId) {
        return createErrorResponse(requestId, moduleId, "Site context required", "NO_SITE_CONTEXT");
      }
      
      const payloadData = payload as { settings: Record<string, unknown> };
      const { settings } = payloadData;
      
      const supabase = await createClient();
      
      // Convert settings to JSON-compatible type
      const jsonSettings = JSON.parse(JSON.stringify(settings));
      
      // Update site_module_installations settings
      const { error } = await supabase
        .from("site_module_installations")
        .update({
          settings: jsonSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("site_id", context.siteId)
        .eq("module_id", moduleId);
      
      if (error) throw error;
      
      return createSuccessResponse(requestId, moduleId, "SETTINGS_RESPONSE", {
        success: true,
      });
    }
    
    return createErrorResponse(requestId, moduleId, "Unknown settings operation", "UNKNOWN_OPERATION");
  } catch (error) {
    return createErrorResponse(
      requestId, 
      moduleId, 
      error instanceof Error ? error.message : "Settings operation failed",
      "SETTINGS_ERROR"
    );
  }
}

/**
 * Handle secrets requests from module
 */
async function handleSecretsRequest(
  type: BridgeMessageType,
  payload: unknown,
  context: ModuleContext,
  requestId: string,
  moduleId: string
): Promise<BridgeMessage> {
  if (!context.siteId) {
    return createErrorResponse(requestId, moduleId, "Site context required for secrets", "NO_SITE_CONTEXT");
  }

  const supabase = await createClient();
  const payloadData = payload as Record<string, unknown>;

  try {
    switch (type) {
      case "SECRET_GET": {
        if (!context.permissions.includes(MODULE_PERMISSIONS.SECRETS_READ)) {
          return createErrorResponse(requestId, moduleId, "Permission denied: secrets:read", "PERMISSION_DENIED");
        }
        
        const { secretName } = payloadData as { secretName: string };
        if (!secretName) {
          return createErrorResponse(requestId, moduleId, "secretName is required", "INVALID_SECRET_NAME");
        }
        
        // Use type assertion for Phase 81C table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("module_secrets")
          .select("encrypted_value")
          .eq("module_id", moduleId)
          .eq("site_id", context.siteId)
          .eq("secret_name", secretName)
          .single();
        
        if (error && error.code !== "PGRST116") throw error;
        
        // In production, decrypt the value here
        // For now, return the encrypted value (should be decrypted server-side)
        return createSuccessResponse(requestId, moduleId, "SECRET_RESPONSE", {
          exists: !!data,
          // Don't send actual secret value to module for security
          // Module should use server-side API to use secrets
        });
      }
      
      case "SECRET_SET": {
        if (!context.permissions.includes(MODULE_PERMISSIONS.SECRETS_WRITE)) {
          return createErrorResponse(requestId, moduleId, "Permission denied: secrets:write", "PERMISSION_DENIED");
        }
        
        const { secretName, value } = payloadData as { secretName: string; value: string };
        if (!secretName || !value) {
          return createErrorResponse(requestId, moduleId, "secretName and value are required", "INVALID_PARAMS");
        }
        
        // In production, encrypt the value here
        const encryptedValue = Buffer.from(value).toString("base64"); // Simple encoding for demo
        
        // Use type assertion for Phase 81C table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("module_secrets")
          .upsert({
            module_id: moduleId,
            site_id: context.siteId,
            secret_name: secretName,
            encrypted_value: encryptedValue,
            created_by: context.userId,
            updated_at: new Date().toISOString(),
          }, { onConflict: "module_id,site_id,secret_name" });
        
        if (error) throw error;
        
        return createSuccessResponse(requestId, moduleId, "SECRET_RESPONSE", {
          success: true,
        });
      }
      
      case "SECRET_DELETE": {
        if (!context.permissions.includes(MODULE_PERMISSIONS.SECRETS_WRITE)) {
          return createErrorResponse(requestId, moduleId, "Permission denied: secrets:write", "PERMISSION_DENIED");
        }
        
        const { secretName } = payloadData as { secretName: string };
        if (!secretName) {
          return createErrorResponse(requestId, moduleId, "secretName is required", "INVALID_SECRET_NAME");
        }
        
        // Use type assertion for Phase 81C table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("module_secrets")
          .delete()
          .eq("module_id", moduleId)
          .eq("site_id", context.siteId)
          .eq("secret_name", secretName);
        
        if (error) throw error;
        
        return createSuccessResponse(requestId, moduleId, "SECRET_RESPONSE", {
          success: true,
        });
      }
      
      default:
        return createErrorResponse(requestId, moduleId, "Unknown secrets operation", "UNKNOWN_OPERATION");
    }
  } catch (error) {
    return createErrorResponse(
      requestId, 
      moduleId, 
      error instanceof Error ? error.message : "Secrets operation failed",
      "SECRETS_ERROR"
    );
  }
}

/**
 * Handle event requests from module
 */
async function handleEventRequest(
  type: BridgeMessageType,
  payload: unknown,
  context: ModuleContext,
  requestId: string,
  moduleId: string
): Promise<BridgeMessage> {
  if (!context.siteId) {
    return createErrorResponse(requestId, moduleId, "Site context required for events", "NO_SITE_CONTEXT");
  }

  const supabase = await createClient();
  const payloadData = payload as Record<string, unknown>;

  try {
    switch (type) {
      case "EVENT_EMIT": {
        if (!context.permissions.includes(MODULE_PERMISSIONS.EVENTS_EMIT)) {
          return createErrorResponse(requestId, moduleId, "Permission denied: events:emit", "PERMISSION_DENIED");
        }
        
        const { eventName, targetModuleId, data } = payloadData as {
          eventName: string;
          targetModuleId?: string;
          data?: unknown;
        };
        
        if (!eventName) {
          return createErrorResponse(requestId, moduleId, "eventName is required", "INVALID_EVENT_NAME");
        }
        
        // Use type assertion for Phase 81C table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("module_events")
          .insert({
            event_name: eventName,
            source_module_id: moduleId,
            target_module_id: targetModuleId || null,
            site_id: context.siteId,
            payload: data || {},
            processed: false,
          });
        
        if (error) throw error;
        
        return createSuccessResponse(requestId, moduleId, "EVENT_RECEIVED", {
          success: true,
          eventName,
        });
      }
      
      case "EVENT_SUBSCRIBE": {
        if (!context.permissions.includes(MODULE_PERMISSIONS.EVENTS_SUBSCRIBE)) {
          return createErrorResponse(requestId, moduleId, "Permission denied: events:subscribe", "PERMISSION_DENIED");
        }
        
        // Subscriptions are handled client-side via SSE
        // This just validates the subscription is allowed
        return createSuccessResponse(requestId, moduleId, "EVENT_RECEIVED", {
          success: true,
          subscribed: true,
        });
      }
      
      case "EVENT_UNSUBSCRIBE": {
        return createSuccessResponse(requestId, moduleId, "EVENT_RECEIVED", {
          success: true,
          unsubscribed: true,
        });
      }
      
      default:
        return createErrorResponse(requestId, moduleId, "Unknown event operation", "UNKNOWN_OPERATION");
    }
  } catch (error) {
    return createErrorResponse(
      requestId, 
      moduleId, 
      error instanceof Error ? error.message : "Event operation failed",
      "EVENT_ERROR"
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function createSuccessResponse(
  requestId: string, 
  moduleId: string, 
  type: BridgeMessageType,
  data: unknown
): BridgeMessage {
  return {
    type,
    moduleId,
    requestId,
    payload: {
      success: true,
      data,
    },
    timestamp: Date.now(),
  };
}

function createErrorResponse(
  requestId: string, 
  moduleId: string, 
  message: string,
  errorCode: string
): BridgeMessage {
  return {
    type: "ERROR",
    moduleId,
    requestId,
    payload: {
      success: false,
      error: message,
      errorCode,
    },
    timestamp: Date.now(),
  };
}

async function checkStorageQuota(
  moduleId: string,
  siteId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ allowed: boolean; message: string }> {
  // Use type assertion for Phase 81C table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("module_storage_buckets")
    .select("max_size_bytes, used_size_bytes")
    .eq("module_id", moduleId)
    .eq("site_id", siteId)
    .single();
  
  if (!data) {
    // No quota record = use defaults
    return { allowed: true, message: "OK" };
  }
  
  const usedPercent = ((data.used_size_bytes || 0) / (data.max_size_bytes || 1)) * 100;
  if (usedPercent >= 100) {
    return { 
      allowed: false, 
      message: `Storage quota exceeded. Used: ${data.used_size_bytes} / ${data.max_size_bytes} bytes` 
    };
  }
  
  return { allowed: true, message: "OK" };
}

async function updateStorageUsage(
  moduleId: string,
  siteId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  // This would calculate actual storage usage from bucket
  // For now, just touch the record to update timestamp
  // Use type assertion for Phase 81C table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("module_storage_buckets")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("module_id", moduleId)
    .eq("site_id", siteId);
}

// ============================================================================
// Client-Side Bridge Helper
// ============================================================================

/**
 * Generate request ID for bridge messages
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a client-side bridge message
 */
export function createBridgeMessage(
  type: BridgeMessageType,
  moduleId: string,
  payload: unknown
): BridgeMessage {
  return {
    type,
    moduleId,
    requestId: generateRequestId(),
    payload,
    timestamp: Date.now(),
  };
}
