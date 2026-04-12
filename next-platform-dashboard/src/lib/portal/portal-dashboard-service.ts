"use server";

import { getConversationStats } from "@/modules/live-chat/actions/conversation-actions";
import { getDashboardStats } from "@/modules/ecommerce/actions/dashboard-actions";
import { getBookingStats } from "@/modules/booking/actions/booking-actions";
import { getAgencyCRMStats } from "@/modules/crm/actions/agency-crm-stats";
import { getAutomationStats } from "@/modules/automation/actions/automation-actions";
import { getActiveSubscriberCount } from "@/modules/marketing/actions/subscriber-actions";
import { getCampaigns } from "@/modules/marketing/actions/campaign-actions";
import type { EffectivePortalPermissions } from "./portal-permissions";

// =============================================================================
// TYPES
// =============================================================================

export interface PortalDashboardData {
  liveChat: {
    activeConversations: number;
    pendingConversations: number;
    avgResponseTime: number;
    todayConversations: number;
  } | null;
  ecommerce: {
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    revenueChange: number;
  } | null;
  bookings: {
    todayAppointments: number;
    upcomingThisWeek: number;
    pendingAppointments: number;
    confirmedAppointments: number;
  } | null;
  crm: {
    totalContacts: number;
    totalDeals: number;
    pipelineValue: number;
    dealsWonThisMonth: number;
  } | null;
  automation: {
    activeWorkflows: number;
    totalExecutions: number;
    successfulExecutions: number;
    executionsToday: number;
  } | null;
  marketing: {
    activeSubscribers: number;
    totalCampaigns: number;
  } | null;
}

// =============================================================================
// DASHBOARD DATA AGGREGATION
// =============================================================================

/**
 * Fetch dashboard KPI data across all permitted modules.
 * Only queries modules the client has permission to access.
 * All fetches run in parallel for performance.
 */
export async function getPortalDashboardData(
  siteIds: string[],
  permissions: EffectivePortalPermissions,
  agencyId: string,
): Promise<PortalDashboardData> {
  // We'll use the first site for per-site queries
  // In the future, this could aggregate across all sites
  const primarySiteId = siteIds[0];

  if (!primarySiteId) {
    return {
      liveChat: null,
      ecommerce: null,
      bookings: null,
      crm: null,
      automation: null,
      marketing: null,
    };
  }

  // Build parallel fetch promises — only for permitted modules
  const promises: {
    liveChat: Promise<PortalDashboardData["liveChat"]>;
    ecommerce: Promise<PortalDashboardData["ecommerce"]>;
    bookings: Promise<PortalDashboardData["bookings"]>;
    crm: Promise<PortalDashboardData["crm"]>;
    automation: Promise<PortalDashboardData["automation"]>;
    marketing: Promise<PortalDashboardData["marketing"]>;
  } = {
    liveChat: permissions.canManageLiveChat
      ? fetchLiveChatStats(primarySiteId)
      : Promise.resolve(null),
    ecommerce:
      permissions.canManageOrders || permissions.canManageProducts
        ? fetchEcommerceStats(primarySiteId)
        : Promise.resolve(null),
    bookings: permissions.canManageBookings
      ? fetchBookingStats(primarySiteId)
      : Promise.resolve(null),
    crm: permissions.canManageCrm
      ? fetchCrmStats(agencyId, siteIds)
      : Promise.resolve(null),
    automation: permissions.canManageAutomation
      ? fetchAutomationStats(primarySiteId)
      : Promise.resolve(null),
    marketing: permissions.canManageMarketing
      ? fetchMarketingStats(primarySiteId)
      : Promise.resolve(null),
  };

  const [liveChat, ecommerce, bookings, crm, automation, marketing] =
    await Promise.all([
      promises.liveChat,
      promises.ecommerce,
      promises.bookings,
      promises.crm,
      promises.automation,
      promises.marketing,
    ]);

  return { liveChat, ecommerce, bookings, crm, automation, marketing };
}

// =============================================================================
// INTERNAL FETCH HELPERS
// =============================================================================

async function fetchLiveChatStats(
  siteId: string,
): Promise<PortalDashboardData["liveChat"]> {
  try {
    const { stats, error } = await getConversationStats(siteId);
    if (error || !stats) return null;
    return {
      activeConversations: stats.activeConversations,
      pendingConversations: stats.pendingConversations,
      avgResponseTime: stats.avgResponseTime,
      todayConversations: stats.todayConversations,
    };
  } catch {
    return null;
  }
}

async function fetchEcommerceStats(
  siteId: string,
): Promise<PortalDashboardData["ecommerce"]> {
  try {
    const stats = await getDashboardStats(siteId, "month");
    return {
      totalOrders: stats.totalOrders,
      pendingOrders: stats.pendingOrders,
      totalRevenue: stats.totalRevenue,
      revenueChange: stats.revenueChange,
    };
  } catch {
    return null;
  }
}

async function fetchBookingStats(
  siteId: string,
): Promise<PortalDashboardData["bookings"]> {
  try {
    const stats = await getBookingStats(siteId);
    return {
      todayAppointments: stats.todayAppointments,
      upcomingThisWeek: stats.upcomingThisWeek,
      pendingAppointments: stats.pendingAppointments,
      confirmedAppointments: stats.confirmedAppointments,
    };
  } catch {
    return null;
  }
}

