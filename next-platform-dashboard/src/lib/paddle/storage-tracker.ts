/**
 * File Storage Tracking
 *
 * Phase BIL-05: Usage Metering & Enforcement
 *
 * Tracks file storage usage per agency for billing purposes.
 * Uses the agencies.file_storage_used_bytes column for real-time tracking.
 *
 * @see phases/PHASE-BIL-MASTER-GUIDE.md
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { subscriptionService } from "./subscription-service";

// ============================================================================
// Storage Tracking Functions
// ============================================================================

/**
 * Track a file upload — increments storage used.
 *
 * @param agencyId - The agency that owns the file
 * @param fileSizeBytes - Size of uploaded file in bytes
 */
export async function trackFileUpload(
  agencyId: string,
  fileSizeBytes: number,
): Promise<void> {
  if (!agencyId || fileSizeBytes <= 0) return;

  const supabase = createAdminClient();

  // Atomically increment file_storage_used_bytes on the agencies table
  // Using raw SQL via RPC for atomic increment
  const { error } = await (supabase as any).rpc("increment_file_storage", {
    p_agency_id: agencyId,
    p_bytes: fileSizeBytes,
  });

  // If RPC doesn't exist, fall back to read-then-write
  if (error) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("file_storage_used_bytes")
      .eq("id", agencyId)
      .single();

    const currentBytes = (agency as any)?.file_storage_used_bytes || 0;

    await (supabase as any)
      .from("agencies")
      .update({
        file_storage_used_bytes: currentBytes + fileSizeBytes,
      })
      .eq("id", agencyId);
  }
}

/**
 * Track a file deletion — decrements storage used.
 *
 * @param agencyId - The agency that owns the file
 * @param fileSizeBytes - Size of deleted file in bytes
 */
export async function trackFileDelete(
  agencyId: string,
  fileSizeBytes: number,
): Promise<void> {
  if (!agencyId || fileSizeBytes <= 0) return;

  const supabase = createAdminClient();

  // Atomically decrement file_storage_used_bytes (never go below 0)
  const { error } = await (supabase as any).rpc("decrement_file_storage", {
    p_agency_id: agencyId,
    p_bytes: fileSizeBytes,
  });

  // Fall back to read-then-write
  if (error) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("file_storage_used_bytes")
      .eq("id", agencyId)
      .single();

    const currentBytes = (agency as any)?.file_storage_used_bytes || 0;
    const newBytes = Math.max(0, currentBytes - fileSizeBytes);

    await (supabase as any)
      .from("agencies")
      .update({
        file_storage_used_bytes: newBytes,
      })
      .eq("id", agencyId);
  }
}

/**
 * Get current file storage usage for an agency.
 */
export async function getStorageUsage(
  agencyId: string,
): Promise<{ usedBytes: number; includedBytes: number; overageBytes: number }> {
  const supabase = createAdminClient();

  // Get subscription to know included storage
  const subscription = await subscriptionService.getSubscription(agencyId);

  const includedMb = subscription?.includedUsage.fileStorageMb ?? 0;
  const includedBytes = includedMb * 1024 * 1024; // Convert MB to bytes

  // Get current storage from agencies table
  const { data: agency } = await supabase
    .from("agencies")
    .select("file_storage_used_bytes")
    .eq("id", agencyId)
    .single();

  const usedBytes = (agency as any)?.file_storage_used_bytes || 0;
  const overageBytes = Math.max(0, usedBytes - includedBytes);

  return { usedBytes, includedBytes, overageBytes };
}

/**
 * Check if an agency can upload a file of the given size.
 * Soft limit — always allowed, but tracks overage.
 */
export async function checkStorageLimit(
  agencyId: string,
  fileSizeBytes: number,
): Promise<{ allowed: boolean; remainingBytes: number }> {
  const { usedBytes, includedBytes } = await getStorageUsage(agencyId);
  const remainingBytes = Math.max(0, includedBytes - usedBytes);

  // Soft limit model — always allow, overage is billed
  return {
    allowed: true,
    remainingBytes,
  };
}
