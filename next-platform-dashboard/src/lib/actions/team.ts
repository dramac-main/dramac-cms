"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

export async function getAgencyTeam(userId: string) {
  const supabase = await createClient();

  // First get the user's agency
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", userId)
    .single();

  let agencyId = profile?.agency_id;

  // If no agency in profile, check if user is owner
  if (!agencyId) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("id")
      .eq("owner_id", userId)
      .single();
    
    agencyId = agency?.id;
  }

  if (!agencyId) {
    return { members: [] };
  }

  // Get all members of the agency
  const { data: memberships, error } = await supabase
    .from("agency_members")
    .select("id, role, invited_at, accepted_at, user_id")
    .eq("agency_id", agencyId);

  if (error) {
    console.error("Error fetching team:", error);
    return { members: [] };
  }

  // Fetch profiles separately for each user
  const userIds = memberships.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  const members: TeamMember[] = memberships.map((m) => {
    const memberProfile = profileMap.get(m.user_id);
    return {
      id: m.id,
      email: memberProfile?.email || "",
      full_name: memberProfile?.name || null,
      avatar_url: memberProfile?.avatar_url || null,
      role: m.role as "owner" | "admin" | "member",
      joined_at: m.accepted_at || m.invited_at,
    };
  });

  return { members };
}

export async function inviteTeamMember(email: string, role: "admin" | "member") {
  const supabase = await createClient();

  // Get current user's agency
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  let agencyId = profile?.agency_id;

  if (!agencyId) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    
    agencyId = agency?.id;
  }

  if (!agencyId) {
    return { error: "No agency found" };
  }

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (existingUser) {
    // Check if already a member
    const { data: existingMember } = await supabase
      .from("agency_members")
      .select("id")
      .eq("agency_id", agencyId)
      .eq("user_id", existingUser.id)
      .single();

    if (existingMember) {
      return { error: "User is already a team member" };
    }

    // Add existing user to team
    const { error: memberError } = await supabase
      .from("agency_members")
      .insert({
        agency_id: agencyId,
        user_id: existingUser.id,
        role: role,
        accepted_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return { error: "Failed to add team member" };
    }
  } else {
    // For new users, we would typically send an invitation email
    // and create a pending invitation record
    // For now, we'll return a success message
    // In production, integrate with Resend or similar email service
  }

  revalidatePath("/settings/team");
  return { success: true };
}

export async function removeTeamMember(memberId: string) {
  const supabase = await createClient();

  // Get the membership to check it's not the owner
  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("id", memberId)
    .single();

  if (membership?.role === "owner") {
    return { error: "Cannot remove the agency owner" };
  }

  const { error } = await supabase
    .from("agency_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    console.error("Error removing member:", error);
    return { error: "Failed to remove team member" };
  }

  revalidatePath("/settings/team");
  return { success: true };
}

export async function updateMemberRole(memberId: string, newRole: string) {
  const supabase = await createClient();

  // Validate role
  if (!["admin", "member"].includes(newRole)) {
    return { error: "Invalid role" };
  }

  // Get the membership to check it's not the owner
  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("id", memberId)
    .single();

  if (membership?.role === "owner") {
    return { error: "Cannot change the owner's role" };
  }

  const { error } = await supabase
    .from("agency_members")
    .update({ role: newRole as "admin" | "member" })
    .eq("id", memberId);

  if (error) {
    console.error("Error updating role:", error);
    return { error: "Failed to update role" };
  }

  revalidatePath("/settings/team");
  return { success: true };
}
