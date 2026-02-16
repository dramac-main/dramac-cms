// src/app/(dashboard)/dashboard/settings/domains/pricing/page.tsx
// REDIRECT: Domain pricing config moved to /dashboard/domains/settings/pricing/

import { redirect } from "next/navigation";

export default function LegacyDomainPricingRedirect() {
  redirect("/dashboard/domains/settings/pricing");
}
