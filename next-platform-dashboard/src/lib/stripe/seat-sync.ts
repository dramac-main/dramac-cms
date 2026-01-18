import { createAdminClient } from "@/lib/supabase/admin";
import { updateSeatCount } from "./subscriptions";

export async function syncSeatsForAgency(agencyId: string) {
  const supabase = createAdminClient();

  // Count active clients
  const { count } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId);

  const clientCount = count || 0;

  // Get current subscription from agencies table
  const { data: agency } = await supabase
    .from("agencies")
    .select("stripe_subscription_id")
    .eq("id", agencyId)
    .single();

  // If no subscription and has clients, they need to subscribe
  if (!agency?.stripe_subscription_id && clientCount > 0) {
    // Agency needs to create a subscription - return status without updating
    return { needsSubscription: true, clientCount };
  }

  // If subscription exists, sync seat count
  if (agency?.stripe_subscription_id) {
    await updateSeatCount(agencyId, Math.max(clientCount, 1));
    return { updated: true, newCount: clientCount };
  }

  return { synced: true, seatCount: clientCount };
}

// Sync all agencies (cron job)
export async function syncAllAgencySeats() {
  const supabase = createAdminClient();

  const { data: agencies } = await supabase
    .from("agencies")
    .select("id");

  if (!agencies) return;

  const results = await Promise.all(
    agencies.map((agency) => syncSeatsForAgency(agency.id))
  );

  return results;
}
