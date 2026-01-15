"use server";

import { createClient } from "@/lib/supabase/server";

export async function changePassword(currentPassword: string, newPassword: string) {
  const supabase = await createClient();

  // First verify the current password by attempting to sign in
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.email) {
    return { error: "User not found" };
  }

  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "Current password is incorrect" };
  }

  // Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("Error updating password:", updateError);
    return { error: "Failed to update password" };
  }

  return { success: true };
}

export async function enableTwoFactor() {
  const supabase = await createClient();
  
  // Note: Supabase's built-in 2FA requires specific setup
  // This is a placeholder for the actual implementation
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "User not found" };
  }

  // In production, this would generate TOTP secret and QR code
  // For now, we'll return a success message
  return { 
    success: true, 
    message: "Two-factor authentication setup initiated" 
  };
}

export async function disableTwoFactor() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "User not found" };
  }

  // In production, this would disable TOTP
  return { success: true };
}

export async function getSessions() {
  // Note: Supabase doesn't provide session management out of the box
  // This would require custom implementation or use of Supabase's session API
  // For now, returning mock data structure
  return {
    sessions: [],
  };
}

export async function revokeSession(sessionId: string) {
  const supabase = await createClient();
  
  // In production, this would revoke a specific session
  // Supabase allows signing out from all devices with signOut({ scope: 'global' })
  
  return { success: true };
}

export async function revokeAllSessions() {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signOut({ scope: "global" });
  
  if (error) {
    console.error("Error revoking sessions:", error);
    return { error: "Failed to revoke sessions" };
  }

  return { success: true };
}
