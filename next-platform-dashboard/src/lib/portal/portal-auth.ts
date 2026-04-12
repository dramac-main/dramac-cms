"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export interface PortalUser {
  userId: string; // auth.users.id
  clientId: string; // clients.id
  email: string;
  fullName: string;
  companyName: string;
  agencyId: string;
  canViewAnalytics: boolean;
  canEditContent: boolean;
  canViewInvoices: boolean;
  // Module permissions
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
}

/**
 * Get current portal user from Supabase Auth session
 * Links auth.users to clients via portal_user_id
 */
export async function getPortalUser(): Promise<PortalUser | null> {
  const supabase = await createClient();
  const admin = createAdminClient();

  // Get authenticated user (requires session cookies)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Find client linked to this user (admin client bypasses RLS for portal users)
  const { data: client, error } = await admin
    .from("clients")
    .select(
      `
      id,
      name,
      email,
      company,
      agency_id,
      has_portal_access,
      can_view_analytics,
      can_edit_content,
      can_view_invoices,
      can_manage_live_chat,
      can_manage_orders,
      can_manage_products,
      can_manage_bookings,
      can_manage_crm,
      can_manage_automation,
      can_manage_quotes,
      can_manage_agents,
      can_manage_customers,
      can_manage_marketing
    `,
    )
    .eq("portal_user_id", user.id)
    .eq("has_portal_access", true)
    .single();

  if (error || !client) {
    // User exists but isn't a portal client
    return null;
  }

  // Update last login (fire and forget)
  admin
    .from("clients")
    .update({ portal_last_login: new Date().toISOString() })
    .eq("id", client.id)
    .then(() => {});

  return {
    userId: user.id,
    clientId: client.id,
    email: client.email || user.email || "",
    fullName: client.name,
    companyName: client.company || "",
    agencyId: client.agency_id,
    canViewAnalytics: client.can_view_analytics ?? true,
    canEditContent: client.can_edit_content ?? false,
    canViewInvoices: client.can_view_invoices ?? true,
    canManageLiveChat: client.can_manage_live_chat ?? false,
    canManageOrders: client.can_manage_orders ?? false,
    canManageProducts: client.can_manage_products ?? false,
    canManageBookings: client.can_manage_bookings ?? false,
    canManageCrm: client.can_manage_crm ?? false,
    canManageAutomation: client.can_manage_automation ?? false,
    canManageQuotes: client.can_manage_quotes ?? false,
    canManageAgents: client.can_manage_agents ?? false,
    canManageCustomers: client.can_manage_customers ?? false,
    canManageMarketing: client.can_manage_marketing ?? false,
  };
}

/**
 * Check if currently in impersonation mode (agency viewing as client)
 */
