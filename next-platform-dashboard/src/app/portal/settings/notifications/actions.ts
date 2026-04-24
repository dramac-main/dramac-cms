"use server";

import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { createPortalDAL } from "@/lib/portal/data-access";
import { revalidatePath } from "next/cache";

export interface ChannelPatch {
  inApp?: boolean;
  email?: boolean;
  push?: boolean;
}

export async function updateNotificationPreference(
  eventType: string,
  siteId: string | null,
  channels: ChannelPatch,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requirePortalAuth();
    const dal = createPortalDAL({
      user,
      isImpersonation: false,
      impersonatorEmail: null,
    });
    await dal.notifications.preferences.set(eventType, siteId, channels);
    revalidatePath("/portal/settings/notifications");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: message };
  }
}

export async function archiveNotifications(
  ids: string[],
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  try {
    const user = await requirePortalAuth();
    const dal = createPortalDAL({
      user,
      isImpersonation: false,
      impersonatorEmail: null,
    });
    const count = await dal.notifications.archive(ids);
    revalidatePath("/portal/notifications");
    return { ok: true, count };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: message };
  }
}
