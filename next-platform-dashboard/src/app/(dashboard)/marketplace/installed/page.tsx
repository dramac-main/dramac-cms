/**
 * Marketplace Installed - Redirect
 * 
 * Redirects to the canonical modules subscriptions page.
 */

import { redirect } from "next/navigation";

export default function InstalledModulesPage() {
  redirect("/dashboard/modules/subscriptions");
}
