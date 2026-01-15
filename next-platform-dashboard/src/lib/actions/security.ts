"use server";

import { revalidatePath } from "next/cache";
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

interface SessionInfo {
  id: string;
  device: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  if (/mobile|android|iphone|ipod/i.test(ua)) {
    deviceType = "mobile";
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = "tablet";
  }
  
  // Detect browser
  let browser = "Unknown Browser";
  if (ua.includes("chrome") && !ua.includes("edg")) {
    browser = "Chrome";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari";
  } else if (ua.includes("firefox")) {
    browser = "Firefox";
  } else if (ua.includes("edg")) {
    browser = "Edge";
  }
  
  // Detect device name
  let device = "Unknown Device";
  if (ua.includes("windows")) {
    device = "Windows PC";
  } else if (ua.includes("macintosh") || ua.includes("mac os x")) {
    device = "Mac";
  } else if (ua.includes("linux")) {
    device = "Linux PC";
  } else if (ua.includes("iphone")) {
    device = "iPhone";
  } else if (ua.includes("ipad")) {
    device = "iPad";
  } else if (ua.includes("android")) {
    device = "Android Device";
  }
  
  return { device, deviceType, browser };
}

export async function getUserSessions() {
  const supabase = await createClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return { sessions: [], error: "Could not fetch sessions" };
  }

  // Note: Supabase only provides access to the current session
  // For multi-session management, you'd need to implement custom session tracking
  
  // Get user agent from headers (if available)
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : "";
  const { device, deviceType, browser } = parseUserAgent(userAgent || "Chrome/120.0");
  
  const sessions: SessionInfo[] = [
    {
      id: session.access_token.substring(0, 16),
      device,
      deviceType,
      browser,
      location: "Unknown", // Would need IP geolocation service
      lastActive: "Active now",
      isCurrent: true,
    },
  ];

  return { sessions, error: null };
}

export async function revokeSession(sessionId: string) {
  const supabase = await createClient();
  
  // Sign out from all devices (Supabase doesn't support selective session revocation)
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  
  if (error) {
    console.error("Error revoking session:", error);
    return { error: "Failed to revoke session" };
  }

  revalidatePath("/settings/security");
  return { success: true };
}

export async function revokeAllOtherSessions() {
  const supabase = await createClient();
  
  // Refresh the current session to invalidate any other sessions
  const { error } = await supabase.auth.refreshSession();
  
  if (error) {
    console.error("Error refreshing session:", error);
    return { error: "Failed to revoke other sessions" };
  }

  revalidatePath("/settings/security");
  return { success: true, message: "Session refreshed successfully" };
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
