import { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import BrandingSettingsContent from "@/app/(dashboard)/dashboard/settings/branding/page";

export const metadata: Metadata = {
  title: `Branding Settings | ${PLATFORM.name}`,
};

/**
 * Branding settings — renders the full branding configuration page inline.
 * Previously this redirected to /dashboard/settings/branding which caused 404s
 * due to route group layout mismatches.
 */
export default function BrandingSettingsPage() {
  return <BrandingSettingsContent />;
}
