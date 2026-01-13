import type { Database } from "./database";

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

export type ClientStatus = "active" | "inactive" | "archived";

// Extended client type with computed fields from joins
export interface ClientWithSiteCount extends Client {
  site_count: number;
}

export interface ClientWithStats extends Client {
  site_count: number;
  total_pages: number;
}

export interface ClientFilters {
  search?: string;
  status?: ClientStatus | "all";
  sortBy?: "name" | "created_at" | "updated_at";
  sortOrder?: "asc" | "desc";
}
