"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createClientSchema, updateClientSchema } from "@/lib/validations/client";
import type { ClientFilters } from "@/types/client";

// Get all clients for the current organization
export async function getClients(filters?: ClientFilters) {
  const supabase = await createClient();

  // Get current user's organization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) throw new Error("No organization found");

  // Build query
  let query = supabase
    .from("clients")
    .select(`
      *,
      sites:sites(count)
    `)
    .eq("agency_id", profile.agency_id);

  // Apply filters
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  // Apply sorting
  const sortBy = filters?.sortBy || "created_at";
  const sortOrder = filters?.sortOrder || "desc";
  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  const { data, error } = await query;

  if (error) throw error;

  // Transform to include site_count
  return data?.map((client) => ({
    ...client,
    site_count: client.sites?.[0]?.count || 0,
    sites: undefined, // Remove nested object
  }));
}

// Get single client by ID
export async function getClient(clientId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      sites(*)
    `)
    .eq("id", clientId)
    .single();

  if (error) throw error;
  return data;
}

// Create new client
export async function createClientAction(formData: unknown) {
  const validated = createClientSchema.safeParse(formData);

  if (!validated.success) {
    return { error: "Invalid form data", details: validated.error.flatten() };
  }

  const supabase = await createClient();

  // Get current user's organization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) return { error: "No organization found" };

  // Create client
  const { data, error } = await supabase
    .from("clients")
    .insert({
      ...validated.data,
      agency_id: profile.agency_id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clients");
  return { success: true, data };
}

// Update client
export async function updateClientAction(clientId: string, formData: unknown) {
  const validated = updateClientSchema.safeParse(formData);

  if (!validated.success) {
    return { error: "Invalid form data", details: validated.error.flatten() };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .update(validated.data)
    .eq("id", clientId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true, data };
}

// Delete client
export async function deleteClientAction(clientId: string) {
  const supabase = await createClient();

  // Check if client has sites
  const { data: sites } = await supabase
    .from("sites")
    .select("id")
    .eq("client_id", clientId)
    .limit(1);

  if (sites && sites.length > 0) {
    return { error: "Cannot delete client with existing sites. Delete sites first." };
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clients");
  return { success: true };
}

// Invite client to portal
export async function inviteClientToPortal(clientId: string) {
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, email, name, agency_id")
    .eq("id", clientId)
    .single();

  if (!client) {
    return { error: "Client not found" };
  }

  if (!client.email) {
    return { error: "Client must have an email address" };
  }

  // Mark the client as having portal access
  const { error } = await supabase
    .from("clients")
    .update({
      has_portal_access: true,
    })
    .eq("id", clientId);

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await logClientActivity(clientId, "portal.invited", "client", clientId, {
    email: client.email,
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// Revoke client portal access
export async function revokeClientPortalAccess(clientId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({
      has_portal_access: false,
      portal_user_id: null,
    })
    .eq("id", clientId);

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await logClientActivity(clientId, "portal.access_revoked", "client", clientId, {});

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// Impersonate client (set session flag)
export async function impersonateClient(clientId: string) {
  const supabase = await createClient();

  // Verify client exists and has portal access
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, has_portal_access")
    .eq("id", clientId)
    .single();

  if (!client) {
    return { error: "Client not found" };
  }

  if (!client.has_portal_access) {
    return { error: "Client does not have portal access enabled" };
  }

  // Store impersonation state in cookies for middleware to pick up
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  
  cookieStore.set("impersonating_client_id", client.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 4, // 4 hours
    path: "/",
  });

  return { success: true, clientId: client.id };
}

// Stop impersonating client
export async function stopImpersonatingClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  
  cookieStore.delete("impersonating_client_id");
  
  revalidatePath("/");
  return { success: true };
}

// Helper to log client activity (placeholder - activity_logs table pending)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function logClientActivity(
  _clientId: string, 
  _action: string, 
  _entityType: string, 
  _entityId: string, 
  _metadata: Record<string, unknown>
) {
  // Activity logging will be implemented when activity_logs table is created
  // This is a placeholder that doesn't fail the calling action
  return;
}
