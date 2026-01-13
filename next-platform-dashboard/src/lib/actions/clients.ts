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
