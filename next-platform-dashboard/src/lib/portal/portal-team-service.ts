"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendBrandedEmail } from "@/lib/email/send-branded-email";

// ============================================
// TYPES
// ============================================

export interface PortalTeamMember {
  id: string;
  clientId: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  jobTitle: string | null;
  department: string | null;
  avatarUrl: string | null;
  status: "active" | "invited" | "inactive";
  canViewAnalytics: boolean;
  canEditContent: boolean;
  canViewInvoices: boolean;
  canManageLiveChat: boolean;
  canManageOrders: boolean;
  canManageProducts: boolean;
  canManageBookings: boolean;
  canManageCrm: boolean;
  canManageAutomation: boolean;
  canManageQuotes: boolean;
  canManageAgents: boolean;
  canManageCustomers: boolean;
  canManageMarketing: boolean;
  notes: string | null;
  invitedAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamMemberInput {
  name: string;
  email: string;
  role?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  status?: "active" | "invited";
  canViewAnalytics?: boolean;
  canEditContent?: boolean;
  canViewInvoices?: boolean;
  canManageLiveChat?: boolean;
  canManageOrders?: boolean;
  canManageProducts?: boolean;
  canManageBookings?: boolean;
  canManageCrm?: boolean;
  canManageAutomation?: boolean;
  canManageQuotes?: boolean;
  canManageAgents?: boolean;
  canManageCustomers?: boolean;
  canManageMarketing?: boolean;
  notes?: string;
}

export interface UpdateTeamMemberInput extends Omit<Partial<CreateTeamMemberInput>, 'status'> {
  status?: "active" | "invited" | "inactive";
}

// ============================================
// HELPERS
// ============================================

async function getPortalClientId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("impersonating_client_id")?.value || null;
}

