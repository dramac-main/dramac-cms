/**
 * Notification Channel Resolver
 *
 * Reads per-template channel preferences from the site's notification settings
 * (stored as JSONB in mod_ecommod01_settings.notification_settings).
 *
 * Each NotificationTemplate can have:
 *   channels?: { email: boolean; inapp: boolean; chat: boolean }
 *
 * If channels is undefined OR the template doesn't exist in settings,
 * ALL channels default to ON (backwards compatible — no behaviour change
 * for sites that haven't customised their channel preferences yet).
 *
 * Used by business-notifications.ts to conditionally skip channels.
 */
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  NotificationChannels,
  NotificationTemplateType,
} from "@/modules/ecommerce/types/ecommerce-types";

// =============================================================================
// CACHE
// =============================================================================

interface CachedPrefs {
  /** templateType → channels. Only populated for templates with explicit channel config */
  channels: Map<string, NotificationChannels>;
  /** templateType → enabled. Tracks templates that are explicitly disabled */
  disabled: Set<string>;
  ts: number;
}

const cache = new Map<string, CachedPrefs>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes — matches email template resolver

// =============================================================================
// FETCH & CACHE
// =============================================================================

async function fetchPrefs(siteId: string): Promise<CachedPrefs> {
  const cached = cache.get(siteId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("mod_ecommod01_settings" as never)
    .select("notification_settings" as never)
    .eq("site_id" as never, siteId)
    .single();

  const channels = new Map<string, NotificationChannels>();
  const disabled = new Set<string>();

  const settings = (data as Record<string, unknown> | null)
    ?.notification_settings as
    | {
        templates?: Array<{
          type: string;
          enabled?: boolean;
          channels?: NotificationChannels;
        }>;
      }
    | undefined;

  if (settings?.templates) {
    for (const tpl of settings.templates) {
      if (tpl.enabled === false) {
        disabled.add(tpl.type);
      }
      if (tpl.channels) {
        channels.set(tpl.type, tpl.channels);
      }
    }
  }

  const prefs: CachedPrefs = { channels, disabled, ts: Date.now() };
  cache.set(siteId, prefs);
  return prefs;
}

// =============================================================================
// PUBLIC API
// =============================================================================

const ALL_ON: NotificationChannels = { email: true, inapp: true, chat: true };

/**
 * Get the channel preferences for a specific template type.
 * Returns { email, inapp, chat } booleans.
 *
 * If the template is disabled entirely, all channels return false.
 * If no channel config exists, all channels return true (default).
 */
export async function getChannelPrefs(
  siteId: string,
  templateType: NotificationTemplateType,
): Promise<NotificationChannels> {
  try {
    const prefs = await fetchPrefs(siteId);

    // Template disabled entirely → all channels off
    if (prefs.disabled.has(templateType)) {
      return { email: false, inapp: false, chat: false };
    }

    // Explicit channel config → use it
    const explicit = prefs.channels.get(templateType);
    if (explicit) return explicit;

    // No config → all on (backwards compatible)
    return ALL_ON;
  } catch (error) {
    console.error(
      "[ChannelResolver] Error fetching channel prefs, defaulting to all-on:",
      error,
    );
    return ALL_ON;
  }
}

/**
 * Convenience: should this template type send email?
 */
export async function shouldSendEmail(
  siteId: string,
  templateType: NotificationTemplateType,
): Promise<boolean> {
  const prefs = await getChannelPrefs(siteId, templateType);
  return prefs.email;
}

/**
 * Convenience: should this template type send in-app notification?
 */
export async function shouldSendInApp(
  siteId: string,
  templateType: NotificationTemplateType,
): Promise<boolean> {
  const prefs = await getChannelPrefs(siteId, templateType);
  return prefs.inapp;
}

/**
 * Invalidate the channel cache for a site.
 * Called when notification settings are updated.
 */
export async function invalidateChannelCache(siteId: string): Promise<void> {
  cache.delete(siteId);
}
