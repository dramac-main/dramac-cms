import Script from "next/script";
import { SiteData } from "@/lib/renderer/site-data";

interface SiteHeadProps {
  site: SiteData;
}

export function SiteHead({ site }: SiteHeadProps) {
  const { settings } = site;
  const fonts = settings.fonts || [];

  // Build Google Fonts URL
  const googleFontsUrl = fonts.length > 0
    ? `https://fonts.googleapis.com/css2?${fonts
        .map((font) => `family=${encodeURIComponent(font)}:wght@400;500;600;700`)
        .join("&")}&display=swap`
    : null;

  return (
    <>
      {/* Google Fonts */}
      {googleFontsUrl && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href={googleFontsUrl} rel="stylesheet" />
        </>
      )}

      {/* Custom Head HTML */}
      {settings.customHead && (
        <Script
          id="custom-head"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: settings.customHead,
          }}
        />
      )}
    </>
  );
}
