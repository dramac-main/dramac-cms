// Re-export the Page type from database for consistency
export type { Page, PageInsert, PageUpdate } from "./database";

export interface PageContent {
  ROOT: {
    type: { resolvedName: string };
    isCanvas: boolean;
    props: Record<string, unknown>;
    displayName: string;
    custom: Record<string, unknown>;
    nodes: string[];
    linkedNodes: Record<string, string>;
  };
  [nodeId: string]: {
    type: { resolvedName: string };
    isCanvas?: boolean;
    props: Record<string, unknown>;
    displayName?: string;
    custom?: Record<string, unknown>;
    nodes?: string[];
    linkedNodes?: Record<string, string>;
    parent?: string;
  };
}

export interface PageWithContent {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  is_homepage: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  content: PageContent | null;
}

export interface PageWithSite {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  is_homepage: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  site: {
    id: string;
    name: string;
    subdomain: string;
  };
}
