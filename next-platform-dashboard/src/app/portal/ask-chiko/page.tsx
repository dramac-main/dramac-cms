/**
 * Portal Ask Chiko Page
 *
 * Route: /portal/ask-chiko
 *
 * Natural-language business insights for portal clients,
 * hard-scoped to this client's sites only.
 */

import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/portal-auth";
import { ChikoChat } from "@/components/chiko/chiko-chat";

export const metadata = {
  title: "Ask Chiko | Portal",
  description: "AI business insights for your account.",
};

export default async function PortalAskChikoPage() {
  const user = await getPortalUser();
  if (!user) {
    redirect("/portal/login");
  }

  const firstName = user.fullName?.split(" ")[0] || "";
  const headline = firstName ? `Hi ${firstName}!` : "Hi!";

  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Ask Chiko</h1>
        <p className="text-sm text-muted-foreground">
          Your AI business insights assistant. Ask anything about your revenue,
          bookings, orders, and customers.
        </p>
      </div>

      <ChikoChat
        endpoint="/api/portal/chiko"
        title="Chiko"
        subtitle="Your business insights assistant"
        placeholder="e.g. How much did we make this week?"
        emptyHeadline={headline}
        emptyBody="Ask me about your revenue, orders, bookings, customers, or marketing. I pull live data from your sites — numbers only, no fluff."
      />
    </div>
  );
}
