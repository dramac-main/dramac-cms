/**
 * Structured event logging for the portal.
 *
 * Every portal code path that touches tenant data should emit one structured
 * log event per operation. Events are JSON-stringified so Vercel and other
 * aggregators can parse them without a log schema.
 *
 * Events are intentionally cheap and synchronous (stdout only). The audit log
 * is a separate, persistent trail (see `./audit-log.ts`).
 */

export type PortalLogLevel = "debug" | "info" | "warn" | "error";

export interface PortalLogEvent {
  /** Stable identifier for the event category, e.g. "portal.dal.sites.list". */
  event: string;
  level?: PortalLogLevel;
  /** Tenant scope. */
  agencyId?: string | null;
  clientId?: string | null;
  siteId?: string | null;
  /** Acting auth user (may be an impersonator). */
  authUserId?: string | null;
  isImpersonation?: boolean;
  /** Operation outcome. */
  ok?: boolean;
  /** Wall-clock duration in milliseconds. */
  durationMs?: number;
  /** Optional structured context. Values must be JSON-serializable. */
  metadata?: Record<string, unknown>;
  /** Error message, if any. Do NOT attach the raw Error object. */
  error?: string;
}

/**
 * Emit a structured portal event. Never throws.
 */
export function logPortalEvent(ev: PortalLogEvent): void {
  const level: PortalLogLevel =
    ev.level ?? (ev.ok === false ? "error" : "info");

  const payload = {
    ts: new Date().toISOString(),
    level,
    scope: "portal",
    event: ev.event,
    ok: ev.ok ?? true,
    agencyId: ev.agencyId ?? null,
    clientId: ev.clientId ?? null,
    siteId: ev.siteId ?? null,
    authUserId: ev.authUserId ?? null,
    isImpersonation: ev.isImpersonation ?? false,
    durationMs: ev.durationMs ?? null,
    error: ev.error ?? null,
    metadata: ev.metadata ?? {},
  };

  try {
    const line = JSON.stringify(payload);
    switch (level) {
      case "error":
        console.error(line);
        break;
      case "warn":
        console.warn(line);
        break;
      case "debug":
        if (process.env.NODE_ENV !== "production") console.debug(line);
        break;
      default:
        console.info(line);
    }
  } catch {
    // Structured logging must never break the request.
  }
}

/**
 * Wrap an async operation with a portal event + duration measurement.
 * The wrapped function's result is returned untouched.
 */
export async function withPortalEvent<T>(
  event: string,
  ctx: Omit<PortalLogEvent, "event" | "ok" | "durationMs" | "error">,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    logPortalEvent({
      ...ctx,
      event,
      ok: true,
      durationMs: Date.now() - start,
    });
    return result;
  } catch (err) {
    logPortalEvent({
      ...ctx,
      event,
      ok: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
