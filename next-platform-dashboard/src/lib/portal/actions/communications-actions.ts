"use server";

/**
 * Portal Communications page server actions.
 *
 * Cleanup operations over `portal_send_log` for the current
 * client × site. All actions go through the portal DAL so the
 * permission check and audit log are enforced uniformly.
 */

import { revalidatePath } from "next/cache";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { createPortalDAL } from "@/lib/portal/data-access";
import type { PortalSendState } from "@/lib/portal/communications-data-access";

async function dalForSite() {
  const user = await requirePortalAuth();
  const session = await getPortalSession();
  return createPortalDAL({
    user,
    isImpersonation: session.isImpersonating,
    impersonatorEmail: session.impersonatorEmail,
  });
}

function pathFor(siteId: string) {
  return `/portal/sites/${siteId}/communications`;
}

export async function deleteSendLogEntryAction(
  siteId: string,
  id: string,
): Promise<{ ok: true; deleted: number } | { ok: false; error: string }> {
  try {
    const dal = await dalForSite();
    const { deleted } = await dal.communications.sendLog.delete(siteId, id);
    revalidatePath(pathFor(siteId));
    return { ok: true, deleted };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function clearSendLogByStateAction(
  siteId: string,
  states: PortalSendState[],
): Promise<{ ok: true; deleted: number } | { ok: false; error: string }> {
  try {
    const dal = await dalForSite();
    const { deleted } = await dal.communications.sendLog.clearByState(
      siteId,
      states,
    );
    revalidatePath(pathFor(siteId));
    return { ok: true, deleted };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function clearSendLogOlderThanAction(
  siteId: string,
  olderThanDays: number,
): Promise<{ ok: true; deleted: number } | { ok: false; error: string }> {
  try {
    const dal = await dalForSite();
    const { deleted } = await dal.communications.sendLog.clearOlderThan(
      siteId,
      olderThanDays,
    );
    revalidatePath(pathFor(siteId));
    return { ok: true, deleted };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function refreshCommunicationsAction(
  siteId: string,
): Promise<void> {
  revalidatePath(pathFor(siteId));
}