export async function getImpersonationState(): Promise<{
  isImpersonating: boolean;
  clientId: string | null;
  impersonatorEmail: string | null;
}> {
  const cookieStore = await cookies();
  const impersonatingClientId = cookieStore.get(
    "impersonating_client_id",
  )?.value;

  if (!impersonatingClientId) {
    return { isImpersonating: false, clientId: null, impersonatorEmail: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    isImpersonating: true,
    clientId: impersonatingClientId,
    impersonatorEmail: user?.email || null,
  };
}

/**
 * Get portal session - supports both real auth and impersonation
 */
export async function getPortalSession(): Promise<{
  user: PortalUser | null;
  isImpersonating: boolean;
  impersonatorEmail: string | null;
}> {
  // First check for impersonation
  const impersonation = await getImpersonationState();

  if (impersonation.isImpersonating && impersonation.clientId) {
    const supabase = await createClient();
    const admin = createAdminClient();

    // Verify the impersonating user belongs to the same agency as the client
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    let agencyFilter: string | null = null;
    if (authUser) {
      const { data: profile } = await admin
        .from("profiles")
        .select("agency_id")
        .eq("id", authUser.id)
        .single();
      agencyFilter = profile?.agency_id || null;
    }

    let query = admin
      .from("clients")
      .select(
        `
        id,
        name,
        email,
        company,
        agency_id,
        has_portal_access,
        can_view_analytics,
        can_edit_content,
        can_view_invoices,
        can_manage_live_chat,
        can_manage_orders,
        can_manage_products,
        can_manage_bookings,
        can_manage_crm,
        can_manage_automation,
        can_manage_quotes,
        can_manage_agents,
      can_manage_customers,
      can_manage_marketing
      `,
      )
      .eq("id", impersonation.clientId);

    // Defense-in-depth: verify impersonator's agency matches client's agency
    if (agencyFilter) {
      query = query.eq("agency_id", agencyFilter);
    }

    const { data: client } = await query.single();

    if (client) {
      return {
        user: {
          userId: authUser?.id || "", // Admin's auth ID (the impersonator)
          clientId: client.id,
          email: client.email || "",
          fullName: client.name,
          companyName: client.company || "",
          agencyId: client.agency_id,
          canViewAnalytics: client.can_view_analytics ?? true,
          canEditContent: client.can_edit_content ?? false,
          canViewInvoices: client.can_view_invoices ?? true,
          canManageLiveChat: client.can_manage_live_chat ?? false,
          canManageOrders: client.can_manage_orders ?? false,
          canManageProducts: client.can_manage_products ?? false,
          canManageBookings: client.can_manage_bookings ?? false,
          canManageCrm: client.can_manage_crm ?? false,
          canManageAutomation: client.can_manage_automation ?? false,
          canManageQuotes: client.can_manage_quotes ?? false,
          canManageAgents: client.can_manage_agents ?? false,
          canManageCustomers: client.can_manage_customers ?? false,
          canManageMarketing: client.can_manage_marketing ?? false,
        },
        isImpersonating: true,
        impersonatorEmail: impersonation.impersonatorEmail,
      };
    }
  }

  // Check for real portal auth
  const user = await getPortalUser();

  return {
    user,
    isImpersonating: false,
    impersonatorEmail: null,
  };
}

/**
 * Require portal authentication - redirect to login if not authenticated
 */
export async function requirePortalAuth(): Promise<PortalUser> {
  const { user, isImpersonating } = await getPortalSession();

  if (!user) {
    // If not impersonating and not authenticated, redirect to login
    if (!isImpersonating) {
      redirect("/portal/login");
    }
    // If impersonating but client not found, redirect to dashboard
    redirect("/dashboard");
  }

  return user;
}

/**
 * Sign in to portal with password
 */
export async function portalSignIn(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: "Invalid email or password" };
  }

  // Verify this user is a portal client
  const portalUser = await getPortalUser();
  if (!portalUser) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Portal access not enabled for this account",
    };
  }

  return { success: true };
}

/**
 * Send magic link for portal login
 */
