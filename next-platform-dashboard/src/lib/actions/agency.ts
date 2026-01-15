"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getAgency(userId: string) {
  const supabase = await createClient();

  // First get the user's profile to find their agency
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", userId)
    .single();

  if (!profile?.agency_id) {
    // Try to find agency where user is owner
    const { data: agency } = await supabase
      .from("agencies")
      .select("*")
      .eq("owner_id", userId)
      .single();
    
    return agency;
  }

  // Get the agency details
  const { data: agency, error } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", profile.agency_id)
    .single();

  if (error) {
    console.error("Error fetching agency:", error);
    return null;
  }

  return agency;
}

export async function updateAgency(
  agencyId: string,
  updates: {
    name?: string;
    slug?: string;
    billing_email?: string | null;
  }
) {
  const supabase = await createClient();

  // Check if slug is being changed and if it's already taken
  if (updates.slug) {
    const { data: existingAgency } = await supabase
      .from("agencies")
      .select("id")
      .eq("slug", updates.slug)
      .neq("id", agencyId)
      .single();

    if (existingAgency) {
      return { error: "This slug is already taken" };
    }
  }

  const dbUpdates: Record<string, string | null | undefined> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) {
    dbUpdates.name = updates.name;
  }
  if (updates.slug !== undefined) {
    dbUpdates.slug = updates.slug;
  }
  if (updates.billing_email !== undefined) {
    dbUpdates.billing_email = updates.billing_email;
  }

  const { error } = await supabase
    .from("agencies")
    .update(dbUpdates)
    .eq("id", agencyId);

  if (error) {
    console.error("Error updating agency:", error);
    return { error: "Failed to update agency" };
  }

  revalidatePath("/settings/agency");
  return { success: true };
}

export async function getAgencyBranding(agencyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agencies")
    .select("custom_branding, white_label_enabled")
    .eq("id", agencyId)
    .single();

  if (error) {
    console.error("Error fetching branding:", error);
    return null;
  }

  return data;
}

export async function updateAgencyBranding(
  agencyId: string,
  branding: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    favicon_url?: string;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("agencies")
    .update({
      custom_branding: branding,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agencyId);

  if (error) {
    console.error("Error updating branding:", error);
    return { error: "Failed to update branding" };
  }

  revalidatePath("/settings/branding");
  return { success: true };
}

export async function uploadBrandingLogo(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("file") as File;
  const agencyId = formData.get("agencyId") as string;

  if (!file || !agencyId) {
    return { error: "Missing file or agency ID" };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${agencyId}/logo-${Date.now()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("branding")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Error uploading logo:", uploadError);
    return { error: "Failed to upload logo" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("branding")
    .getPublicUrl(fileName);

  // Update agency branding with new logo URL
  const { data: existingAgency } = await supabase
    .from("agencies")
    .select("custom_branding")
    .eq("id", agencyId)
    .single();

  const existingBranding = (existingAgency?.custom_branding as Record<string, string>) || {};

  const { error: updateError } = await supabase
    .from("agencies")
    .update({
      custom_branding: {
        ...existingBranding,
        logo_url: urlData.publicUrl,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", agencyId);

  if (updateError) {
    console.error("Error updating agency branding:", updateError);
    return { error: "Failed to update branding with logo" };
  }

  revalidatePath("/settings/branding");
  return { success: true, url: urlData.publicUrl };
}
