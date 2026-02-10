import { Metadata } from "next";
import { redirect } from "next/navigation";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Branding Settings | ${PLATFORM.name}`,
};

/**
 * Redirect to the unified branding settings page.
 * The old /settings/branding page wrote to agencies.custom_branding directly.
 * The new /dashboard/settings/branding page uses the unified branding API.
 */
export default function BrandingSettingsPage() {
  redirect("/dashboard/settings/branding");
}
