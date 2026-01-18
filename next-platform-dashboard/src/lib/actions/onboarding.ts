"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingStatus, IndustryId } from "@/lib/constants/onboarding";

export async function checkOnboardingStatus(): Promise<OnboardingStatus> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { 
      needsOnboarding: true, 
      currentStep: 0, 
      completedSteps: [], 
      hasAgency: false,
      hasProfile: false,
    };
  }

  // Check profile completion
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, full_name, onboarding_completed, job_title, agency_id")
    .eq("id", user.id)
    .single();

  // Check if user has an agency through membership
  const { data: agencyMembership } = await supabase
    .from("agency_members")
    .select("agency_id, role, agency:agencies(id, name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  // Also check agency_id on profile as backup
  const hasAgency = !!(agencyMembership?.agency || profile?.agency_id);
  const hasProfile = !!(profile?.name || profile?.full_name);
  const isCompleted = profile?.onboarding_completed === true;

  const completedSteps: string[] = [];
  if (hasProfile) completedSteps.push("profile");
  if (hasAgency) completedSteps.push("agency");

  let currentStep = 0;
  if (hasProfile) currentStep = 1;
  if (hasAgency) currentStep = 2;

  return {
    needsOnboarding: !isCompleted,
    currentStep,
    completedSteps,
    hasAgency,
    hasProfile,
  };
}

interface ProfileActionData {
  fullName: string;
  jobTitle?: string;
}

export async function updateProfileAction(data: ProfileActionData): Promise<{ error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      name: data.fullName,
      full_name: data.fullName,
      job_title: data.jobTitle || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  
  revalidatePath("/onboarding");
  return {};
}

interface AgencyActionData {
  agencyName: string;
  agencyDescription?: string;
  website?: string;
  industry?: IndustryId;
  teamSize?: string;
  goals?: string[];
}

export async function updateAgencyAction(data: AgencyActionData): Promise<{ error?: string; agencyId?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check if user already has an agency via membership
  const { data: existingMembership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  // Also check profile for agency_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  const existingAgencyId = existingMembership?.agency_id || profile?.agency_id;

  if (existingAgencyId) {
    // Update existing agency
    const { error } = await supabase
      .from("agencies")
      .update({
        name: data.agencyName,
        description: data.agencyDescription || null,
        website: data.website || null,
        industry: data.industry || null,
        team_size: data.teamSize || null,
        goals: data.goals || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingAgencyId);

    if (error) return { error: error.message };
    return { agencyId: existingAgencyId };
  }

  // Create new agency
  const slug = data.agencyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .insert({
      name: data.agencyName,
      slug,
      description: data.agencyDescription || null,
      website: data.website || null,
      industry: data.industry || null,
      team_size: data.teamSize || null,
      goals: data.goals || [],
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (agencyError) return { error: agencyError.message };

  // Update profile with agency_id
  await supabase
    .from("profiles")
    .update({
      agency_id: agency.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  // Check if membership already exists before creating
  const { data: membershipCheck } = await supabase
    .from("agency_members")
    .select("id")
    .eq("agency_id", agency.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membershipCheck) {
    // Add user as owner member
    const { error: memberError } = await supabase
      .from("agency_members")
      .insert({
        agency_id: agency.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      console.error("Error creating agency membership:", memberError);
      // Don't fail the whole operation, agency was created
    }
  }

  revalidatePath("/onboarding");
  return { agencyId: agency.id };
}

interface FirstClientActionData {
  clientName: string;
  clientEmail?: string;
  clientIndustry?: IndustryId;
}

export async function createFirstClientAction(
  agencyId: string,
  data: FirstClientActionData
): Promise<{ error?: string; clientId?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      agency_id: agencyId,
      name: data.clientName,
      email: data.clientEmail || null,
      industry: data.clientIndustry || null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  
  revalidatePath("/onboarding");
  return { clientId: client.id };
}

export async function completeOnboardingAction(): Promise<{ error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  
  revalidatePath("/dashboard");
  return {};
}

export async function skipOnboardingAction(): Promise<{ error?: string }> {
  return completeOnboardingAction();
}
