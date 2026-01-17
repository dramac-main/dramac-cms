/**
 * Webhook service for form submissions
 * Dispatches form data to configured webhook endpoints
 */

export interface WebhookPayload {
  event: "form.submission";
  timestamp: string;
  siteId: string;
  formId: string;
  submissionId: string;
  data: Record<string, unknown>;
  metadata: {
    pageUrl?: string;
    userAgent?: string;
    ipAddress?: string;
    submittedAt: string;
  };
}

export interface WebhookConfig {
  id: string;
  url: string;
  method: "POST" | "PUT";
  headers: Record<string, string>;
  secretKey?: string;
}

export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

/**
 * Dispatch webhook to a single endpoint
 */
export async function dispatchWebhook(
  config: WebhookConfig,
  payload: WebhookPayload
): Promise<WebhookResult> {
  const startTime = Date.now();

  try {
    // Generate signature if secret key is provided
    const signature = config.secretKey 
      ? await generateHmacSignature(payload, config.secretKey)
      : generateSimpleSignature(payload);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "DramaCMS-Webhook/1.0",
      "X-Webhook-Event": payload.event,
      "X-Webhook-Signature": signature,
      "X-Webhook-Timestamp": payload.timestamp,
      "X-Webhook-Delivery": payload.submissionId,
      ...config.headers,
    };

    const response = await fetch(config.url, {
      method: config.method,
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      statusCode: response.status,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        return {
          success: false,
          statusCode: 0,
          responseTime,
          error: "Request timed out after 30 seconds",
        };
      }
      return {
        success: false,
        statusCode: 0,
        responseTime,
        error: error.message,
      };
    }

    return {
      success: false,
      statusCode: 0,
      responseTime,
      error: "Unknown error occurred",
    };
  }
}

/**
 * Dispatch webhooks to multiple endpoints
 */
export async function dispatchWebhooks(
  configs: WebhookConfig[],
  payload: WebhookPayload
): Promise<Map<string, WebhookResult>> {
  const results = new Map<string, WebhookResult>();

  // Execute webhooks in parallel
  const promises = configs.map(async (config) => {
    const result = await dispatchWebhook(config, payload);
    results.set(config.id, result);
  });

  await Promise.allSettled(promises);

  return results;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
async function generateHmacSignature(
  payload: WebhookPayload,
  secretKey: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureHex = signatureArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  
  return `sha256=${signatureHex}`;
}

/**
 * Generate a simple hash signature (for when no secret is configured)
 */
function generateSimpleSignature(payload: WebhookPayload): string {
  const str = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `sha256=${Math.abs(hash).toString(16)}`;
}

/**
 * Verify webhook signature
 * Useful for implementing webhook receivers
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secretKey: string
): Promise<boolean> {
  if (!signature.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = signature.slice(7);
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const computed = await crypto.subtle.sign("HMAC", key, data);
  const computedArray = Array.from(new Uint8Array(computed));
  const computedHex = computedArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison to prevent timing attacks
  if (computedHex.length !== expectedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < computedHex.length; i++) {
    result |= computedHex.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Build webhook payload from form submission
 */
export function buildWebhookPayload(
  siteId: string,
  formId: string,
  submission: {
    id: string;
    data: Record<string, unknown>;
    page_url?: string;
    user_agent?: string;
    ip_address?: string;
    created_at: string;
  }
): WebhookPayload {
  return {
    event: "form.submission",
    timestamp: new Date().toISOString(),
    siteId,
    formId,
    submissionId: submission.id,
    data: submission.data,
    metadata: {
      pageUrl: submission.page_url,
      userAgent: submission.user_agent,
      ipAddress: submission.ip_address,
      submittedAt: submission.created_at,
    },
  };
}
