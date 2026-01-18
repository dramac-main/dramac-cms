// Re-export the Page types from database for consistency
import type { Tables, TablesInsert, TablesUpdate } from "./database";

export type Page = Tables<"pages">;
export type PageInsert = TablesInsert<"pages">;
export type PageUpdate = TablesUpdate<"pages">;

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
  is_homepage: boolean | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
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
