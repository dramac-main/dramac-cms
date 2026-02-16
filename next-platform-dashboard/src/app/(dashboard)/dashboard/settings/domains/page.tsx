// src/app/(dashboard)/dashboard/settings/domains/page.tsx
// REDIRECT: Domain reselling settings moved to /dashboard/domains/settings/
// This redirect preserves backward compatibility with bookmarks and old links.

import { redirect } from "next/navigation";

export default function LegacyDomainSettingsRedirect() {
  redirect("/dashboard/domains/settings");
}