function mapToTeamMember(data: Record<string, unknown>): PortalTeamMember {
  return {
    id: data.id as string,
    clientId: data.client_id as string,
    name: data.name as string,
    email: data.email as string,
    role: (data.role as string) || "member",
    phone: (data.phone as string) || null,
    jobTitle: (data.job_title as string) || null,
    department: (data.department as string) || null,
    avatarUrl: (data.avatar_url as string) || null,
    status: (data.status as "active" | "invited" | "inactive") || "active",
    canViewAnalytics: (data.can_view_analytics as boolean) || false,
    canEditContent: (data.can_edit_content as boolean) || false,
    canViewInvoices: (data.can_view_invoices as boolean) || false,
    canManageLiveChat: (data.can_manage_live_chat as boolean) || false,
    canManageOrders: (data.can_manage_orders as boolean) || false,
    canManageProducts: (data.can_manage_products as boolean) || false,
    canManageBookings: (data.can_manage_bookings as boolean) || false,
    canManageCrm: (data.can_manage_crm as boolean) || false,
    canManageAutomation: (data.can_manage_automation as boolean) || false,
    canManageQuotes: (data.can_manage_quotes as boolean) || false,
    canManageAgents: (data.can_manage_agents as boolean) || false,
    canManageCustomers: (data.can_manage_customers as boolean) || false,
    canManageMarketing: (data.can_manage_marketing as boolean) || false,
    notes: (data.notes as string) || null,
    invitedAt: (data.invited_at as string) || null,
    lastActiveAt: (data.last_active_at as string) || null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

// ============================================
// API
// ============================================

/**
 * Get all team members for the current portal client
 */
export async function getPortalTeamMembers(filters?: {
  search?: string;
  status?: string;
  department?: string;
}): Promise<{ members: PortalTeamMember[]; total: number }> {
  const clientId = await getPortalClientId();
  if (!clientId) return { members: [], total: 0 };

  const supabase: any = await createClient();

  let query = supabase
    .from("portal_team_members")
    .select("*", { count: "exact" })
    .eq("client_id", clientId)
    .order("name");

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,job_title.ilike.%${filters.search}%`,
    );
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.department && filters.department !== "all") {
    query = query.eq("department", filters.department);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[PortalTeamService] Error fetching team members:", error);
    return { members: [], total: 0 };
  }

  return {
    members: (data || []).map(mapToTeamMember),
    total: count || 0,
  };
}

/**
 * Get a single team member by ID
 */
export async function getPortalTeamMember(
  memberId: string,
): Promise<PortalTeamMember | null> {
  const clientId = await getPortalClientId();
  if (!clientId) return null;

  const supabase: any = await createClient();

  const { data, error } = await supabase
    .from("portal_team_members")
    .select("*")
    .eq("id", memberId)
    .eq("client_id", clientId)
    .single();

  if (error || !data) return null;

  return mapToTeamMember(data);
}

/**
 * Create a new team member and send invitation email
 */
export async function createPortalTeamMember(
  input: CreateTeamMemberInput,
): Promise<{ success: boolean; member?: PortalTeamMember; error?: string }> {
  const clientId = await getPortalClientId();
  if (!clientId) return { success: false, error: "Not authenticated" };

  const supabase: any = await createClient();

  const { data, error } = await supabase
    .from("portal_team_members")
    .insert({
      client_id: clientId,
      name: input.name,
      email: input.email.toLowerCase().trim(),
      role: input.role || "member",
      phone: input.phone || null,
      job_title: input.jobTitle || null,
      department: input.department || null,
      status: "invited",
      can_view_analytics: input.canViewAnalytics || false,
      can_edit_content: input.canEditContent || false,
      can_view_invoices: input.canViewInvoices || false,
      can_manage_live_chat: input.canManageLiveChat || false,
      can_manage_orders: input.canManageOrders || false,
      can_manage_products: input.canManageProducts || false,
      can_manage_bookings: input.canManageBookings || false,
      can_manage_crm: input.canManageCrm || false,
      can_manage_automation: input.canManageAutomation || false,
      can_manage_quotes: input.canManageQuotes || false,
      can_manage_agents: input.canManageAgents || false,
      can_manage_customers: input.canManageCustomers || false,
      can_manage_marketing: input.canManageMarketing || false,
      notes: input.notes || null,
      invited_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "A team member with this email already exists",
      };
    }
    console.error("[PortalTeamService] Error creating team member:", error);
    return { success: false, error: "Failed to add team member" };
  }

  // Send invitation email
  try {
    // Get client info for the email
    const { data: client } = await supabase
      .from("clients")
      .select("name, company, agency_id")
      .eq("id", clientId)
      .single();

    const agencyId = client?.agency_id || null;
    const businessName = client?.company || client?.name || "the team";
    const inviterName = client?.name || "Your team admin";
    const portalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://app.dramacagency.com"}/portal/login`;

    await sendBrandedEmail(agencyId, {
      to: { email: input.email.toLowerCase().trim(), name: input.name },
      emailType: "portal_team_invitation",
      data: {
        inviterName,
        businessName,
        role: input.role || "member",
        portalUrl,
        memberName: input.name,
      },
    });
  } catch (emailError) {
    // Don't fail the member creation if email fails
    console.error(
      "[PortalTeamService] Failed to send invitation email:",
      emailError,
    );
  }

  return { success: true, member: mapToTeamMember(data) };
}

/**
 * Update a team member
 */
export async function updatePortalTeamMember(
  memberId: string,
  input: UpdateTeamMemberInput,
): Promise<{ success: boolean; error?: string }> {
  const clientId = await getPortalClientId();
  if (!clientId) return { success: false, error: "Not authenticated" };

  const supabase: any = await createClient();

  // Build update object, only including provided fields
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.email !== undefined)
    updateData.email = input.email.toLowerCase().trim();
  if (input.role !== undefined) updateData.role = input.role;
  if (input.phone !== undefined) updateData.phone = input.phone || null;
  if (input.jobTitle !== undefined)
    updateData.job_title = input.jobTitle || null;
  if (input.department !== undefined)
    updateData.department = input.department || null;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.canViewAnalytics !== undefined)
    updateData.can_view_analytics = input.canViewAnalytics;
  if (input.canEditContent !== undefined)
    updateData.can_edit_content = input.canEditContent;
  if (input.canViewInvoices !== undefined)
    updateData.can_view_invoices = input.canViewInvoices;
  if (input.canManageLiveChat !== undefined)
    updateData.can_manage_live_chat = input.canManageLiveChat;
  if (input.canManageOrders !== undefined)
    updateData.can_manage_orders = input.canManageOrders;
  if (input.canManageProducts !== undefined)
    updateData.can_manage_products = input.canManageProducts;
  if (input.canManageBookings !== undefined)
    updateData.can_manage_bookings = input.canManageBookings;
  if (input.canManageCrm !== undefined)
    updateData.can_manage_crm = input.canManageCrm;
  if (input.canManageAutomation !== undefined)
    updateData.can_manage_automation = input.canManageAutomation;
  if (input.canManageQuotes !== undefined)
    updateData.can_manage_quotes = input.canManageQuotes;
  if (input.canManageAgents !== undefined)
    updateData.can_manage_agents = input.canManageAgents;
  if (input.canManageCustomers !== undefined)
    updateData.can_manage_customers = input.canManageCustomers;
  if (input.canManageMarketing !== undefined)
    updateData.can_manage_marketing = input.canManageMarketing;
  if (input.notes !== undefined) updateData.notes = input.notes || null;

  const { error } = await supabase
    .from("portal_team_members")
    .update(updateData)
    .eq("id", memberId)
    .eq("client_id", clientId);

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "A team member with this email already exists",
      };
    }
    console.error("[PortalTeamService] Error updating team member:", error);
    return { success: false, error: "Failed to update team member" };
  }

  return { success: true };
}

