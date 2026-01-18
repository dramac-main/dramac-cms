"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export interface PortalUser {
  userId: string;         // auth.users.id
  clientId: string;       // clients.id
  email: string;
  fullName: string;
  companyName: string;
  agencyId: string;
  canViewAnalytics: boolean;
  canEditContent: boolean;
  canViewInvoices: boolean;
}

/**
 * Get current portal user from Supabase Auth session
 * Links auth.users to clients via portal_user_id
 */
export async function getPortalUser(): Promise<PortalUser | null> {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Find client linked to this user
  const { data: client, error } = await supabase
    .from("clients")
    .select(`
      id,
      name,
      email,
      company,
      agency_id,
      has_portal_access,
      can_view_analytics,
      can_edit_content,
      can_view_invoices
    `)
    .eq("portal_user_id", user.id)
    .eq("has_portal_access", true)
    .single();

  if (error || !client) {
    // User exists but isn't a portal client
    return null;
  }

  // Update last login (fire and forget)
  supabase
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
  const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;
  
  if (!impersonatingClientId) {
    return { isImpersonating: false, clientId: null, impersonatorEmail: null };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
    
    const { data: client } = await supabase
      .from("clients")
      .select(`
        id,
        name,
        email,
        company,
        agency_id,
        has_portal_access,
        can_view_analytics,
        can_edit_content,
        can_view_invoices
      `)
      .eq("id", impersonation.clientId)
      .single();

    if (client) {
      return {
        user: {
          userId: "", // No auth user ID in impersonation
          clientId: client.id,
          email: client.email || "",
          fullName: client.name,
          companyName: client.company || "",
          agencyId: client.agency_id,
          canViewAnalytics: client.can_view_analytics ?? true,
          canEditContent: client.can_edit_content ?? false,
          canViewInvoices: client.can_view_invoices ?? true,
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
  password: string
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
    return { success: false, error: "Portal access not enabled for this account" };
  }

  return { success: true };
}

/**
 * Send magic link for portal login
 */
export async function sendMagicLink(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // First verify this email has portal access
  const { data: client } = await supabase
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
    return { success: false, error: "Portal account not set up. Please contact your agency." };
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
    return { success: false, error: "Failed to send login link. Please try again." };
  }

  return { success: true };
}

/**
 * Verify magic link token (handled by Supabase automatically via URL)
 */
export async function verifyMagicLink(): Promise<{ success: boolean; error?: string }> {
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
  const supabase = await createClient();

  const { data } = await supabase
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
  password: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Check if client already has portal access
  const { data: existingClient } = await supabase
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
    return { success: false, error: authError?.message || "Failed to create account" };
  }

  // Link to client
  const { error: updateError } = await supabase
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
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({
      can_view_analytics: permissions.canViewAnalytics,
      can_edit_content: permissions.canEditContent,
      can_view_invoices: permissions.canViewInvoices,
    })
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
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify this email has portal access
  const { data: client } = await supabase
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
 * Update client settings/profile
 */
export async function updateClientSettings(settings: {
  name?: string;
  phone?: string;
  company?: string;
}): Promise<{ success: boolean; error?: string }> {
  const user = await getPortalUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  const updateData: Record<string, string> = {};
  if (settings.name) updateData.name = settings.name;
  if (settings.phone) updateData.phone = settings.phone;
  if (settings.company) updateData.company = settings.company;

  const { error } = await supabase
    .from("clients")
    .update(updateData)
    .eq("id", user.clientId);

  if (error) {
    return { success: false, error: "Failed to update settings" };
  }

  return { success: true };
}

/**
 * Change portal user password
 */
export async function changePortalPassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message || "Failed to change password" };
  }

  return { success: true };
}
