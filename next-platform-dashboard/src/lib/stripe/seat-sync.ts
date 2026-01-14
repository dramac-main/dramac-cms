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

  // Get current subscription
  const { data: subscription } = await supabase
    .from("billing_subscriptions")
    .select("quantity, status")
    .eq("agency_id", agencyId)
    .in("status", ["active", "trialing"])
    .single();

  // If no subscription and has clients, they need to subscribe
  if (!subscription && clientCount > 0) {
    // Agency needs to create a subscription - return status without updating
    // The needs_subscription flag would typically be checked in the UI
    return { needsSubscription: true, clientCount };
  }

  // If subscription exists and seat count differs, update
  if (subscription && subscription.quantity !== clientCount) {
    await updateSeatCount(agencyId, Math.max(clientCount, 1));
    return { updated: true, oldCount: subscription.quantity, newCount: clientCount };
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
