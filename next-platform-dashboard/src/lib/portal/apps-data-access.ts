import "server-only";

/**
 * Portal Apps DAL (Session 5).
 *
 * Per-site module install/uninstall surface. Wraps the existing
 * `installationService` functions (`installModule`, `uninstallModule`,
 * `updateModuleSettings`, `getSiteModuleInstallations`) and scopes
 * every call to the caller's site + client.
 *
 * Gated on `canEditContent` for both read and write. Agency-level
 * module catalog filtering is not applied here — the full site-level
 * portion of `MODULE_CATALOG` is returned; agency-only gating can be
 * layered on later if/when marketplace billing is added to portal.
 *
 * Billing / subscription flows (`agency_module_subscriptions`) stay on
 * the agency side. If a portal install hits a paywall, the underlying
 * service will reject and this DAL surfaces the error verbatim.
 */

import {
  checkPortalPermission,
  type PortalSiteScope,
} from "./permission-resolver";
import { auditPortalDenied, writePortalAudit } from "./audit-log";
import { withPortalEvent } from "./observability";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import { PortalAccessDeniedError, type PortalDALContext } from "./data-access";
import { MODULE_CATALOG } from "@/lib/modules/module-catalog";
import type { ModuleDefinition } from "@/lib/modules/module-types";
import {
  installModule as svcInstallModule,
  uninstallModule as svcUninstallModule,
  updateModuleSettings as svcUpdateSettings,
  getSiteModuleInstallations as svcGetSiteInstalls,
} from "@/lib/modules/services/installation-service";

const APPS_PERM = "canEditContent" as const;

