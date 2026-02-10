import { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import BrandingSettingsForm from "@/components/settings/branding-settings-form";

export const metadata: Metadata = {
  title: `Branding Settings | ${PLATFORM.name}`,
};

/**
 * Branding settings — renders the full branding configuration page inline.
 * Uses the shared BrandingSettingsForm component.
 */
export default function BrandingSettingsPage() {
  return <BrandingSettingsForm />;
}
