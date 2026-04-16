/**
 * Chiko AI Dashboard Page
 *
 * Phase BIL-10: Chiko AI Business Assistant
 *
 * Route: /dashboard/chiko
 * Auth-guarded page with the Chiko chat interface.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChikoChat } from "@/components/chiko/chiko-chat";

export const metadata = {
  title: "Chiko AI | DRAMAC CMS",
  description: "AI-powered business assistant",
};

export default async function ChikoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify user has an agency
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) {
    redirect("/onboarding");
  }

  return (
    <div className="container max-w-4xl py-6">
      <ChikoChat />
    </div>
  );
}