async function requireScope(
  ctx: PortalDALContext,
  siteId: string,
): Promise<PortalSiteScope> {
  const result = await checkPortalPermission(ctx.user, siteId, APPS_PERM);
  if (!result.allowed) {
    await auditPortalDenied({
      authUserId: ctx.user.userId,
      clientId: ctx.user.clientId,
      agencyId: ctx.user.agencyId,
      siteId,
      action: `portal.permission.${APPS_PERM}`,
      permissionKey: APPS_PERM,
      reason: result.reason,
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError(
      result.reason === "site_not_found"
        ? "site_not_found"
        : "permission_denied",
      siteId,
      APPS_PERM,
    );
  }
  return result.scope!;
}

function finalizeAudit(
  ctx: PortalDALContext,
  siteId: string,
  action: string,
  resourceId: string | null,
  metadata?: Record<string, unknown>,
): void {
  writePortalAudit({
    authUserId: ctx.user.userId,
    clientId: ctx.user.clientId,
    agencyId: ctx.user.agencyId,
    siteId,
    isImpersonation: ctx.isImpersonation,
    impersonatorEmail: ctx.impersonatorEmail,
    action,
    resourceType: "module_installation",
    resourceId,
    permissionKey: APPS_PERM,
    metadata,
  }).catch(() => {});
}

function evtCtx(ctx: PortalDALContext, siteId: string) {
  return {
    agencyId: ctx.user.agencyId,
    clientId: ctx.user.clientId,
    authUserId: ctx.user.userId,
    siteId,
    isImpersonation: ctx.isImpersonation,
  };
}

function emit(
  siteId: string,
  eventType: string,
  ctx: PortalDALContext,
  payload: Record<string, unknown>,
  sourceEntityId: string,
): void {
  logAutomationEvent(
    siteId,
    eventType,
    {
      ...payload,
      source: "portal",
      actor_user_id: ctx.user.userId,
      is_impersonation: ctx.isImpersonation,
    },
    {
      sourceModule: "portal",
      sourceEntityType: "module_installation",
      sourceEntityId,
    },
  ).catch(() => {});
}

export interface PortalAppDefinition {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  status: string | null;
}

export interface PortalInstalledApp {
  installationId: string;
  moduleId: string;
  slug: string | null;
  name: string | null;
  enabled: boolean;
  settings: Record<string, unknown>;
  installedAt: string | null;
}

function mapCatalog(m: ModuleDefinition): PortalAppDefinition {
  return {
    id: m.id,
    slug: m.slug,
    name: m.name,
    description: (m as any).description ?? (m as any).shortDescription ?? null,
    category: (m as any).category ?? null,
    icon: (m as any).icon ?? null,
    status: (m as any).status ?? null,
  };
}

function mapInstalled(row: any): PortalInstalledApp {
  const moduleRef = (row.module as any) ?? (row.modules_v2 as any) ?? null;
  return {
    installationId: String(row.id),
    moduleId: String(row.module_id ?? moduleRef?.id ?? ""),
    slug: moduleRef?.slug ?? null,
    name: moduleRef?.name ?? null,
    enabled: row.enabled !== false,
    settings: (row.settings as Record<string, unknown>) ?? {},
    installedAt: row.created_at ?? row.installed_at ?? null,
  };
}

export interface PortalAppsNamespace {
  catalog: {
    list(siteId: string): Promise<PortalAppDefinition[]>;
    detail(
      siteId: string,
      idOrSlug: string,
    ): Promise<PortalAppDefinition | null>;
  };
  installed: {
    list(siteId: string): Promise<PortalInstalledApp[]>;
  };
  install(
    siteId: string,
    moduleId: string,
    settings?: Record<string, unknown>,
  ): Promise<{ installationId: string }>;
  uninstall(siteId: string, moduleId: string): Promise<{ uninstalled: true }>;
  updateSettings(
    siteId: string,
    installationId: string,
    settings: Record<string, unknown>,
  ): Promise<{ ok: true }>;
}

export function createAppsNamespace(
  ctx: PortalDALContext,
): PortalAppsNamespace {
  const catalog = {
    list: (siteId: string) =>
      withPortalEvent(
        "portal.dal.apps.catalog.list",
        evtCtx(ctx, siteId),
        async () => {
          await requireScope(ctx, siteId);
          finalizeAudit(ctx, siteId, "portal.apps.catalog.list", null);
          return MODULE_CATALOG.filter(
            (m: ModuleDefinition) =>
              (m as any).installLevels?.includes?.("site") ?? true,
          ).map(mapCatalog);
        },
      ),

    detail: (siteId: string, idOrSlug: string) =>
      withPortalEvent(
        "portal.dal.apps.catalog.detail",
        evtCtx(ctx, siteId),
        async () => {
          await requireScope(ctx, siteId);
          const m = MODULE_CATALOG.find(
            (m) => m.id === idOrSlug || m.slug === idOrSlug,
          );
          finalizeAudit(ctx, siteId, "portal.apps.catalog.detail", idOrSlug);
          return m ? mapCatalog(m) : null;
        },
      ),
  };

  const installed = {
    list: (siteId: string) =>
      withPortalEvent(
        "portal.dal.apps.installed.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const rows = await svcGetSiteInstalls(scope.siteId);
          finalizeAudit(ctx, siteId, "portal.apps.installed.list", null, {
            count: Array.isArray(rows) ? rows.length : 0,
          });
          return (rows as any[]).map(mapInstalled);
        },
      ),
  };

  return {
    catalog,
    installed,

    install: (
      siteId: string,
      moduleId: string,
      settings?: Record<string, unknown>,
    ) =>
      withPortalEvent(
        "portal.dal.apps.install",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const result = await svcInstallModule({
            moduleId,
            installLevel: "site",
            agencyId: scope.agencyId,
            clientId: scope.clientId,
            siteId: scope.siteId,
            settings: settings ?? {},
            installedBy: ctx.user.userId,
          });
          if (!result.success || !result.installationId) {
            throw new Error(
              `[portal][apps] install: ${result.error ?? "failed"}`,
            );
          }
          finalizeAudit(
            ctx,
            siteId,
            "portal.apps.module.installed",
            result.installationId,
            { module_id: moduleId },
          );
          emit(
            scope.siteId,
            "apps.module.installed",
            ctx,
            {
              module_id: moduleId,
              installation_id: result.installationId,
            },
            result.installationId,
          );
          return { installationId: result.installationId };
        },
      ),

    uninstall: (siteId: string, moduleId: string) =>
      withPortalEvent(
        "portal.dal.apps.uninstall",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const result = await svcUninstallModule({
            moduleId,
            installLevel: "site",
            agencyId: scope.agencyId,
            clientId: scope.clientId,
            siteId: scope.siteId,
          });
          if (!result.success) {
            throw new Error(
              `[portal][apps] uninstall: ${result.error ?? "failed"}`,
            );
          }
          finalizeAudit(
            ctx,
            siteId,
            "portal.apps.module.uninstalled",
            moduleId,
            { module_id: moduleId },
          );
          emit(
            scope.siteId,
            "apps.module.uninstalled",
            ctx,
            { module_id: moduleId },
            moduleId,
          );
          return { uninstalled: true as const };
        },
      ),

    updateSettings: (
      siteId: string,
      installationId: string,
      settings: Record<string, unknown>,
    ) =>
      withPortalEvent(
        "portal.dal.apps.updateSettings",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const result = await svcUpdateSettings({
            installationId,
            installLevel: "site",
            settings,
          });
          if (!result || (result as any).success === false) {
            throw new Error(
              `[portal][apps] updateSettings: ${(result as any)?.error ?? "failed"}`,
            );
          }
          finalizeAudit(
            ctx,
            siteId,
            "portal.apps.module.settings_updated",
            installationId,
          );
          emit(
            scope.siteId,
            "apps.module.settings_updated",
            ctx,
            { installation_id: installationId },
            installationId,
          );
          return { ok: true as const };
        },
      ),
  };
}
