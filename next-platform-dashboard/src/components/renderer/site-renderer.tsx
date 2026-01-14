import { SiteData, PageData } from "@/lib/renderer/site-data";

interface SiteRendererProps {
  site: SiteData;
  page: PageData;
}

/**
 * Site Renderer Component
 * 
 * This is a placeholder that will be fully implemented in Phase 38.
 * It will render Craft.js JSON as static React components.
 */
export function SiteRenderer({ site, page }: SiteRendererProps) {
  return (
    <html lang="en">
      <head>
        <title>{page.seoTitle || page.title || site.settings.title || "Site"}</title>
        {site.settings.customHead && (
          <div dangerouslySetInnerHTML={{ __html: site.settings.customHead }} />
        )}
        {site.settings.customCss && (
          <style dangerouslySetInnerHTML={{ __html: site.settings.customCss }} />
        )}
      </head>
      <body>
        <main>
          {/* Placeholder content - Phase 38 will render actual Craft.js components */}
          <div className="min-h-screen bg-background">
            <div className="container mx-auto py-8">
              <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
              <p className="text-muted-foreground">
                Site: {site.name} | Page: {page.slug || "homepage"}
              </p>
              {/* Page content will be rendered here in Phase 38 */}
              <pre className="mt-8 p-4 bg-muted rounded-lg text-xs overflow-auto">
                {JSON.stringify(page.content, null, 2)}
              </pre>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
