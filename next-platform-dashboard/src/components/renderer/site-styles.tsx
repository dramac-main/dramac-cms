import { SiteData } from "@/lib/renderer/site-data";
import { generateThemeCSS } from "@/lib/renderer/theme";

interface SiteStylesProps {
  site: SiteData;
}

export function SiteStyles({ site }: SiteStylesProps) {
  const { settings } = site;
  const themeCSS = generateThemeCSS(settings.theme || {});
  
  // Combine theme CSS with custom CSS
  const combinedCSS = `
/* Theme Variables */
${themeCSS}

/* Base Styles */
.site-content {
  min-height: 100vh;
  font-family: var(--font-family, system-ui, sans-serif);
}

/* Custom CSS */
${settings.customCss || ""}
  `.trim();

  return (
    <style dangerouslySetInnerHTML={{ __html: combinedCSS }} />
  );
}
