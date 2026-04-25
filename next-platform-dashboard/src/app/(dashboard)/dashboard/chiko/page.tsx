/**
 * Ask Chiko Dashboard Page (Agency)
 *
 * Route: /dashboard/chiko
 *
 * Natural-language business insights for agency owners, scoped to the
 * authenticated user's agency_id (covers all of that agency's clients,
 * sites, orders, bookings, customers, marketing, chat). Hard tenancy
 * via every query in chiko-query-builder.ts filtering by agency_id.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChikoChat } from "@/components/chiko/chiko-chat";

export const metadata = {
  title: "Ask Chiko",
  description: "Your AI business insights assistant.",
};

export default async function ChikoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) {
    redirect("/onboarding");
  }

  const firstName = profile.full_name?.split(" ")[0] || "";
  const headline = firstName ? `Hi ${firstName}!` : "Hi!";

  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Ask Chiko</h1>
        <p className="text-sm text-muted-foreground">
          Your AI business insights assistant. Ask anything about revenue,
          bookings, orders, and customers across all your clients.
        </p>
      </div>
      <ChikoChat
        endpoint="/api/chiko"
        title="Chiko"
        subtitle="Your business insights assistant"
        placeholder="e.g. How much revenue did we make this week?"
        emptyHeadline={headline}
        emptyBody="Ask me about revenue, orders, bookings, customers, or marketing across your agency. I pull live data — numbers only, no fluff."
      />
    </div>
  );
}
