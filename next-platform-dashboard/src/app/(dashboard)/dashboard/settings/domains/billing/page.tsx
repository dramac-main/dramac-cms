// src/app/(dashboard)/dashboard/settings/domains/billing/page.tsx
// REDIRECT: Domain billing moved to /dashboard/domains/settings/billing/

import { redirect } from "next/navigation";

export default function LegacyDomainBillingRedirect() {
  redirect("/dashboard/domains/settings/billing");
}
