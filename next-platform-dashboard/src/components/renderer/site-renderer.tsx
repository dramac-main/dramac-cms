import { SiteData, PageData } from "@/lib/renderer/site-data";
import { renderCraftJSON } from "./node-renderer";
import { SiteStyles } from "./site-styles";
import { SiteHead } from "./site-head";

interface SiteRendererProps {
  site: SiteData;
  page: PageData;
}

export function SiteRenderer({ site, page }: SiteRendererProps) {
  console.log("[SiteRenderer] Rendering page:", page.slug);
  console.log("[SiteRenderer] Page content:", page.content);
  console.log("[SiteRenderer] Content type:", typeof page.content);
  console.log("[SiteRenderer] Has ROOT:", page.content && typeof page.content === 'object' && 'ROOT' in page.content);
  
  const content = renderCraftJSON(page.content);
  
  console.log("[SiteRenderer] Rendered content:", content ? 'Has content' : 'No content');

  return (
    <>
      <SiteHead site={site} />
      <SiteStyles site={site} />
      
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
