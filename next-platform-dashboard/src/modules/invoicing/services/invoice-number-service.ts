"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Invoice Number Service
 *
 * Uses the Supabase RPC function `generate_next_invoice_number`
 * for atomic sequential number generation with FOR UPDATE locking.
 *
 * Supports doc types: 'invoice', 'credit_note', 'bill', 'po'
 * Format tokens: {prefix}, {year}, {month}, {number}
 */

export async function generateNextDocumentNumber(
  siteId: string,
  docType: "invoice" | "credit_note" | "bill" | "po" = "invoice",
): Promise<string> {
  const supabase = (await createClient()) as any;

  const { data, error } = await supabase.rpc("generate_next_invoice_number", {
    p_site_id: siteId,
    p_doc_type: docType,
  });

  if (error) {
    throw new Error(`Failed to generate ${docType} number: ${error.message}`);
  }

  return data as string;
}