export async function sendMagicLink(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  // First verify this email has portal access (admin client bypasses RLS)
  const { data: client } = await admin
    .from("clients")
    .select("id, portal_user_id, has_portal_access")
    .eq("email", email)
    .eq("has_portal_access", true)
    .single();

  if (!client) {
    // Don't reveal if email exists or not for security
    return { success: true }; // Silently succeed but don't send email
  }

  if (!client.portal_user_id) {
    return {
      success: false,
      error: "Portal account not set up. Please contact your agency.",
    };
  }

  // Send magic link
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/portal/verify`,
    },
  });

  if (error) {
    console.error("Magic link error:", error);
    return {
      success: false,
      error: "Failed to send login link. Please try again.",
    };
  }

  return { success: true };
}

/**
 * Verify magic link token (handled by Supabase automatically via URL)
 */
export async function verifyMagicLink(): Promise<{
  success: boolean;
  error?: string;
}> {
  // Supabase handles this automatically when user clicks the link
  // This function is here to verify the session after redirect
  const portalUser = await getPortalUser();

  if (!portalUser) {
    return { success: false, error: "Invalid or expired link" };
  }

  return { success: true };
}

/**
 * Sign out of portal
 */
export async function portalSignOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/portal/login");
}

/**
 * Check if email has portal access
 */
export async function checkPortalAccess(email: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("clients")
    .select("id")
    .eq("email", email)
    .eq("has_portal_access", true)
    .single();

  return !!data;
}

/**
 * Create a portal user account for a client
 * Called when agency enables portal access
 */
export async function createPortalAccount(
  clientId: string,
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  // Check if client already has portal access (admin client bypasses RLS)
  const { data: existingClient } = await admin
    .from("clients")
    .select("id, portal_user_id")
    .eq("id", clientId)
    .single();

  if (existingClient?.portal_user_id) {
    return { success: false, error: "Client already has a portal account" };
  }

  // Create Supabase Auth user using signUp (admin.createUser requires service role)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "portal_client",
        client_id: clientId,
      },
    },
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || "Failed to create account",
    };
  }

  // Link to client (admin client bypasses RLS)
  const { error: updateError } = await admin
    .from("clients")
    .update({
      portal_user_id: authData.user.id,
      has_portal_access: true,
    })
    .eq("id", clientId);

  if (updateError) {
    return { success: false, error: "Failed to link account to client" };
  }

  return { success: true };
}

/**
 * Update client portal permissions
 */
export async function updatePortalPermissions(
  clientId: string,
  permissions: {
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
  },
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();

  const updateData: Record<string, boolean | undefined> = {};
  if (permissions.canViewAnalytics !== undefined)
    updateData.can_view_analytics = permissions.canViewAnalytics;
  if (permissions.canEditContent !== undefined)
    updateData.can_edit_content = permissions.canEditContent;
  if (permissions.canViewInvoices !== undefined)
    updateData.can_view_invoices = permissions.canViewInvoices;
  if (permissions.canManageLiveChat !== undefined)
    updateData.can_manage_live_chat = permissions.canManageLiveChat;
  if (permissions.canManageOrders !== undefined)
    updateData.can_manage_orders = permissions.canManageOrders;
  if (permissions.canManageProducts !== undefined)
    updateData.can_manage_products = permissions.canManageProducts;
  if (permissions.canManageBookings !== undefined)
    updateData.can_manage_bookings = permissions.canManageBookings;
  if (permissions.canManageCrm !== undefined)
    updateData.can_manage_crm = permissions.canManageCrm;
  if (permissions.canManageAutomation !== undefined)
    updateData.can_manage_automation = permissions.canManageAutomation;
  if (permissions.canManageQuotes !== undefined)
    updateData.can_manage_quotes = permissions.canManageQuotes;
  if (permissions.canManageAgents !== undefined)
    updateData.can_manage_agents = permissions.canManageAgents;
  if (permissions.canManageCustomers !== undefined)
    updateData.can_manage_customers = permissions.canManageCustomers;
  if (permissions.canManageMarketing !== undefined)
    updateData.can_manage_marketing = permissions.canManageMarketing;

  const { error } = await admin
    .from("clients")
    .update(updateData)
    .eq("id", clientId);

  if (error) {
    return { success: false, error: "Failed to update permissions" };
  }

  return { success: true };
}

/**
 * Reset portal password
 */
export async function resetPortalPassword(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  // Verify this email has portal access (admin client bypasses RLS)
  const { data: client } = await admin
    .from("clients")
    .select("id, portal_user_id")
    .eq("email", email)
    .eq("has_portal_access", true)
    .single();

  if (!client || !client.portal_user_id) {
    // Silently succeed for security
    return { success: true };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/portal/reset-password`,
  });

  if (error) {
    return { success: false, error: "Failed to send reset email" };
  }

  return { success: true };
}

/**
 * Get client profile settings (loads from clients table, NOT auth metadata).
 * Works correctly for both real portal users and impersonation mode.
 */
