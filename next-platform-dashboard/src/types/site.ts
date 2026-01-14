import type { Database } from "./database";

export type Site = Database["public"]["Tables"]["sites"]["Row"];
export type SiteInsert = Database["public"]["Tables"]["sites"]["Insert"];
export type SiteUpdate = Database["public"]["Tables"]["sites"]["Update"];

export type SiteStatus = "draft" | "published";

export interface SiteWithClient extends Site {
  client: {
    id: string;
    name: string;
    company: string | null;
  } | null;
}

export interface SiteWithPages extends Site {
  pages: {
    id: string;
    name: string;
    slug: string;
    is_homepage: boolean;
  }[];
}

export interface SiteFilters {
  search?: string;
  status?: SiteStatus | "all";
  clientId?: string;
  sortBy?: "name" | "created_at" | "updated_at";
  sortOrder?: "asc" | "desc";
}

export interface SiteTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: "business" | "portfolio" | "blog" | "ecommerce" | "blank";
  pages: string[];
}
