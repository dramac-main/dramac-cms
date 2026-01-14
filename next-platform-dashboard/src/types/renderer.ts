import type { SiteData, PageData } from "@/lib/renderer/site-data";
import type { Json } from "@/types/database";

export interface RendererProps {
  site: SiteData;
  page: PageData;
}

export interface SiteSettings {
  title?: string;
  description?: string;
  favicon?: string;
  ogImage?: string;
  customCss?: string;
  customHead?: string;
  fonts?: string[];
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
    borderRadius?: string;
  };
}

export interface SEOData {
  title: string;
  description: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

export interface PageContent {
  content: Json;
  version?: number;
}

export type { SiteData, PageData };
