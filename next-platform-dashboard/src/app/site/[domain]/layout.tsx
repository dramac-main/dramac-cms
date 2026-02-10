/**
 * Published Site Layout
 * 
 * Dedicated layout for published/live websites.
 * 
 * CRITICAL: This layout deliberately does NOT include the dashboard's
 * ThemeProvider or any other dashboard providers. Published websites
 * are always rendered in light mode with their own isolated styling.
 * Without this layout, published sites inherit the root layout's
 * ThemeProvider, which could apply dark mode classes and break the
 * website's appearance for site admins who have dark mode enabled.
 * 
 * This follows the industry standard (Wix, Squarespace, Webflow) where
 * published sites have their own standalone rendering context.
 * 
 * @phase FIX-07 - Studio & Preview Industry-Standard Overhaul
 */

export default function PublishedSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="light" 
      style={{ 
        colorScheme: "light",
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        color: "#111827",
      }}
    >
      {children}
    </div>
  );
}
