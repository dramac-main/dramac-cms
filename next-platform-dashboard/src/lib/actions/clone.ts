"use server";

import { createClient } from "@/lib/supabase/server";
import { cloneSite, clonePage, duplicatePage, CloneOptions, CloneResult } from "@/lib/sites/clone";
import { revalidatePath } from "next/cache";
import { checkRateLimit, recordRateLimitedAction } from "@/lib/rate-limit";

export async function cloneSiteAction(
  sourceSiteId: string,
  options: CloneOptions
): Promise<CloneResult> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(user.id, "siteCreation");
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
    };
  }

  // Perform clone
  const result = await cloneSite(sourceSiteId, options);

  if (result.success) {
    // Record rate-limited action
    await recordRateLimitedAction(user.id, "siteCreation", {
      action: "clone",
      sourceSiteId,
      newSiteId: result.newSiteId,
    });

    // Revalidate sites list
    revalidatePath("/dashboard/sites");
    revalidatePath(`/dashboard/clients/${options.clientId}`);
  }

  return result;
}

export async function clonePageAction(
  sourcePageId: string,
  targetSiteId: string,
  newSlug?: string
): Promise<{ success: boolean; newPageId?: string; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(user.id, "pageCreation");
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
    };
  }

  // Perform clone
  const result = await clonePage(sourcePageId, targetSiteId, newSlug);

  if (result.success) {
    await recordRateLimitedAction(user.id, "pageCreation", {
      action: "clone",
      sourcePageId,
      newPageId: result.newPageId,
    });

    revalidatePath(`/dashboard/sites/${targetSiteId}`);
  }

  return result;
}

export async function duplicatePageAction(
  pageId: string,
  siteId: string
): Promise<{ success: boolean; newPageId?: string; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(user.id, "pageCreation");
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
    };
  }

  // Perform duplication
  const result = await duplicatePage(pageId);

  if (result.success) {
    await recordRateLimitedAction(user.id, "pageCreation", {
      action: "duplicate",
      sourcePageId: pageId,
      newPageId: result.newPageId,
    });

    revalidatePath(`/dashboard/sites/${siteId}`);
    revalidatePath(`/dashboard/sites/${siteId}/pages`);
  }

  return result;
}

export async function checkSubdomainAvailability(
  subdomain: string
): Promise<{ available: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { available: false, error: "Not authenticated" };
  }

  // Check if subdomain exists
  const { data } = await supabase
    .from('sites')
    .select('id')
    .eq('subdomain', subdomain)
    .single();

  return { available: !data };
}