export async function getClientSettings(): Promise<{
  name: string;
  email: string;
  phone: string;
  company: string;
} | null> {
  const session = await getPortalSession();
  if (!session.user) return null;

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("name, email, phone, company")
    .eq("id", session.user.clientId)
    .single();

  if (!client) return null;

  return {
    name: client.name || "",
    email: client.email || session.user.email || "",
    phone: client.phone || "",
    company: client.company || "",
  };
}

/**
 * Update client settings/profile
 */
export async function updateClientSettings(settings: {
  name?: string;
  phone?: string;
  company?: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await getPortalSession();
  if (!session.user) {
    return { success: false, error: "Not authenticated" };
  }

  const admin = createAdminClient();

  const updateData: Record<string, string> = {};
  if (settings.name) updateData.name = settings.name;
  if (settings.phone) updateData.phone = settings.phone;
  if (settings.company) updateData.company = settings.company;

  const { error } = await admin
    .from("clients")
    .update(updateData)
    .eq("id", session.user.clientId);

  if (error) {
    return { success: false, error: "Failed to update settings" };
  }

  // Only update auth metadata if NOT impersonating (avoid corrupting agency owner's metadata)
  if (!session.isImpersonating) {
    const supabase = await createClient();
    await supabase.auth.updateUser({
      data: {
        ...(settings.name && { full_name: settings.name }),
        ...(settings.phone && { phone: settings.phone }),
        ...(settings.company && { company: settings.company }),
      },
    });
  }

  return { success: true };
}

/**
 * Change portal user password
 */
export async function changePortalPassword(
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return {
      success: false,
      error: error.message || "Failed to change password",
    };
  }

  return { success: true };
}

/**
 * Get notification preferences for the current portal client.
 * Stored as JSON in clients.notes field.
 */
export async function getClientNotifications(): Promise<{
  emailNotifications: boolean;
  ticketUpdates: boolean;
  siteAlerts: boolean;
  marketingEmails: boolean;
}> {
  const defaults = {
    emailNotifications: true,
    ticketUpdates: true,
    siteAlerts: true,
    marketingEmails: false,
  };

  const session = await getPortalSession();
  if (!session.user) return defaults;

  const admin = createAdminClient();
  const { data } = await admin
    .from("clients")
    .select("notes")
    .eq("id", session.user.clientId)
    .single();

  if (data?.notes) {
    try {
      const parsed = JSON.parse(data.notes);
      if (parsed?.notification_preferences) {
        return {
          emailNotifications:
            parsed.notification_preferences.emailNotifications ?? true,
          ticketUpdates: parsed.notification_preferences.ticketUpdates ?? true,
          siteAlerts: parsed.notification_preferences.siteAlerts ?? true,
          marketingEmails:
            parsed.notification_preferences.marketingEmails ?? false,
        };
      }
    } catch {
      // notes is not JSON, ignore
    }
  }

  return defaults;
}

/**
 * Update notification preferences for the current portal client.
 */
export async function updateClientNotifications(prefs: {
  emailNotifications: boolean;
  ticketUpdates: boolean;
  siteAlerts: boolean;
  marketingEmails: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const session = await getPortalSession();
  if (!session.user) {
    return { success: false, error: "Not authenticated" };
  }

  const admin = createAdminClient();

  // Read existing notes to preserve other data
  const { data: existing } = await admin
    .from("clients")
    .select("notes")
    .eq("id", session.user.clientId)
    .single();

  let notesObj: Record<string, unknown> = {};
  if (existing?.notes) {
    try {
      notesObj = JSON.parse(existing.notes);
    } catch {
      notesObj = { _legacy_notes: existing.notes };
    }
  }

  notesObj.notification_preferences = prefs;

  const { error } = await admin
    .from("clients")
    .update({ notes: JSON.stringify(notesObj) })
    .eq("id", session.user.clientId);

  if (error) {
    return { success: false, error: "Failed to save preferences" };
  }

  return { success: true };
}
