"use server";

/**
 * Portal Apps page server actions.
 *
 * Wraps the portal Apps DAL — install / uninstall / settings — for use
 * from the site Apps page UI. All actions go through `requirePortalAuth`
 * + `createPortalDAL` so permission gates and audit logging apply.
 */

import { revalidatePath } from "next/cache";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { createPortalDAL } from "@/lib/portal/data-access";

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
  return `/portal/sites/${siteId}/apps`;
}

export async function installAppAction(
  siteId: string,
  moduleId: string,
  settings?: Record<string, unknown>,
): Promise<
  { ok: true; installationId: string } | { ok: false; error: string }
> {
  try {
    const dal = await dalForSite();
    const result = await dal.apps.install(siteId, moduleId, settings);
    revalidatePath(pathFor(siteId));
    return { ok: true, installationId: result.installationId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function uninstallAppAction(
  siteId: string,
  moduleId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const dal = await dalForSite();
    await dal.apps.uninstall(siteId, moduleId);
    revalidatePath(pathFor(siteId));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function updateAppSettingsAction(
  siteId: string,
  installationId: string,
  settings: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const dal = await dalForSite();
    await dal.apps.updateSettings(siteId, installationId, settings);
    revalidatePath(pathFor(siteId));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
