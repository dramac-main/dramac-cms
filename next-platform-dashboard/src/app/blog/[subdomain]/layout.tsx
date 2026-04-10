import { createAdminClient } from "@/lib/supabase/admin";
import {
  extractBrandSource,
  resolveBrandColors,
  generateBrandCSSVars,
} from "@/lib/studio/engine/brand-colors";
import Image from "next/image";
import Link from "next/link";

// Fetch site data including branding settings
async function getSiteBySubdomain(subdomain: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("sites")
    .select("*")
    .eq("subdomain", subdomain)
    .eq("published", true)
    .single();
  return data;
}

/**
 * Build a Google Fonts <link> URL for the given font names.
 */
function buildGoogleFontsUrl(fonts: string[]): string | null {
  const unique = [...new Set(fonts.filter(Boolean))];
  if (unique.length === 0) return null;
  const families = unique
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700;800`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export default async function BlogLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const site = await getSiteBySubdomain(subdomain);

  // If no site found, render children without branding (pages handle their own 404)
  if (!site) {
    return <>{children}</>;
  }

  const settings = (site.settings as Record<string, unknown>) || {};
  const theme = (settings.theme as Record<string, unknown>) || {};

  // Extract branding
  const brandSource = extractBrandSource(settings);
  const palette = resolveBrandColors(brandSource);

  const fontHeading =
    (settings.font_heading as string) || (theme.fontHeading as string) || "";
  const fontBody =
    (settings.font_body as string) || (theme.fontBody as string) || "";
  const logoUrl =
    (settings.logo_url as string) || (theme.logoUrl as string) || "";

  // Generate CSS variables matching the site renderer pattern
  const cssVars = generateBrandCSSVars(palette, fontHeading || null, fontBody || null);

  // Build Google Fonts URL
  const fontsToLoad = [fontHeading, fontBody].filter(Boolean);
  const googleFontsUrl = buildGoogleFontsUrl(fontsToLoad);

  // Build inline style object from CSS vars
  const rootStyle: Record<string, string> = {
    ...cssVars,
    backgroundColor: palette.background,
    color: palette.foreground,
    colorScheme: "light",
  };

  // Font families for direct application
  const headingFamily = fontHeading
    ? `'${fontHeading}', ui-sans-serif, system-ui, sans-serif`
    : "ui-sans-serif, system-ui, sans-serif";
  const bodyFamily = fontBody
    ? `'${fontBody}', ui-sans-serif, system-ui, sans-serif`
    : "ui-sans-serif, system-ui, sans-serif";

  return (
    <>
      {/* Google Fonts preconnect + stylesheet */}
      {googleFontsUrl && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link rel="stylesheet" href={googleFontsUrl} />
        </>
      )}

      <div style={rootStyle}>
        {/* Site Header */}
        <header
          style={{
            borderBottom: `1px solid ${palette.border}`,
            backgroundColor: palette.background,
          }}
        >
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link
              href={`/blog/${subdomain}`}
              className="flex items-center gap-3"
              style={{ textDecoration: "none", color: palette.foreground }}
            >
              {logoUrl && (
                <Image
                  src={logoUrl}
                  alt={site.name || "Logo"}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              )}
              <span
                style={{
                  fontFamily: headingFamily,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: palette.foreground,
                }}
              >
                {site.name}
              </span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href={`/blog/${subdomain}`}
                style={{
                  fontFamily: bodyFamily,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: palette.mutedForeground,
                  textDecoration: "none",
                }}
              >
                Blog
              </Link>
            </nav>
          </div>
        </header>

        {/* Blog Content */}
        <main style={{ fontFamily: bodyFamily, minHeight: "80vh" }}>
          {children}
        </main>

        {/* Site Footer */}
        <footer
          style={{
            borderTop: `1px solid ${palette.border}`,
            backgroundColor: palette.muted,
            color: palette.mutedForeground,
            fontFamily: bodyFamily,
          }}
        >
          <div className="max-w-5xl mx-auto px-4 py-8 text-center">
            <p style={{ fontSize: "0.875rem" }}>
              &copy; {new Date().getFullYear()} {site.name}. All rights
              reserved.
            </p>
          </div>
        </footer>

        {/* Prose brand overrides (for blog post content HTML) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .blog-prose {
                --tw-prose-body: ${palette.foreground};
                --tw-prose-headings: ${palette.foreground};
                --tw-prose-lead: ${palette.mutedForeground};
                --tw-prose-links: ${palette.primary};
                --tw-prose-bold: ${palette.foreground};
                --tw-prose-counters: ${palette.mutedForeground};
                --tw-prose-bullets: ${palette.mutedForeground};
                --tw-prose-hr: ${palette.border};
                --tw-prose-quotes: ${palette.foreground};
                --tw-prose-quote-borders: ${palette.primary};
                --tw-prose-captions: ${palette.mutedForeground};
                --tw-prose-code: ${palette.foreground};
                --tw-prose-pre-code: ${palette.foreground};
                --tw-prose-pre-bg: ${palette.muted};
                --tw-prose-th-borders: ${palette.border};
                --tw-prose-td-borders: ${palette.border};
              }
              .blog-prose h1, .blog-prose h2, .blog-prose h3,
              .blog-prose h4, .blog-prose h5, .blog-prose h6 {
                font-family: ${headingFamily};
              }
              .blog-prose a {
                color: ${palette.primary};
              }
              .blog-prose a:hover {
                color: ${palette.buttonHover};
              }
            `,
          }}
        />
      </div>
    </>
  );
}
