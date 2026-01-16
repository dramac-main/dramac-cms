"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateProfileAction(values: {
  fullName: string;
  jobTitle?: string;
}) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.fullName,
        job_title: values.jobTitle || null,
        onboarding_completed: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateProfileAction:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function updateAgencyAction(values: {
  agencyName: string;
  agencyDescription?: string;
  website?: string;
}) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not authenticated" };
    }

    // Get profile to find agency_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (!profile?.agency_id) {
      // Create a new agency if none exists
      const { data: newAgency, error: createError } = await supabase
        .from("agencies")
        .insert({
          name: values.agencyName,
          description: values.agencyDescription || null,
          website: values.website || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating agency:", createError);
        return { error: createError.message };
      }

      // Link the agency to the profile
      const { error: linkError } = await supabase
        .from("profiles")
        .update({
          agency_id: newAgency.id,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (linkError) {
        console.error("Error linking agency to profile:", linkError);
        return { error: linkError.message };
      }

      return { success: true, agencyId: newAgency.id };
    }

    // Update existing agency
    const { error: agencyError } = await supabase
      .from("agencies")
      .update({
        name: values.agencyName,
        description: values.agencyDescription || null,
        website: values.website || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.agency_id);

    if (agencyError) {
      console.error("Error updating agency:", agencyError);
      return { error: agencyError.message };
    }

    // Mark onboarding as complete
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Error updating profile onboarding status:", profileError);
      return { error: profileError.message };
    }

    return { success: true, agencyId: profile.agency_id };
  } catch (error) {
    console.error("Error in updateAgencyAction:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function checkOnboardingStatus() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { needsOnboarding: false };
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_completed, agency_id")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error checking onboarding status:", error);
      // If profile doesn't exist, they need onboarding
      return { needsOnboarding: true };
    }

    // User needs onboarding if:
    // 1. onboarding_completed is false or null
    // 2. they don't have an agency_id
    const needsOnboarding = !profile?.onboarding_completed || !profile?.agency_id;

    return {
      needsOnboarding,
      profile,
    };
  } catch (error) {
    console.error("Error in checkOnboardingStatus:", error);
    return { needsOnboarding: true };
  }
}

export async function skipOnboarding() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not authenticated" };
    }

    // Mark onboarding as complete even if skipped
    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error skipping onboarding:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in skipOnboarding:", error);
    return { error: "An unexpected error occurred" };
  }
}
