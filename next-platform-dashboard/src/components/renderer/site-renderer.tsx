import { SiteData, PageData } from "@/lib/renderer/site-data";
import { renderCraftJSON } from "./node-renderer";
import { SiteStyles } from "./site-styles";
import { SiteHead } from "./site-head";
import { ModuleInjector } from "./module-injector";

interface SiteRendererProps {
  site: SiteData;
  page: PageData;
}

export function SiteRenderer({ site, page }: SiteRendererProps) {
  const content = renderCraftJSON(page.content);

  return (
    <>
      <SiteHead site={site} />
      <SiteStyles site={site} />
      
      {/* Inject studio module code (styles + scripts) */}
      <ModuleInjector siteId={site.id} />
      
      <div className="site-content" data-site-id={site.id} data-page-id={page.id}>
        {content || (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
            <p>No content to display</p>
            <p style={{ fontSize: '0.875rem' }}>This page has no content yet or the content format is not recognized.</p>
          </div>
        )}
      </div>
    </>
  );
}
