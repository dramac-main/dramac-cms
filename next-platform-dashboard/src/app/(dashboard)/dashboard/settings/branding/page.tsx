import { redirect } from "next/navigation";

/**
 * Redirect from old /dashboard/settings/branding to canonical /settings/branding
 */
export default function DashboardSettingsBrandingRedirect() {
  redirect("/settings/branding");
}
