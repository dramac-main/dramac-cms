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

// ─── Cross-Module Import ───────────────────────────────────────

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function getEcommerceProducts(
  siteId: string,
): Promise<
  { id: string; name: string; base_price: number; sku: string | null; description: string | null; status: string | null }[]
> {
  const supabase = await getModuleClient();
  const { data, error } = await supabase
    .from("mod_ecommod01_products")
    .select("id, name, base_price, sku, description, status")
    .eq("site_id", siteId)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function importEcommerceProducts(
  siteId: string,
  productIds: string[],
): Promise<ImportResult> {
  const supabase = await getModuleClient();

  // Get selected products
  const { data: products, error: fetchErr } = await supabase
    .from("mod_ecommod01_products")
    .select("id, name, description, base_price, sku")
    .eq("site_id", siteId)
    .in("id", productIds);

  if (fetchErr) throw new Error(fetchErr.message);
  if (!products || products.length === 0)
    return { imported: 0, skipped: 0, errors: ["No products found"] };

  // Check existing SKUs to prevent duplicates
  const skus = products
    .map((p: any) => p.sku)
    .filter(Boolean) as string[];

  let existingSkus = new Set<string>();
  if (skus.length > 0) {
    const { data: existing } = await supabase
      .from(INV_TABLES.items)
      .select("sku")
      .eq("site_id", siteId)
      .in("sku", skus);
    existingSkus = new Set(
      (existing || []).map((e: any) => e.sku).filter(Boolean),
    );
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const product of products) {
    const p = product as {
      id: string;
      name: string;
      description: string | null;
      base_price: number;
      sku: string | null;
    };

    if (p.sku && existingSkus.has(p.sku)) {
      skipped++;
      continue;
    }

    const { error: insertErr } = await supabase
      .from(INV_TABLES.items)
      .insert({
        site_id: siteId,
        name: p.name,
        description: p.description || null,
        type: "product" as ItemType,
        unit_price: p.base_price,
        sku: p.sku || null,
        category: "E-Commerce",
        sort_order: 0,
        metadata: { source: "ecommerce", source_id: p.id },
      });

    if (insertErr) {
      errors.push(`${p.name}: ${insertErr.message}`);
    } else {
      imported++;
    }
  }

  return { imported, skipped, errors };
}

export async function getBookingServices(
  siteId: string,
): Promise<
  { id: string; name: string; price: number | null; description: string | null; duration_minutes: number }[]
> {
  const supabase = await getModuleClient();
  const { data, error } = await supabase
    .from("mod_bookmod01_services")
    .select("id, name, price, description, duration_minutes")
    .eq("site_id", siteId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function importBookingServices(
  siteId: string,
  serviceIds: string[],
): Promise<ImportResult> {
  const supabase = await getModuleClient();

  // Get selected services
  const { data: services, error: fetchErr } = await supabase
    .from("mod_bookmod01_services")
    .select("id, name, description, price, duration_minutes")
    .eq("site_id", siteId)
    .in("id", serviceIds);

  if (fetchErr) throw new Error(fetchErr.message);
  if (!services || services.length === 0)
    return { imported: 0, skipped: 0, errors: ["No services found"] };

  // Check existing by metadata source_id to prevent duplicates
  const { data: existing } = await supabase
    .from(INV_TABLES.items)
    .select("metadata")
    .eq("site_id", siteId)
    .eq("category", "Booking");

  const existingSourceIds = new Set<string>();
  for (const e of existing || []) {
    const meta = (e as any).metadata;
    if (meta?.source === "booking" && meta?.source_id) {
      existingSourceIds.add(meta.source_id);
    }
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const service of services) {
    const s = service as {
      id: string;
      name: string;
      description: string | null;
      price: number | null;
      duration_minutes: number;
    };

    if (existingSourceIds.has(s.id)) {
      skipped++;
      continue;
    }

    const { error: insertErr } = await supabase
      .from(INV_TABLES.items)
      .insert({
        site_id: siteId,
        name: s.name,
        description: s.description
          ? `${s.description} (${s.duration_minutes} min)`
          : `${s.duration_minutes} min service`,
        type: "service" as ItemType,
        unit_price: s.price || 0,
        category: "Booking",
        sort_order: 0,
        metadata: { source: "booking", source_id: s.id },
      });

    if (insertErr) {
      errors.push(`${s.name}: ${insertErr.message}`);
    } else {
      imported++;
    }
  }

  return { imported, skipped, errors };
}
