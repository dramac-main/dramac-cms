/**
 * Marketing Module Layout
 * Session 3: Campaign UI + Drip Sequences + Marketing Hub
 *
 * Access control wrapper for all marketing pages.
 */
import { redirect, notFound } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { isModuleEnabledForSite } from "@/lib/actions/sites";

interface MarketingLayoutProps {
  children: ReactNode;
  params: Promise<{ siteId: string }>;
}

export default async function MarketingLayout({
  children,
  params,
}: MarketingLayoutProps) {
  const { siteId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: site } = await supabase
    .from("sites")
    .select("id, name")
    .eq("id", siteId)
    .single();

  if (!site) notFound();

  const hasAccess = await isModuleEnabledForSite(siteId, "marketing");
  if (!hasAccess) {
    redirect(
      `/dashboard/sites/${siteId}?tab=modules&message=marketing_not_installed`,
    );
  }

  return <div className="flex flex-col h-full">{children}</div>;
}