async function fetchCrmStats(
  agencyId: string,
  siteIds: string[],
): Promise<PortalDashboardData["crm"]> {
  try {
    const stats = await getAgencyCRMStats(agencyId, siteIds);
    return {
      totalContacts: stats.totalContacts,
      totalDeals: stats.totalDeals,
      pipelineValue: stats.pipelineValue,
      dealsWonThisMonth: stats.dealsWonThisMonth,
    };
  } catch {
    return null;
  }
}

async function fetchAutomationStats(
  siteId: string,
): Promise<PortalDashboardData["automation"]> {
  try {
    const result = await getAutomationStats(siteId);
    if (!result.success || !result.data) return null;
    return {
      activeWorkflows: result.data.active_workflows,
      totalExecutions: result.data.total_executions,
      successfulExecutions: result.data.successful_executions,
      executionsToday: result.data.executions_today,
    };
  } catch {
    return null;
  }
}

async function fetchMarketingStats(
  siteId: string,
): Promise<PortalDashboardData["marketing"]> {
  try {
    const [subscriberCount, campaignResult] = await Promise.all([
      getActiveSubscriberCount(siteId),
      getCampaigns(siteId, { limit: 0 }),
    ]);
    return {
      activeSubscribers: subscriberCount,
      totalCampaigns: campaignResult.total,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// SITE-LEVEL MODULE COUNTS (for site detail page)
// =============================================================================

export interface SiteModuleCount {
  slug: string;
  label: string;
  count: number;
  countLabel: string;
  href: string;
}

/**
 * Get quick counts for each installed+permitted module on a site.
 * Returns an array of module cards with live counts for the site detail page.
 */
export async function getSiteModuleCounts(
  siteId: string,
  permissions: EffectivePortalPermissions,
  agencyId: string,
  installedSlugs: string[],
): Promise<SiteModuleCount[]> {
  const results: SiteModuleCount[] = [];
  const promises: Promise<void>[] = [];

  // Live Chat
  if (installedSlugs.includes("live-chat") && permissions.canManageLiveChat) {
    promises.push(
      fetchLiveChatStats(siteId).then((data) => {
        results.push({
          slug: "live-chat",
          label: "Live Chat",
          count: data?.activeConversations ?? 0,
          countLabel: "open conversations",
          href: `/portal/sites/${siteId}/live-chat`,
        });
      }),
    );
  }

  // Orders
  if (installedSlugs.includes("ecommerce") && permissions.canManageOrders) {
    promises.push(
      fetchEcommerceStats(siteId).then((data) => {
        results.push({
          slug: "ecommerce-orders",
          label: "Orders",
          count: data?.pendingOrders ?? 0,
          countLabel: "pending orders",
          href: `/portal/sites/${siteId}/orders`,
        });
      }),
    );
  }

  // Products
  if (installedSlugs.includes("ecommerce") && permissions.canManageProducts) {
    // Reuse the ecommerce fetch — getDashboardStats includes product counts
    // but we already have it from orders. Add a separate entry.
    promises.push(
      getDashboardStats(siteId, "month")
        .then((stats) => {
          results.push({
            slug: "ecommerce-products",
            label: "Products",
            count: stats.activeProducts ?? 0,
            countLabel: "active products",
            href: `/portal/sites/${siteId}/products`,
          });
        })
        .catch(() => {}),
    );
  }

  // Quotes
  if (installedSlugs.includes("ecommerce") && permissions.canManageQuotes) {
    results.push({
      slug: "ecommerce-quotes",
      label: "Quotes",
      count: 0,
      countLabel: "active quotes",
      href: `/portal/sites/${siteId}/quotes`,
    });
  }

  // Bookings
  if (installedSlugs.includes("booking") && permissions.canManageBookings) {
    promises.push(
      fetchBookingStats(siteId).then((data) => {
        results.push({
          slug: "booking",
          label: "Bookings",
          count: data?.upcomingThisWeek ?? 0,
          countLabel: "upcoming bookings",
          href: `/portal/sites/${siteId}/bookings`,
        });
      }),
    );
  }

  // CRM
  if (installedSlugs.includes("crm") && permissions.canManageCrm) {
    promises.push(
      fetchCrmStats(agencyId, [siteId]).then((data) => {
        results.push({
          slug: "crm",
          label: "CRM",
          count: data?.totalContacts ?? 0,
          countLabel: "contacts",
          href: `/portal/sites/${siteId}/crm`,
        });
      }),
    );
  }

  // Automation
  if (
    installedSlugs.includes("automation") &&
    permissions.canManageAutomation
  ) {
    promises.push(
      fetchAutomationStats(siteId).then((data) => {
        results.push({
          slug: "automation",
          label: "Automation",
          count: data?.activeWorkflows ?? 0,
          countLabel: "active workflows",
          href: `/portal/sites/${siteId}/automation`,
        });
      }),
    );
  }

  // Marketing
  if (installedSlugs.includes("marketing") && permissions.canManageMarketing) {
    promises.push(
      fetchMarketingStats(siteId).then((data) => {
        results.push({
          slug: "marketing",
          label: "Marketing",
          count: data?.activeSubscribers ?? 0,
          countLabel: "subscribers",
          href: `/portal/sites/${siteId}/marketing`,
        });
      }),
    );
  }

  await Promise.all(promises);

  // Sort by a predictable order
  const order = [
    "live-chat",
    "ecommerce-orders",
    "ecommerce-products",
    "ecommerce-quotes",
    "booking",
    "crm",
    "automation",
    "marketing",
  ];
  results.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));

  return results;
}
