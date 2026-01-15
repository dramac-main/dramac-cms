"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: {
    name?: string;
  }
) {
  const supabase = await createClient();

  const dbUpdates: Record<string, string | null | undefined> = {
    updated_at: new Date().toISOString(),
  };
  
  if (updates.name !== undefined) {
    dbUpdates.name = updates.name;
  }

  const { error } = await supabase
    .from("profiles")
    .update(dbUpdates)
    .eq("id", userId);

  if (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile" };
  }

  revalidatePath("/settings/profile");
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("file") as File;
  const userId = formData.get("userId") as string;

  if (!file || !userId) {
    return { error: "Missing file or user ID" };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    return { error: "Failed to upload image" };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName);

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);

  if (updateError) {
    console.error("Error updating avatar URL:", updateError);
    return { error: "Failed to save avatar" };
  }

  revalidatePath("/settings/profile");
  return { url: publicUrl };
}

export async function deleteAvatar(userId: string) {
  const supabase = await createClient();

  // Get current avatar URL to delete from storage
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();

  if (profile?.avatar_url) {
    // Extract file path from URL
    const urlParts = profile.avatar_url.split("/avatars/");
    if (urlParts[1]) {
      await supabase.storage.from("avatars").remove([urlParts[1]]);
    }
  }

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", userId);

  if (error) {
    console.error("Error removing avatar:", error);
    return { error: "Failed to remove avatar" };
  }

  revalidatePath("/settings/profile");
  return { success: true };
}
