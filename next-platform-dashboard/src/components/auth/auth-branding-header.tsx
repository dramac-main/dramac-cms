import { getDefaultAgencyBranding } from "@/lib/queries/branding";
import { PLATFORM } from "@/lib/constants/platform";

interface AuthBrandingHeaderProps {
  title: string;
  subtitle: string;
}

/**
 * Server component that renders the agency logo + page title on auth pages.
 * Fetches branding from the default agency — cached for 5 minutes.
 */
export async function AuthBrandingHeader({ title, subtitle }: AuthBrandingHeaderProps) {
  const branding = await getDefaultAgencyBranding();
  const displayName = branding?.agency_display_name || PLATFORM.name;
  const logoUrl = branding?.logo_url;

  return (
    <div className="text-center">
      {logoUrl ? (
        <div className="mx-auto mb-6 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={displayName}
            className="h-12 w-auto max-w-50 object-contain"
          />
        </div>
      ) : (
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <span className="text-xl font-bold text-primary-foreground">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
