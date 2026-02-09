/**
 * Dashboard Billing Page - Redirect
 * 
 * Redirects to the canonical billing page at /settings/billing
 * Preserves search params (success, cancelled) from Paddle checkout callbacks.
 */

import { redirect } from "next/navigation";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing | DRAMAC",
  description: "Redirecting to billing settings",
};

interface BillingPageProps {
  searchParams: Promise<{ success?: string; cancelled?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const queryParts: string[] = [];
  if (params.success) queryParts.push(`success=${params.success}`);
  if (params.cancelled) queryParts.push(`cancelled=${params.cancelled}`);
  const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  redirect(`/settings/billing${query}`);
}
