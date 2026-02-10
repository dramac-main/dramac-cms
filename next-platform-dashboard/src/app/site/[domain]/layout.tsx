/**
 * Published Site Layout
 * 
 * Dedicated layout for published/live websites.
 * 
 * CRITICAL: Published websites are ALWAYS rendered in light mode.
 * The block renderers (renders.tsx, premium-components.tsx) have ZERO
 * dark: Tailwind variants — they're built for light mode only.
 * 
 * Defense layers:
 * 1. ThemeProvider detects /site/ routes and forces "light" on <html>
 * 2. This layout forces colorScheme: "light" on the wrapper
 * 3. StudioRenderer also adds className="light" on its container
 * 
 * This follows the industry standard (Wix, Squarespace, Webflow) where
 * published sites have their own standalone rendering context.
 * 
 * @phase FIX-07 - Studio & Preview Industry-Standard Overhaul
 * @phase FIX-09 - Site rendering fix + professional loading
 */

export default function PublishedSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      style={{ 
        colorScheme: "light",
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );
}
