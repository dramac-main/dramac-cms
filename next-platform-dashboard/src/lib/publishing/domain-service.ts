import { createAdminClient } from "@/lib/supabase/admin";
import dns from "dns";
import { promisify } from "util";

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

export interface DomainVerificationResult {
  verified: boolean;
  method: "txt" | "cname" | null;
  error?: string;
}

export interface DomainConfig {
  domain: string;
  txtRecord: string;
  cnameTarget: string;
}

export function generateDomainConfig(siteId: string): DomainConfig {
  const verificationCode = `dramac-verify=${siteId}`;
  const cnameTarget = process.env.NEXT_PUBLIC_CNAME_TARGET || "cname.platform.com";

  return {
    domain: "", // Will be filled by user
    txtRecord: verificationCode,
    cnameTarget,
  };
}

export async function verifyDomain(
  domain: string,
  siteId: string
): Promise<DomainVerificationResult> {
  const expectedTxt = `dramac-verify=${siteId}`;
  const expectedCname = process.env.NEXT_PUBLIC_CNAME_TARGET || "cname.platform.com";

  try {
    // Try TXT record verification
    try {
      const txtRecords = await resolveTxt(domain);
      const flatRecords = txtRecords.flat();
      
      if (flatRecords.some((record) => record.includes(expectedTxt))) {
        return { verified: true, method: "txt" };
      }
    } catch {
      // TXT lookup failed, continue to CNAME
    }

    // Try CNAME verification
    try {
      const cnameRecords = await resolveCname(domain);
      
      if (cnameRecords.some((record) => record === expectedCname)) {
        return { verified: true, method: "cname" };
      }
    } catch {
      // CNAME lookup failed
    }

    return {
      verified: false,
      method: null,
      error: "Domain verification failed. Please check your DNS settings.",
    };
  } catch (_error) {
    return {
      verified: false,
      method: null,
      error: "Failed to verify domain. DNS lookup error.",
    };
  }
}

export async function setCustomDomain(
  siteId: string,
  domain: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Clean domain
  const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "");

  // Verify domain first
  const verification = await verifyDomain(cleanDomain, siteId);
  
  if (!verification.verified) {
    return {
      success: false,
      error: verification.error || "Domain verification failed",
    };
  }

  // Check if domain is already in use
  const { data: existing } = await supabase
    .from("sites")
    .select("id")
    .eq("custom_domain", cleanDomain)
    .neq("id", siteId)
    .single();

  if (existing) {
    return {
      success: false,
      error: "This domain is already in use by another site",
    };
  }

  // Update site with domain
  const { error } = await supabase
    .from("sites")
    .update({
      custom_domain: cleanDomain,
    })
    .eq("id", siteId);

  if (error) {
    return { success: false, error: "Failed to set custom domain" };
  }

  return { success: true };
}

export async function removeCustomDomain(
  siteId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("sites")
    .update({
      custom_domain: null,
    })
    .eq("id", siteId);

  if (error) {
    return { success: false, error: "Failed to remove custom domain" };
  }

  return { success: true };
}
