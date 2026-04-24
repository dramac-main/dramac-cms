import "server-only";

/**
 * Portal CRM DAL (Session 4B).
 *
 * Namespaces: contacts, companies, deals, activities, pipelines, segments.
 *
 * Invariants (shared with Sessions 1-3 + 4A):
 *   1. `requireScope(ctx, siteId, permission)` first — denials audit + throw.
 *   2. Every query filters `site_id = scope.siteId`.
 *   3. `withPortalEvent` wraps every operation for observability.
 *   4. Writes fire-and-forget `writePortalAudit` + `logAutomationEvent`
 *      with `source: "portal", actor_user_id: ctx.user.userId`.
 *   5. CRM owns identity/preferences/consent — commerce DAL is the
 *      authoritative owner of order/payment/fulfillment rows. A portal
 *      CRM edit does NOT silently revert storefront data (we surface
 *      the authoritative owner pattern by scoping updates to the CRM
 *      contact/company/deal tables only; cross-linkage with commerce
 *      happens via the CRM bridge, never here).
 *   6. `canManageCrm` is the single permission key (portal-auth exposes no
 *      `canViewCrm`). We use it for both read and write.
 *   7. Deal `amount` is DECIMAL (numeric) in `mod_crmmod01_deals` — NOT
 *      cents. The DAL mirrors this exactly and never applies `toCents()`.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkPortalPermission,
  type PortalSiteScope,
} from "./permission-resolver";
import { auditPortalDenied, writePortalAudit } from "./audit-log";
import { withPortalEvent } from "./observability";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import { EVENT_REGISTRY } from "@/modules/automation/lib/event-types";
import { PortalAccessDeniedError, type PortalDALContext } from "./data-access";

// Single permission key for CRM.
const CRM_PERM = "canManageCrm" as const;

// CRM module table prefix (from Phase EM-50).
const CRM_PREFIX = "mod_crmmod01";
const T = {
  contacts: `${CRM_PREFIX}_contacts`,
  companies: `${CRM_PREFIX}_companies`,
  deals: `${CRM_PREFIX}_deals`,
  pipelines: `${CRM_PREFIX}_pipelines`,
  stages: `${CRM_PREFIX}_pipeline_stages`,
  activities: `${CRM_PREFIX}_activities`,
  tags: `${CRM_PREFIX}_tags`,
} as const;

// =============================================================================
// SHARED HELPERS
// =============================================================================

async function requireScope(
  ctx: PortalDALContext,
  siteId: string,
): Promise<PortalSiteScope> {
  const result = await checkPortalPermission(ctx.user, siteId, CRM_PERM);
  if (!result.allowed) {
    await auditPortalDenied({
      authUserId: ctx.user.userId,
      clientId: ctx.user.clientId,
      agencyId: ctx.user.agencyId,
      siteId,
      action: `portal.permission.${CRM_PERM}`,
      permissionKey: CRM_PERM,
      reason: result.reason,
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError(
      result.reason === "site_not_found"
        ? "site_not_found"
        : "permission_denied",
      siteId,
      CRM_PERM,
    );
  }
  return result.scope!;
}

function finalizeAudit(
  ctx: PortalDALContext,
  siteId: string,
  action: string,
  resourceType: string,
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
    resourceType,
    resourceId,
    permissionKey: CRM_PERM,
    metadata,
  }).catch(() => {});
}

function emitEvent(
  siteId: string,
  eventType: string,
  ctx: PortalDALContext,
  payload: Record<string, unknown>,
  sourceEntityType: string,
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
      sourceEntityType,
      sourceEntityId,
    },
  ).catch(() => {});
}

function stringOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

// =============================================================================
// CONTACT TYPES
// =============================================================================

export type PortalContactStatus =
  | "active"
  | "inactive"
  | "archived"
  | "lead"
  | "customer"
  | "churned";

export type PortalLeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "unqualified"
  | "converted";

export interface PortalContactListFilter {
  status?: PortalContactStatus | PortalContactStatus[] | "all";
  leadStatus?: PortalLeadStatus | PortalLeadStatus[] | "all";
  companyId?: string;
  ownerId?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "last_contacted_at" | "lead_score" | "last_name";
  sortDir?: "asc" | "desc";
}

export interface PortalContactListItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  jobTitle: string | null;
  companyId: string | null;
  companyName: string | null;
  status: string;
  leadStatus: string | null;
  leadScore: number;
  tags: string[];
  source: string | null;
  lastContactedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PortalCreateContactInput {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  companyId?: string | null;
  status?: PortalContactStatus;
  leadStatus?: PortalLeadStatus;
  source?: string | null;
  sourceDetails?: string | null;
  tags?: string[];
  leadScore?: number;
  ownerId?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  customFields?: Record<string, unknown>;
}

export type PortalUpdateContactInput = Partial<PortalCreateContactInput>;

function mapContactRow(row: any): PortalContactListItem {
  return {
    id: String(row.id),
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    mobile: row.mobile ?? null,
    jobTitle: row.job_title ?? null,
    companyId: row.company_id ?? null,
    companyName: row.company?.name ?? null,
    status: row.status ?? "active",
    leadStatus: row.lead_status ?? null,
    leadScore: Number(row.lead_score ?? 0),
    tags: Array.isArray(row.tags) ? row.tags : [],
    source: row.source ?? null,
    lastContactedAt: row.last_contacted_at ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

// =============================================================================
// CONTACTS NAMESPACE
// =============================================================================

export interface PortalCRMContactsNamespace {
  list(
    siteId: string,
    filter?: PortalContactListFilter,
  ): Promise<PortalContactListItem[]>;
  detail(siteId: string, contactId: string): Promise<PortalContactListItem>;
  create(
    siteId: string,
    input: PortalCreateContactInput,
  ): Promise<PortalContactListItem>;
  update(
    siteId: string,
    contactId: string,
    input: PortalUpdateContactInput,
  ): Promise<PortalContactListItem>;
  delete(siteId: string, contactId: string): Promise<void>;
}

function createContactsNamespace(
  ctx: PortalDALContext,
): PortalCRMContactsNamespace {
  return {
    list: async (siteId, filter) =>
      withPortalEvent(
        "portal.dal.crm.contacts.list",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          let q = admin
            .from(T.contacts)
            .select(`*, company:${T.companies}(id, name)`)
            .eq("site_id", scope.siteId);

          if (filter?.status && filter.status !== "all") {
            if (Array.isArray(filter.status)) q = q.in("status", filter.status);
            else q = q.eq("status", filter.status);
          }
          if (filter?.leadStatus && filter.leadStatus !== "all") {
            if (Array.isArray(filter.leadStatus))
              q = q.in("lead_status", filter.leadStatus);
            else q = q.eq("lead_status", filter.leadStatus);
          }
          if (filter?.companyId) q = q.eq("company_id", filter.companyId);
          if (filter?.ownerId) q = q.eq("owner_id", filter.ownerId);
          if (filter?.tags && filter.tags.length > 0)
            q = q.overlaps("tags", filter.tags);
          if (filter?.search) {
            const s = filter.search.replace(/%/g, "").trim();
            q = q.or(
              `first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`,
            );
          }
          const sortBy = filter?.sortBy ?? "created_at";
          const sortAsc = (filter?.sortDir ?? "desc") === "asc";
          q = q.order(sortBy, { ascending: sortAsc });
          if (filter?.limit || filter?.offset) {
            const from = filter?.offset ?? 0;
            const to = from + (filter?.limit ?? 50) - 1;
            q = q.range(from, to);
          }
          const { data, error } = await q;
          if (error)
            throw new Error(`[portal][crm] list contacts: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.contacts.list",
            "crm_contact",
            null,
            {
              count: (data ?? []).length,
            },
          );
          return (data ?? []).map(mapContactRow);
        },
      ),

    detail: async (siteId, contactId) =>
      withPortalEvent(
        "portal.dal.crm.contacts.detail",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.contacts)
            .select(`*, company:${T.companies}(id, name)`)
            .eq("site_id", scope.siteId)
            .eq("id", contactId)
            .single();
          if (error)
            throw new Error(
              `[portal][crm] contact not found: ${error.message}`,
            );
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.contacts.detail",
            "crm_contact",
            contactId,
          );
          return mapContactRow(data);
        },
      ),

    create: async (siteId, input) =>
      withPortalEvent(
        "portal.dal.crm.contacts.create",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const row = {
            site_id: scope.siteId,
            first_name: stringOrNull(input.firstName),
            last_name: stringOrNull(input.lastName),
            email: stringOrNull(input.email?.toLowerCase?.() ?? input.email),
            phone: stringOrNull(input.phone),
            mobile: stringOrNull(input.mobile),
            job_title: stringOrNull(input.jobTitle),
            department: stringOrNull(input.department),
            company_id: stringOrNull(input.companyId),
            status: input.status ?? "active",
            lead_status: input.leadStatus ?? "new",
            source: stringOrNull(input.source) ?? "portal",
            source_details: stringOrNull(input.sourceDetails),
            address_line_1: stringOrNull(input.addressLine1),
            address_line_2: stringOrNull(input.addressLine2),
            city: stringOrNull(input.city),
            state: stringOrNull(input.state),
            postal_code: stringOrNull(input.postalCode),
            country: stringOrNull(input.country),
            custom_fields: input.customFields ?? {},
            tags: Array.isArray(input.tags) ? input.tags : [],
            lead_score: Number.isFinite(input.leadScore) ? input.leadScore : 0,
            owner_id: stringOrNull(input.ownerId),
          };
          const { data, error } = await admin
            .from(T.contacts)
            .insert(row)
            .select(`*, company:${T.companies}(id, name)`)
            .single();
          if (error)
            throw new Error(`[portal][crm] create contact: ${error.message}`);
          const mapped = mapContactRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.contacts.create",
            "crm_contact",
            mapped.id,
            { email: mapped.email },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.crm.contact.created,
            ctx,
            {
              id: mapped.id,
              first_name: mapped.firstName,
              last_name: mapped.lastName,
              email: mapped.email,
              phone: mapped.phone,
              company_id: mapped.companyId,
              lead_status: mapped.leadStatus,
              source: mapped.source,
              tags: mapped.tags,
              created_at: mapped.createdAt,
            },
            "contact",
            mapped.id,
          );
          return mapped;
        },
      ),

    update: async (siteId, contactId, input) =>
      withPortalEvent(
        "portal.dal.crm.contacts.update",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const patch: Record<string, unknown> = {};
          if ("firstName" in input)
            patch.first_name = stringOrNull(input.firstName);
          if ("lastName" in input)
            patch.last_name = stringOrNull(input.lastName);
          if ("email" in input)
            patch.email = stringOrNull(
              input.email?.toLowerCase?.() ?? input.email,
            );
          if ("phone" in input) patch.phone = stringOrNull(input.phone);
          if ("mobile" in input) patch.mobile = stringOrNull(input.mobile);
          if ("jobTitle" in input)
            patch.job_title = stringOrNull(input.jobTitle);
          if ("department" in input)
            patch.department = stringOrNull(input.department);
          if ("companyId" in input)
            patch.company_id = stringOrNull(input.companyId);
          if ("status" in input) patch.status = input.status;
          if ("leadStatus" in input) patch.lead_status = input.leadStatus;
          if ("source" in input) patch.source = stringOrNull(input.source);
          if ("sourceDetails" in input)
            patch.source_details = stringOrNull(input.sourceDetails);
          if ("addressLine1" in input)
            patch.address_line_1 = stringOrNull(input.addressLine1);
          if ("addressLine2" in input)
            patch.address_line_2 = stringOrNull(input.addressLine2);
          if ("city" in input) patch.city = stringOrNull(input.city);
          if ("state" in input) patch.state = stringOrNull(input.state);
          if ("postalCode" in input)
            patch.postal_code = stringOrNull(input.postalCode);
          if ("country" in input) patch.country = stringOrNull(input.country);
          if ("customFields" in input) patch.custom_fields = input.customFields;
          if ("tags" in input && Array.isArray(input.tags))
            patch.tags = input.tags;
          if (
            "leadScore" in input &&
            typeof input.leadScore === "number" &&
            Number.isFinite(input.leadScore)
          )
            patch.lead_score = input.leadScore;
          if ("ownerId" in input) patch.owner_id = stringOrNull(input.ownerId);
          patch.updated_at = new Date().toISOString();

          const { data, error } = await admin
            .from(T.contacts)
            .update(patch)
            .eq("site_id", scope.siteId)
            .eq("id", contactId)
            .select(`*, company:${T.companies}(id, name)`)
            .single();
          if (error)
            throw new Error(`[portal][crm] update contact: ${error.message}`);
          const mapped = mapContactRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.contacts.update",
            "crm_contact",
            contactId,
            { changed: Object.keys(patch) },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.crm.contact.updated,
            ctx,
            {
              id: mapped.id,
              email: mapped.email,
              lead_status: mapped.leadStatus,
              changes: Object.keys(patch),
              updated_at: mapped.updatedAt,
            },
            "contact",
            mapped.id,
          );
          return mapped;
        },
      ),

    delete: async (siteId, contactId) =>
      withPortalEvent(
        "portal.dal.crm.contacts.delete",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { error } = await admin
            .from(T.contacts)
            .delete()
            .eq("site_id", scope.siteId)
            .eq("id", contactId);
          if (error)
            throw new Error(`[portal][crm] delete contact: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.contacts.delete",
            "crm_contact",
            contactId,
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.crm.contact.deleted,
            ctx,
            { id: contactId },
            "contact",
            contactId,
          );
        },
      ),
  };
}

// =============================================================================
// COMPANIES NAMESPACE
// =============================================================================

export type PortalCompanyStatus = "active" | "inactive" | "archived";
export type PortalCompanyAccountType =
  | "prospect"
  | "customer"
  | "partner"
  | "competitor"
  | "other";

export interface PortalCompanyListFilter {
  status?: PortalCompanyStatus | PortalCompanyStatus[] | "all";
  accountType?: PortalCompanyAccountType | PortalCompanyAccountType[] | "all";
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "name";
  sortDir?: "asc" | "desc";
}

export interface PortalCompanyListItem {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  employeeCount: number | null;
  annualRevenue: number | null;
  status: string;
  accountType: string | null;
  tags: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PortalCreateCompanyInput {
  name: string;
  domain?: string | null;
  description?: string | null;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  employeeCount?: number | null;
  annualRevenue?: number | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  status?: PortalCompanyStatus;
  accountType?: PortalCompanyAccountType;
  tags?: string[];
  ownerId?: string | null;
  customFields?: Record<string, unknown>;
}

export type PortalUpdateCompanyInput = Partial<PortalCreateCompanyInput>;

function mapCompanyRow(row: any): PortalCompanyListItem {
  return {
    id: String(row.id),
    name: row.name ?? "",
    domain: row.domain ?? null,
    industry: row.industry ?? null,
    website: row.website ?? null,
    phone: row.phone ?? null,
    employeeCount: row.employee_count ?? null,
    annualRevenue:
      row.annual_revenue === null || row.annual_revenue === undefined
        ? null
        : Number(row.annual_revenue),
    status: row.status ?? "active",
    accountType: row.account_type ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export interface PortalCRMCompaniesNamespace {
  list(
    siteId: string,
    filter?: PortalCompanyListFilter,
  ): Promise<PortalCompanyListItem[]>;
  detail(siteId: string, companyId: string): Promise<PortalCompanyListItem>;
  create(
    siteId: string,
    input: PortalCreateCompanyInput,
  ): Promise<PortalCompanyListItem>;
  update(
    siteId: string,
    companyId: string,
    input: PortalUpdateCompanyInput,
  ): Promise<PortalCompanyListItem>;
  delete(siteId: string, companyId: string): Promise<void>;
}

function createCompaniesNamespace(
  ctx: PortalDALContext,
): PortalCRMCompaniesNamespace {
  return {
    list: async (siteId, filter) =>
      withPortalEvent(
        "portal.dal.crm.companies.list",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          let q = admin
            .from(T.companies)
            .select("*")
            .eq("site_id", scope.siteId);
          if (filter?.status && filter.status !== "all") {
            if (Array.isArray(filter.status)) q = q.in("status", filter.status);
            else q = q.eq("status", filter.status);
          }
          if (filter?.accountType && filter.accountType !== "all") {
            if (Array.isArray(filter.accountType))
              q = q.in("account_type", filter.accountType);
            else q = q.eq("account_type", filter.accountType);
          }
          if (filter?.tags && filter.tags.length > 0)
            q = q.overlaps("tags", filter.tags);
          if (filter?.search) {
            const s = filter.search.replace(/%/g, "").trim();
            q = q.or(
              `name.ilike.%${s}%,domain.ilike.%${s}%,industry.ilike.%${s}%`,
            );
          }
          const sortBy = filter?.sortBy ?? "created_at";
          const sortAsc = (filter?.sortDir ?? "desc") === "asc";
          q = q.order(sortBy, { ascending: sortAsc });
          if (filter?.limit || filter?.offset) {
            const from = filter?.offset ?? 0;
            const to = from + (filter?.limit ?? 50) - 1;
            q = q.range(from, to);
          }
          const { data, error } = await q;
          if (error)
            throw new Error(`[portal][crm] list companies: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.companies.list",
            "crm_company",
            null,
            {
              count: (data ?? []).length,
            },
          );
          return (data ?? []).map(mapCompanyRow);
        },
      ),

    detail: async (siteId, companyId) =>
      withPortalEvent(
        "portal.dal.crm.companies.detail",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.companies)
            .select("*")
            .eq("site_id", scope.siteId)
            .eq("id", companyId)
            .single();
          if (error)
            throw new Error(
              `[portal][crm] company not found: ${error.message}`,
            );
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.companies.detail",
            "crm_company",
            companyId,
          );
          return mapCompanyRow(data);
        },
      ),

    create: async (siteId, input) =>
      withPortalEvent(
        "portal.dal.crm.companies.create",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          if (!input.name || input.name.trim().length === 0) {
            throw new Error("[portal][crm] company name is required");
          }
          const admin = createAdminClient() as any;
          const row = {
            site_id: scope.siteId,
            name: input.name.trim(),
            domain: stringOrNull(input.domain),
            description: stringOrNull(input.description),
            industry: stringOrNull(input.industry),
            website: stringOrNull(input.website),
            phone: stringOrNull(input.phone),
            employee_count: input.employeeCount ?? null,
            annual_revenue: input.annualRevenue ?? null,
            address_line_1: stringOrNull(input.addressLine1),
            address_line_2: stringOrNull(input.addressLine2),
            city: stringOrNull(input.city),
            state: stringOrNull(input.state),
            postal_code: stringOrNull(input.postalCode),
            country: stringOrNull(input.country),
            status: input.status ?? "active",
            account_type: input.accountType ?? null,
            custom_fields: input.customFields ?? {},
            tags: Array.isArray(input.tags) ? input.tags : [],
            owner_id: stringOrNull(input.ownerId),
          };
          const { data, error } = await admin
            .from(T.companies)
            .insert(row)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][crm] create company: ${error.message}`);
          const mapped = mapCompanyRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.companies.create",
            "crm_company",
            mapped.id,
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.crm.company.created,
            ctx,
            {
              id: mapped.id,
              name: mapped.name,
              industry: mapped.industry,
              created_at: mapped.createdAt,
            },
            "company",
            mapped.id,
          );
          return mapped;
        },
      ),

    update: async (siteId, companyId, input) =>
      withPortalEvent(
        "portal.dal.crm.companies.update",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const patch: Record<string, unknown> = {};
          if ("name" in input && input.name)
            patch.name = String(input.name).trim();
          if ("domain" in input) patch.domain = stringOrNull(input.domain);
          if ("description" in input)
            patch.description = stringOrNull(input.description);
          if ("industry" in input)
            patch.industry = stringOrNull(input.industry);
          if ("website" in input) patch.website = stringOrNull(input.website);
          if ("phone" in input) patch.phone = stringOrNull(input.phone);
          if ("employeeCount" in input)
            patch.employee_count = input.employeeCount ?? null;
          if ("annualRevenue" in input)
            patch.annual_revenue = input.annualRevenue ?? null;
          if ("addressLine1" in input)
            patch.address_line_1 = stringOrNull(input.addressLine1);
          if ("addressLine2" in input)
            patch.address_line_2 = stringOrNull(input.addressLine2);
          if ("city" in input) patch.city = stringOrNull(input.city);
          if ("state" in input) patch.state = stringOrNull(input.state);
          if ("postalCode" in input)
            patch.postal_code = stringOrNull(input.postalCode);
          if ("country" in input) patch.country = stringOrNull(input.country);
          if ("status" in input) patch.status = input.status;
          if ("accountType" in input)
            patch.account_type = input.accountType ?? null;
          if ("tags" in input && Array.isArray(input.tags))
            patch.tags = input.tags;
          if ("ownerId" in input) patch.owner_id = stringOrNull(input.ownerId);
          if ("customFields" in input) patch.custom_fields = input.customFields;
          patch.updated_at = new Date().toISOString();

          const { data, error } = await admin
            .from(T.companies)
            .update(patch)
            .eq("site_id", scope.siteId)
            .eq("id", companyId)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][crm] update company: ${error.message}`);
          const mapped = mapCompanyRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.companies.update",
            "crm_company",
            companyId,
            { changed: Object.keys(patch) },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.crm.company.updated,
            ctx,
            {
              id: mapped.id,
              name: mapped.name,
              changes: Object.keys(patch),
              updated_at: mapped.updatedAt,
            },
            "company",
            mapped.id,
          );
          return mapped;
        },
      ),

    delete: async (siteId, companyId) =>
      withPortalEvent(
        "portal.dal.crm.companies.delete",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { error } = await admin
            .from(T.companies)
            .delete()
            .eq("site_id", scope.siteId)
            .eq("id", companyId);
          if (error)
            throw new Error(`[portal][crm] delete company: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.companies.delete",
            "crm_company",
            companyId,
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.crm.company.deleted,
            ctx,
            { id: companyId },
            "company",
            companyId,
          );
        },
      ),
  };
}

// =============================================================================
// DEALS NAMESPACE
// =============================================================================

export type PortalDealStatus = "open" | "won" | "lost";

export interface PortalDealListFilter {
  status?: PortalDealStatus | PortalDealStatus[] | "all";
  pipelineId?: string;
  stageId?: string;
  contactId?: string;
  companyId?: string;
  ownerId?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  closeFrom?: string;
  closeTo?: string;
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "expected_close_date" | "amount" | "name";
  sortDir?: "asc" | "desc";
}

export interface PortalDealListItem {
  id: string;
  name: string;
  description: string | null;
  pipelineId: string | null;
  stageId: string | null;
  stageName: string | null;
  contactId: string | null;
  companyId: string | null;
  amount: number | null;
  currency: string;
  probability: number;
  status: string;
  closeReason: string | null;
  expectedCloseDate: string | null;
  actualCloseDate: string | null;
  tags: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PortalCreateDealInput {
  name: string;
  description?: string | null;
  pipelineId?: string | null;
  stageId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  amount?: number | null;
  currency?: string;
  probability?: number;
  status?: PortalDealStatus;
  expectedCloseDate?: string | null;
  ownerId?: string | null;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export type PortalUpdateDealInput = Partial<PortalCreateDealInput>;

function mapDealRow(row: any): PortalDealListItem {
  return {
    id: String(row.id),
    name: row.name ?? "",
    description: row.description ?? null,
    pipelineId: row.pipeline_id ?? null,
    stageId: row.stage_id ?? null,
    stageName: row.stage?.name ?? null,
    contactId: row.contact_id ?? null,
    companyId: row.company_id ?? null,
    amount:
      row.amount === null || row.amount === undefined
        ? null
        : Number(row.amount),
    currency: row.currency ?? "USD",
    probability: Number(row.probability ?? 0),
    status: row.status ?? "open",
    closeReason: row.close_reason ?? null,
    expectedCloseDate: row.expected_close_date ?? null,
    actualCloseDate: row.actual_close_date ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export interface PortalCRMDealsNamespace {
  list(
    siteId: string,
    filter?: PortalDealListFilter,
  ): Promise<PortalDealListItem[]>;
  detail(siteId: string, dealId: string): Promise<PortalDealListItem>;
  create(
    siteId: string,
    input: PortalCreateDealInput,
  ): Promise<PortalDealListItem>;
  update(
    siteId: string,
    dealId: string,
    input: PortalUpdateDealInput,
  ): Promise<PortalDealListItem>;
  moveStage(
    siteId: string,
    dealId: string,
    newStageId: string,
  ): Promise<PortalDealListItem>;
  markWon(
    siteId: string,
    dealId: string,
    options?: { reason?: string; closeDate?: string },
  ): Promise<PortalDealListItem>;
  markLost(
    siteId: string,
    dealId: string,
    options?: { reason?: string; closeDate?: string },
  ): Promise<PortalDealListItem>;
  delete(siteId: string, dealId: string): Promise<void>;
}

function createDealsNamespace(ctx: PortalDALContext): PortalCRMDealsNamespace {
  const selectWithStage = `*, stage:${T.stages}(id, name, stage_type, probability)`;

  async function fetchDeal(
    scope: PortalSiteScope,
    dealId: string,
  ): Promise<any | null> {
    const admin = createAdminClient() as any;
    const { data, error } = await admin
      .from(T.deals)
      .select(selectWithStage)
      .eq("site_id", scope.siteId)
      .eq("id", dealId)
      .single();
    if (error) return null;
    return data;
  }

  return {
    list: async (siteId, filter) =>
      withPortalEvent(
        "portal.dal.crm.deals.list",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          let q = admin
            .from(T.deals)
            .select(selectWithStage)
            .eq("site_id", scope.siteId);
          if (filter?.status && filter.status !== "all") {
            if (Array.isArray(filter.status)) q = q.in("status", filter.status);
            else q = q.eq("status", filter.status);
          }
          if (filter?.pipelineId) q = q.eq("pipeline_id", filter.pipelineId);
          if (filter?.stageId) q = q.eq("stage_id", filter.stageId);
          if (filter?.contactId) q = q.eq("contact_id", filter.contactId);
          if (filter?.companyId) q = q.eq("company_id", filter.companyId);
          if (filter?.ownerId) q = q.eq("owner_id", filter.ownerId);
          if (filter?.search) {
            const s = filter.search.replace(/%/g, "").trim();
            q = q.or(`name.ilike.%${s}%,description.ilike.%${s}%`);
          }
          if (typeof filter?.minAmount === "number")
            q = q.gte("amount", filter.minAmount);
          if (typeof filter?.maxAmount === "number")
            q = q.lte("amount", filter.maxAmount);
          if (filter?.closeFrom)
            q = q.gte("expected_close_date", filter.closeFrom);
          if (filter?.closeTo) q = q.lte("expected_close_date", filter.closeTo);
          const sortBy = filter?.sortBy ?? "created_at";
          const sortAsc = (filter?.sortDir ?? "desc") === "asc";
          q = q.order(sortBy, { ascending: sortAsc });
          if (filter?.limit || filter?.offset) {
            const from = filter?.offset ?? 0;
            const to = from + (filter?.limit ?? 50) - 1;
            q = q.range(from, to);
          }
          const { data, error } = await q;
          if (error)
            throw new Error(`[portal][crm] list deals: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.deals.list",
            "crm_deal",
            null,
            {
              count: (data ?? []).length,
            },
          );
          return (data ?? []).map(mapDealRow);
        },
      ),

    detail: async (siteId, dealId) =>
      withPortalEvent(
        "portal.dal.crm.deals.detail",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const row = await fetchDeal(scope, dealId);
          if (!row) throw new Error(`[portal][crm] deal not found: ${dealId}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.deals.detail",
            "crm_deal",
            dealId,
          );
          return mapDealRow(row);
        },
      ),

    create: async (siteId, input) =>
      withPortalEvent(
        "portal.dal.crm.deals.create",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          if (!input.name || input.name.trim().length === 0)
            throw new Error("[portal][crm] deal name is required");
          const admin = createAdminClient() as any;
          const row = {
            site_id: scope.siteId,
            name: input.name.trim(),
            description: stringOrNull(input.description),
            pipeline_id: stringOrNull(input.pipelineId),
            stage_id: stringOrNull(input.stageId),
            contact_id: stringOrNull(input.contactId),
            company_id: stringOrNull(input.companyId),
            amount:
              input.amount === null || input.amount === undefined
                ? null
                : Number(input.amount),
            currency: input.currency ?? "USD",
            probability: Number.isFinite(input.probability)
              ? input.probability
              : 0,
            status: input.status ?? "open",
            expected_close_date: stringOrNull(input.expectedCloseDate),
            owner_id: stringOrNull(input.ownerId),
            custom_fields: input.customFields ?? {},
            tags: Array.isArray(input.tags) ? input.tags : [],
          };
          const { data, error } = await admin
            .from(T.deals)
            .insert(row)
            .select(selectWithStage)
            .single();
          if (error)
            throw new Error(`[portal][crm] create deal: ${error.message}`);
          const mapped = mapDealRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.deals.create",
            "crm_deal",
            mapped.id,
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.crm.deal.created,
            ctx,
            {
              id: mapped.id,
              name: mapped.name,
              amount: mapped.amount,
              currency: mapped.currency,
              stage_id: mapped.stageId,
              contact_id: mapped.contactId,
              company_id: mapped.companyId,
            },
            "deal",
            mapped.id,
          );
          return mapped;
        },
      ),

    update: async (siteId, dealId, input) =>
      withPortalEvent(
        "portal.dal.crm.deals.update",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const prior = await fetchDeal(scope, dealId);
          if (!prior)
            throw new Error(`[portal][crm] deal not found: ${dealId}`);
          const admin = createAdminClient() as any;
          const patch: Record<string, unknown> = {};
          if ("name" in input && input.name)
            patch.name = String(input.name).trim();
          if ("description" in input)
            patch.description = stringOrNull(input.description);
          if ("pipelineId" in input)
            patch.pipeline_id = stringOrNull(input.pipelineId);
          if ("stageId" in input) patch.stage_id = stringOrNull(input.stageId);
          if ("contactId" in input)
            patch.contact_id = stringOrNull(input.contactId);
          if ("companyId" in input)
            patch.company_id = stringOrNull(input.companyId);
          if ("amount" in input)
            patch.amount =
              input.amount === null || input.amount === undefined
                ? null
                : Number(input.amount);
          if ("currency" in input && input.currency)
            patch.currency = input.currency;
          if (
            "probability" in input &&
            typeof input.probability === "number" &&
            Number.isFinite(input.probability)
          )
            patch.probability = input.probability;
          if ("status" in input) patch.status = input.status;
          if ("expectedCloseDate" in input)
            patch.expected_close_date = stringOrNull(input.expectedCloseDate);
          if ("ownerId" in input) patch.owner_id = stringOrNull(input.ownerId);
          if ("tags" in input && Array.isArray(input.tags))
            patch.tags = input.tags;
          if ("customFields" in input) patch.custom_fields = input.customFields;
          patch.updated_at = new Date().toISOString();

          const { data, error } = await admin
            .from(T.deals)
            .update(patch)
            .eq("site_id", scope.siteId)
            .eq("id", dealId)
            .select(selectWithStage)
            .single();
          if (error)
            throw new Error(`[portal][crm] update deal: ${error.message}`);
          const mapped = mapDealRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.deals.update",
            "crm_deal",
            dealId,
            { changed: Object.keys(patch) },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.crm.deal.updated,
            ctx,
            {
              id: mapped.id,
              name: mapped.name,
              changes: Object.keys(patch),
              previous_amount: prior.amount,
              amount: mapped.amount,
            },
            "deal",
            mapped.id,
          );
          if (
            "amount" in input &&
            prior.amount !== null &&
            mapped.amount !== null &&
            Number(prior.amount) !== mapped.amount
          ) {
            emitEvent(
              scope.siteId,
              EVENT_REGISTRY.crm.deal.value_changed,
              ctx,
              {
                id: mapped.id,
                previous_amount: Number(prior.amount),
                amount: mapped.amount,
                currency: mapped.currency,
              },
              "deal",
              mapped.id,
            );
          }
          return mapped;
        },
      ),

    moveStage: async (siteId, dealId, newStageId) =>
      withPortalEvent(
        "portal.dal.crm.deals.moveStage",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const prior = await fetchDeal(scope, dealId);
          if (!prior)
            throw new Error(`[portal][crm] deal not found: ${dealId}`);
          const admin = createAdminClient() as any;

          // fetch the target stage to carry probability + derive status
          const { data: stageRow, error: stageErr } = await admin
            .from(T.stages)
            .select("id, name, probability, stage_type, pipeline_id")
            .eq("id", newStageId)
            .single();
          if (stageErr)
            throw new Error(
              `[portal][crm] stage not found: ${stageErr.message}`,
            );

          const patch: Record<string, unknown> = {
            stage_id: newStageId,
            probability: Number(stageRow.probability ?? 0),
            updated_at: new Date().toISOString(),
          };
          if (stageRow.stage_type === "won" || stageRow.stage_type === "lost") {
            patch.status = stageRow.stage_type;
            patch.actual_close_date = new Date().toISOString().split("T")[0];
          } else if (prior.status !== "open") {
            patch.status = "open";
            patch.actual_close_date = null;
          }

          const { data, error } = await admin
            .from(T.deals)
            .update(patch)
            .eq("site_id", scope.siteId)
            .eq("id", dealId)
            .select(selectWithStage)
            .single();
          if (error)
            throw new Error(`[portal][crm] move stage: ${error.message}`);
          const mapped = mapDealRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.deals.moveStage",
            "crm_deal",
            dealId,
            { from_stage: prior.stage_id, to_stage: newStageId },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.crm.deal.stage_changed,
            ctx,
            {
              id: mapped.id,
              previous_stage_id: prior.stage_id,
              stage_id: newStageId,
              status: mapped.status,
            },
            "deal",
            mapped.id,
          );
          if (stageRow.stage_type === "won") {
            emitEvent(
              scope.siteId,
              EVENT_REGISTRY.crm.deal.won,
              ctx,
              {
                id: mapped.id,
                amount: mapped.amount,
                currency: mapped.currency,
              },
              "deal",
              mapped.id,
            );
          } else if (stageRow.stage_type === "lost") {
            emitEvent(
              scope.siteId,
              EVENT_REGISTRY.crm.deal.lost,
              ctx,
              {
                id: mapped.id,
                amount: mapped.amount,
                currency: mapped.currency,
              },
              "deal",
              mapped.id,
            );
          }
          return mapped;
        },
      ),

    markWon: async (siteId, dealId, options) =>
      withPortalEvent(
        "portal.dal.crm.deals.markWon",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.deals)
            .update({
              status: "won",
              close_reason: stringOrNull(options?.reason),
              actual_close_date:
                options?.closeDate ?? new Date().toISOString().split("T")[0],
              probability: 100,
              updated_at: new Date().toISOString(),
            })
            .eq("site_id", scope.siteId)
            .eq("id", dealId)
            .select(selectWithStage)
            .single();
          if (error)
            throw new Error(`[portal][crm] mark won: ${error.message}`);
          const mapped = mapDealRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.deals.markWon",
            "crm_deal",
            dealId,
            { reason: options?.reason },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.crm.deal.won,
            ctx,
            {
              id: mapped.id,
              amount: mapped.amount,
              currency: mapped.currency,
              reason: options?.reason,
            },
            "deal",
            mapped.id,
          );
          return mapped;
        },
      ),

    markLost: async (siteId, dealId, options) =>
      withPortalEvent(
        "portal.dal.crm.deals.markLost",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.deals)
            .update({
              status: "lost",
              close_reason: stringOrNull(options?.reason),
              actual_close_date:
                options?.closeDate ?? new Date().toISOString().split("T")[0],
              probability: 0,
              updated_at: new Date().toISOString(),
            })
            .eq("site_id", scope.siteId)
            .eq("id", dealId)
            .select(selectWithStage)
            .single();
          if (error)
            throw new Error(`[portal][crm] mark lost: ${error.message}`);
          const mapped = mapDealRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.deals.markLost",
            "crm_deal",
            dealId,
            { reason: options?.reason },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.crm.deal.lost,
            ctx,
            {
              id: mapped.id,
              amount: mapped.amount,
              currency: mapped.currency,
              reason: options?.reason,
            },
            "deal",
            mapped.id,
          );
          return mapped;
        },
      ),

    delete: async (siteId, dealId) =>
      withPortalEvent(
        "portal.dal.crm.deals.delete",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { error } = await admin
            .from(T.deals)
            .delete()
            .eq("site_id", scope.siteId)
            .eq("id", dealId);
          if (error)
            throw new Error(`[portal][crm] delete deal: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.deals.delete",
            "crm_deal",
            dealId,
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.crm.deal.deleted,
            ctx,
            { id: dealId },
            "deal",
            dealId,
          );
        },
      ),
  };
}

// =============================================================================
// ACTIVITIES NAMESPACE
// =============================================================================

export type PortalActivityType =
  | "call"
  | "email"
  | "meeting"
  | "task"
  | "note"
  | "sms"
  | "chat";

export type PortalTaskPriority = "low" | "medium" | "high" | "urgent";

export interface PortalActivityListFilter {
  activityType?: PortalActivityType | PortalActivityType[];
  contactId?: string;
  companyId?: string;
  dealId?: string;
  assignedTo?: string;
  completed?: boolean;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface PortalActivityListItem {
  id: string;
  activityType: string;
  subject: string | null;
  description: string | null;
  outcome: string | null;
  contactId: string | null;
  companyId: string | null;
  dealId: string | null;
  assignedTo: string | null;
  createdBy: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  taskDueDate: string | null;
  taskCompleted: boolean;
  taskPriority: string | null;
  createdAt: string | null;
}

export interface PortalCreateActivityInput {
  activityType: PortalActivityType;
  subject?: string | null;
  description?: string | null;
  outcome?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  assignedTo?: string | null;
  scheduledAt?: string | null;
  taskDueDate?: string | null;
  taskPriority?: PortalTaskPriority | null;
  callDurationSeconds?: number | null;
  callDirection?: "inbound" | "outbound" | null;
  meetingLocation?: string | null;
}

function mapActivityRow(row: any): PortalActivityListItem {
  return {
    id: String(row.id),
    activityType: row.activity_type ?? "note",
    subject: row.subject ?? null,
    description: row.description ?? null,
    outcome: row.outcome ?? null,
    contactId: row.contact_id ?? null,
    companyId: row.company_id ?? null,
    dealId: row.deal_id ?? null,
    assignedTo: row.assigned_to ?? null,
    createdBy: row.created_by ?? null,
    scheduledAt: row.scheduled_at ?? null,
    completedAt: row.completed_at ?? null,
    taskDueDate: row.task_due_date ?? null,
    taskCompleted: Boolean(row.task_completed),
    taskPriority: row.task_priority ?? null,
    createdAt: row.created_at ?? null,
  };
}

export interface PortalCRMActivitiesNamespace {
  list(
    siteId: string,
    filter?: PortalActivityListFilter,
  ): Promise<PortalActivityListItem[]>;
  create(
    siteId: string,
    input: PortalCreateActivityInput,
  ): Promise<PortalActivityListItem>;
  completeTask(
    siteId: string,
    activityId: string,
  ): Promise<PortalActivityListItem>;
  delete(siteId: string, activityId: string): Promise<void>;
}

function createActivitiesNamespace(
  ctx: PortalDALContext,
): PortalCRMActivitiesNamespace {
  return {
    list: async (siteId, filter) =>
      withPortalEvent(
        "portal.dal.crm.activities.list",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          let q = admin
            .from(T.activities)
            .select("*")
            .eq("site_id", scope.siteId);
          if (filter?.activityType) {
            if (Array.isArray(filter.activityType))
              q = q.in("activity_type", filter.activityType);
            else q = q.eq("activity_type", filter.activityType);
          }
          if (filter?.contactId) q = q.eq("contact_id", filter.contactId);
          if (filter?.companyId) q = q.eq("company_id", filter.companyId);
          if (filter?.dealId) q = q.eq("deal_id", filter.dealId);
          if (filter?.assignedTo) q = q.eq("assigned_to", filter.assignedTo);
          if (typeof filter?.completed === "boolean")
            q = q.eq("task_completed", filter.completed);
          if (filter?.from) q = q.gte("created_at", filter.from);
          if (filter?.to) q = q.lte("created_at", filter.to);
          q = q.order("created_at", { ascending: false });
          if (filter?.limit || filter?.offset) {
            const from = filter?.offset ?? 0;
            const to = from + (filter?.limit ?? 100) - 1;
            q = q.range(from, to);
          }
          const { data, error } = await q;
          if (error)
            throw new Error(`[portal][crm] list activities: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.activities.list",
            "crm_activity",
            null,
            { count: (data ?? []).length },
          );
          return (data ?? []).map(mapActivityRow);
        },
      ),

    create: async (siteId, input) =>
      withPortalEvent(
        "portal.dal.crm.activities.create",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const row = {
            site_id: scope.siteId,
            activity_type: input.activityType,
            subject: stringOrNull(input.subject),
            description: stringOrNull(input.description),
            outcome: stringOrNull(input.outcome),
            contact_id: stringOrNull(input.contactId),
            company_id: stringOrNull(input.companyId),
            deal_id: stringOrNull(input.dealId),
            assigned_to: stringOrNull(input.assignedTo),
            created_by: ctx.user.userId,
            scheduled_at: stringOrNull(input.scheduledAt),
            task_due_date: stringOrNull(input.taskDueDate),
            task_priority: input.taskPriority ?? null,
            task_completed: false,
            call_duration_seconds: input.callDurationSeconds ?? null,
            call_direction: input.callDirection ?? null,
            meeting_location: stringOrNull(input.meetingLocation),
          };
          const { data, error } = await admin
            .from(T.activities)
            .insert(row)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][crm] create activity: ${error.message}`);
          const mapped = mapActivityRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.activities.create",
            "crm_activity",
            mapped.id,
            { activityType: mapped.activityType },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.crm.activity.logged,
            ctx,
            {
              id: mapped.id,
              activity_type: mapped.activityType,
              subject: mapped.subject,
              contact_id: mapped.contactId,
              deal_id: mapped.dealId,
            },
            "activity",
            mapped.id,
          );
          return mapped;
        },
      ),

    completeTask: async (siteId, activityId) =>
      withPortalEvent(
        "portal.dal.crm.activities.completeTask",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const now = new Date().toISOString();
          const { data, error } = await admin
            .from(T.activities)
            .update({
              task_completed: true,
              completed_at: now,
              updated_at: now,
            })
            .eq("site_id", scope.siteId)
            .eq("id", activityId)
            .select("*")
            .single();
          if (error)
            throw new Error(
              `[portal][crm] complete activity: ${error.message}`,
            );
          const mapped = mapActivityRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.activities.completeTask",
            "crm_activity",
            activityId,
          );
          return mapped;
        },
      ),

    delete: async (siteId, activityId) =>
      withPortalEvent(
        "portal.dal.crm.activities.delete",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { error } = await admin
            .from(T.activities)
            .delete()
            .eq("site_id", scope.siteId)
            .eq("id", activityId);
          if (error)
            throw new Error(`[portal][crm] delete activity: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.activities.delete",
            "crm_activity",
            activityId,
          );
        },
      ),
  };
}

// =============================================================================
// PIPELINES NAMESPACE
// =============================================================================

export interface PortalPipelineSummary {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  stages: PortalPipelineStage[];
}

export interface PortalPipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  color: string;
  position: number;
  probability: number;
  stageType: "open" | "won" | "lost";
}

export interface PortalCRMPipelinesNamespace {
  list(siteId: string): Promise<PortalPipelineSummary[]>;
  stagesFor(siteId: string, pipelineId: string): Promise<PortalPipelineStage[]>;
}

function createPipelinesNamespace(
  ctx: PortalDALContext,
): PortalCRMPipelinesNamespace {
  return {
    list: async (siteId) =>
      withPortalEvent(
        "portal.dal.crm.pipelines.list",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data: pipelines, error: pErr } = await admin
            .from(T.pipelines)
            .select("*")
            .eq("site_id", scope.siteId)
            .eq("is_active", true)
            .order("is_default", { ascending: false })
            .order("name", { ascending: true });
          if (pErr)
            throw new Error(`[portal][crm] list pipelines: ${pErr.message}`);
          const ids = (pipelines ?? []).map((p: any) => p.id);
          const { data: stages, error: sErr } = await admin
            .from(T.stages)
            .select("*")
            .in(
              "pipeline_id",
              ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"],
            )
            .order("position", { ascending: true });
          if (sErr)
            throw new Error(`[portal][crm] list stages: ${sErr.message}`);
          const stagesByPipeline = new Map<string, PortalPipelineStage[]>();
          for (const s of stages ?? []) {
            const arr = stagesByPipeline.get(s.pipeline_id) ?? [];
            arr.push({
              id: String(s.id),
              pipelineId: String(s.pipeline_id),
              name: s.name,
              color: s.color ?? "#6366f1",
              position: Number(s.position ?? 0),
              probability: Number(s.probability ?? 0),
              stageType:
                s.stage_type === "won" || s.stage_type === "lost"
                  ? s.stage_type
                  : "open",
            });
            stagesByPipeline.set(s.pipeline_id, arr);
          }
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.pipelines.list",
            "crm_pipeline",
            null,
          );
          return (pipelines ?? []).map(
            (p: any): PortalPipelineSummary => ({
              id: String(p.id),
              name: p.name,
              description: p.description ?? null,
              isDefault: Boolean(p.is_default),
              isActive: Boolean(p.is_active),
              stages: stagesByPipeline.get(p.id) ?? [],
            }),
          );
        },
      ),

    stagesFor: async (siteId, pipelineId) =>
      withPortalEvent(
        "portal.dal.crm.pipelines.stagesFor",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          // tenant check on pipeline
          const { data: pipe } = await admin
            .from(T.pipelines)
            .select("id")
            .eq("site_id", scope.siteId)
            .eq("id", pipelineId)
            .single();
          if (!pipe) throw new Error(`[portal][crm] pipeline not found`);
          const { data, error } = await admin
            .from(T.stages)
            .select("*")
            .eq("pipeline_id", pipelineId)
            .order("position", { ascending: true });
          if (error) throw new Error(`[portal][crm] stages: ${error.message}`);
          return (data ?? []).map(
            (s: any): PortalPipelineStage => ({
              id: String(s.id),
              pipelineId: String(s.pipeline_id),
              name: s.name,
              color: s.color ?? "#6366f1",
              position: Number(s.position ?? 0),
              probability: Number(s.probability ?? 0),
              stageType:
                s.stage_type === "won" || s.stage_type === "lost"
                  ? s.stage_type
                  : "open",
            }),
          );
        },
      ),
  };
}

// =============================================================================
// SEGMENTS NAMESPACE (simple tag/status-based filtering)
// =============================================================================

export interface PortalSegmentQuery {
  status?: PortalContactStatus[];
  leadStatus?: PortalLeadStatus[];
  tags?: string[]; // match any
  source?: string;
  minLeadScore?: number;
  hasEmail?: boolean;
  hasPhone?: boolean;
  limit?: number;
}

export interface PortalCRMSegmentsNamespace {
  resolve(
    siteId: string,
    query: PortalSegmentQuery,
  ): Promise<PortalContactListItem[]>;
  count(siteId: string, query: PortalSegmentQuery): Promise<number>;
}

function createSegmentsNamespace(
  ctx: PortalDALContext,
): PortalCRMSegmentsNamespace {
  async function buildQuery(
    scope: PortalSiteScope,
    query: PortalSegmentQuery,
    forCount: boolean,
  ): Promise<any> {
    const admin = createAdminClient() as any;
    let q = admin
      .from(T.contacts)
      .select(
        forCount ? "id" : `*, company:${T.companies}(id, name)`,
        forCount ? { count: "exact", head: true } : undefined,
      )
      .eq("site_id", scope.siteId);
    if (query.status && query.status.length > 0)
      q = q.in("status", query.status);
    if (query.leadStatus && query.leadStatus.length > 0)
      q = q.in("lead_status", query.leadStatus);
    if (query.tags && query.tags.length > 0) q = q.overlaps("tags", query.tags);
    if (query.source) q = q.eq("source", query.source);
    if (typeof query.minLeadScore === "number")
      q = q.gte("lead_score", query.minLeadScore);
    if (query.hasEmail) q = q.not("email", "is", null);
    if (query.hasPhone) q = q.not("phone", "is", null);
    return q;
  }

  return {
    resolve: async (siteId, query) =>
      withPortalEvent(
        "portal.dal.crm.segments.resolve",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          let q = await buildQuery(scope, query, false);
          q = q
            .order("created_at", { ascending: false })
            .limit(query.limit ?? 500);
          const { data, error } = await q;
          if (error)
            throw new Error(`[portal][crm] segment resolve: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.crm.segments.resolve",
            "crm_segment",
            null,
            { count: (data ?? []).length },
          );
          return (data ?? []).map(mapContactRow);
        },
      ),

    count: async (siteId, query) =>
      withPortalEvent(
        "portal.dal.crm.segments.count",
        {
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          authUserId: ctx.user.userId,
          siteId,
          isImpersonation: ctx.isImpersonation,
        },
        async () => {
          const scope = await requireScope(ctx, siteId);
          const q = await buildQuery(scope, query, true);
          const { count, error } = await q;
          if (error)
            throw new Error(`[portal][crm] segment count: ${error.message}`);
          return Number(count ?? 0);
        },
      ),
  };
}

// =============================================================================
// AGGREGATE NAMESPACE
// =============================================================================

export interface PortalCRMNamespace {
  contacts: PortalCRMContactsNamespace;
  companies: PortalCRMCompaniesNamespace;
  deals: PortalCRMDealsNamespace;
  activities: PortalCRMActivitiesNamespace;
  pipelines: PortalCRMPipelinesNamespace;
  segments: PortalCRMSegmentsNamespace;
}

export function createCRMNamespace(ctx: PortalDALContext): PortalCRMNamespace {
  return {
    contacts: createContactsNamespace(ctx),
    companies: createCompaniesNamespace(ctx),
    deals: createDealsNamespace(ctx),
    activities: createActivitiesNamespace(ctx),
    pipelines: createPipelinesNamespace(ctx),
    segments: createSegmentsNamespace(ctx),
  };
}
