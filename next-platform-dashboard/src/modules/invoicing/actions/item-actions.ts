"use server";

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import type { Item, ItemType } from "../types";

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

// ─── Input Types ───────────────────────────────────────────────

export interface CreateItemInput {
  name: string;
  description?: string | null;
  type: ItemType;
  unitPrice: number;
  unit?: string | null;
  taxRateId?: string | null;
  sku?: string | null;
  category?: string | null;
  sortOrder?: number;
}

export interface UpdateItemInput extends Partial<CreateItemInput> {}

export interface ItemFilters {
  search?: string;
  type?: ItemType;
  category?: string;
  isActive?: boolean;
}

// ── CRUD ────────────────────────────────────────────────────────

export async function getItems(
  siteId: string,
  filters?: ItemFilters,
): Promise<Item[]> {
  const supabase = await getModuleClient();

  let query = supabase
    .from(INV_TABLES.items)
    .select("*")
    .eq("site_id", siteId)
    .order("sort_order", { ascending: true });

  if (filters?.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  } else {
    query = query.eq("is_active", true);
  }

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as Item[];
}

export async function getItem(
  siteId: string,
  itemId: string,
): Promise<Item | null> {
  const supabase = await getModuleClient();
  const { data, error } = await supabase
    .from(INV_TABLES.items)
    .select("*")
    .eq("id", itemId)
    .eq("site_id", siteId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data as Item;
}

export async function createItem(
  siteId: string,
  input: CreateItemInput,
): Promise<Item> {
  const supabase = await getModuleClient();
  const { data, error } = await supabase
    .from(INV_TABLES.items)
    .insert({
      site_id: siteId,
      name: input.name,
      description: input.description || null,
      type: input.type,
      unit_price: input.unitPrice,
      unit: input.unit || null,
      tax_rate_id: input.taxRateId || null,
      sku: input.sku || null,
      category: input.category || null,
      sort_order: input.sortOrder || 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Item;
}

export async function updateItem(
  siteId: string,
  itemId: string,
  input: UpdateItemInput,
): Promise<Item> {
  const supabase = await getModuleClient();

  const dbFields: Record<string, unknown> = {};
  if (input.name !== undefined) dbFields.name = input.name;
  if (input.description !== undefined) dbFields.description = input.description;
  if (input.type !== undefined) dbFields.type = input.type;
  if (input.unitPrice !== undefined) dbFields.unit_price = input.unitPrice;
  if (input.unit !== undefined) dbFields.unit = input.unit;
  if (input.taxRateId !== undefined) dbFields.tax_rate_id = input.taxRateId;
  if (input.sku !== undefined) dbFields.sku = input.sku;
  if (input.category !== undefined) dbFields.category = input.category;
  if (input.sortOrder !== undefined) dbFields.sort_order = input.sortOrder;
  dbFields.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(INV_TABLES.items)
    .update(dbFields)
    .eq("id", itemId)
    .eq("site_id", siteId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Item;
}

export async function deleteItem(
  siteId: string,
  itemId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  // Soft delete by deactivating
  const { error } = await supabase
    .from(INV_TABLES.items)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("site_id", siteId);

  if (error) throw new Error(error.message);
}

export async function getItemCategories(siteId: string): Promise<string[]> {
  const supabase = await getModuleClient();
  const { data, error } = await supabase
    .from(INV_TABLES.items)
    .select("category")
    .eq("site_id", siteId)
    .eq("is_active", true)
    .not("category", "is", null);

  if (error) throw new Error(error.message);
  const categories = [...new Set((data || []).map((d: any) => d.category))];
  return categories.filter(Boolean) as string[];
}
