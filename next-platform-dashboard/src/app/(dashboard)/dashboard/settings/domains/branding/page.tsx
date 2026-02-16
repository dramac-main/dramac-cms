// src/app/(dashboard)/dashboard/settings/domains/branding/page.tsx
// REDIRECT: Domain branding moved to /dashboard/domains/settings/branding/

import { redirect } from "next/navigation";

export default function LegacyDomainBrandingRedirect() {
  redirect("/dashboard/domains/settings/branding");
}