/**
 * Delete a team member
 */
export async function deletePortalTeamMember(
  memberId: string,
): Promise<{ success: boolean; error?: string }> {
  const clientId = await getPortalClientId();
  if (!clientId) return { success: false, error: "Not authenticated" };

  const supabase: any = await createClient();

  const { error } = await supabase
    .from("portal_team_members")
    .delete()
    .eq("id", memberId)
    .eq("client_id", clientId);

  if (error) {
    console.error("[PortalTeamService] Error deleting team member:", error);
    return { success: false, error: "Failed to delete team member" };
  }

  return { success: true };
}

/**
 * Get unique departments for filter dropdown
 */
export async function getPortalTeamDepartments(): Promise<string[]> {
  const clientId = await getPortalClientId();
  if (!clientId) return [];

  const supabase: any = await createClient();

  const { data } = await supabase
    .from("portal_team_members")
    .select("department")
    .eq("client_id", clientId)
    .not("department", "is", null)
    .order("department");

  const departments = new Set<string>();
  data?.forEach((d: any) => {
    if (d.department) departments.add(d.department);
  });

  return Array.from(departments);
}

/**
 * Get team stats for the current portal client
 */
export async function getPortalTeamStats(): Promise<{
  total: number;
  active: number;
  invited: number;
  inactive: number;
}> {
  const clientId = await getPortalClientId();
  if (!clientId) return { total: 0, active: 0, invited: 0, inactive: 0 };

  const supabase: any = await createClient();

  const { data } = await supabase
    .from("portal_team_members")
    .select("status")
    .eq("client_id", clientId);

  if (!data) return { total: 0, active: 0, invited: 0, inactive: 0 };

  return {
    total: data.length,
    active: data.filter((m: any) => m.status === "active").length,
    invited: data.filter((m: any) => m.status === "invited").length,
    inactive: data.filter((m: any) => m.status === "inactive").length,
  };
}

/**
 * Resend invitation email to a team member
 */
export async function resendPortalTeamInvitation(
  memberId: string,
): Promise<{ success: boolean; error?: string }> {
  const clientId = await getPortalClientId();
  if (!clientId) return { success: false, error: "Not authenticated" };

  const supabase: any = await createClient();

  // Get the member
  const { data: member } = await supabase
    .from("portal_team_members")
    .select("*")
    .eq("id", memberId)
    .eq("client_id", clientId)
    .single();

  if (!member) return { success: false, error: "Team member not found" };

  // Get client info for email
  const { data: client } = await supabase
    .from("clients")
    .select("name, company, agency_id")
    .eq("id", clientId)
    .single();

  const agencyId = client?.agency_id || null;
  const businessName = client?.company || client?.name || "the team";
  const inviterName = client?.name || "Your team admin";
  const portalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://app.dramacagency.com"}/portal/login`;

  try {
    await sendBrandedEmail(agencyId, {
      to: { email: member.email, name: member.name },
      emailType: "portal_team_invitation",
      data: {
        inviterName,
        businessName,
        role: member.role || "member",
        portalUrl,
        memberName: member.name,
      },
    });

    // Update invited_at timestamp
    await supabase
      .from("portal_team_members")
      .update({ invited_at: new Date().toISOString() })
      .eq("id", memberId)
      .eq("client_id", clientId);

    return { success: true };
  } catch (error) {
    console.error("[PortalTeamService] Failed to resend invitation:", error);
    return { success: false, error: "Failed to send invitation email" };
  }
}

/**
 * Get the portal owner (client) as a virtual team member.
 * The portal owner is always included as the first team member with "owner" role.
 */
export async function getPortalOwner(): Promise<PortalTeamMember | null> {
  const clientId = await getPortalClientId();
  if (!clientId) return null;

  const supabase: any = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, email, company, phone, created_at")
    .eq("id", clientId)
    .single();

  if (!client) return null;

  return {
    id: `owner-${client.id}`,
    clientId: client.id,
    name: client.name || "Account Owner",
    email: client.email || "",
    role: "owner",
    phone: client.phone || null,
    jobTitle: "Account Owner",
    department: null,
    avatarUrl: null,
    status: "active",
    canViewAnalytics: true,
    canEditContent: true,
    canViewInvoices: true,
    canManageLiveChat: true,
    canManageOrders: true,
    canManageProducts: true,
    canManageBookings: true,
    canManageCrm: true,
    canManageAutomation: true,
    canManageQuotes: true,
    canManageAgents: true,
    canManageCustomers: true,
    canManageMarketing: true,
    notes: null,
    invitedAt: null,
    lastActiveAt: null,
    createdAt: client.created_at ?? "",
    updatedAt: client.created_at ?? "",
  };
}
