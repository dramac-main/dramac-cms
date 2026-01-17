"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import dns from "dns";
import { promisify } from "util";

const resolveTxt = promisify(dns.resolveTxt);
const resolve4 = promisify(dns.resolve4);

export interface DomainStatus {
  domain: string;
  configured: boolean;
  verified: boolean;
  sslActive: boolean;
  dnsRecords: DnsRecord[];
  verificationToken: string;
  lastChecked: string | null;
}

export interface DnsRecord {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
  required: boolean;
  verified: boolean;
}

// Platform IP address for A records (would be your load balancer/CDN)
const PLATFORM_IP = process.env.PLATFORM_IP || "76.76.21.21";
const VERIFICATION_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dramac.app";

export async function setCustomDomain(siteId: string, domain: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate domain format
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return { success: false, error: "Invalid domain format" };
    }

    // Normalize domain (lowercase, no www prefix stored)
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");

    const supabase = createAdminClient();

    // Check if domain is already in use
    const { data: existing } = await supabase
      .from("sites")
      .select("id")
      .eq("custom_domain", normalizedDomain)
      .neq("id", siteId)
      .single();

    if (existing) {
      return { success: false, error: "Domain is already in use by another site" };
    }

    // Generate verification token
    const verificationToken = `dramac-verify-${siteId.slice(0, 8)}-${Date.now().toString(36)}`;

    // Update site with domain
    const { error } = await supabase
      .from("sites")
      .update({
        custom_domain: normalizedDomain,
        custom_domain_verified: false,
        domain_verification_token: verificationToken,
        updated_at: new Date().toISOString(),
      })
      .eq("id", siteId);

    if (error) {
      console.error("[DomainService] Set domain error:", error);
      return { success: false, error: "Failed to set custom domain" };
    }

    revalidatePath(`/sites/${siteId}`);
    return { success: true };
  } catch (error) {
    console.error("[DomainService] Error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function removeCustomDomain(siteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("sites")
      .update({
        custom_domain: null,
        custom_domain_verified: false,
        domain_verification_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", siteId);

    if (error) {
      return { success: false, error: "Failed to remove custom domain" };
    }

    revalidatePath(`/sites/${siteId}`);
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getDomainStatus(siteId: string): Promise<DomainStatus | null> {
  try {
    const supabase = createAdminClient();

    const { data: site, error } = await supabase
      .from("sites")
      .select("custom_domain, custom_domain_verified, domain_verification_token, domain_last_checked, subdomain")
      .eq("id", siteId)
      .single();

    if (error || !site || !site.custom_domain) {
      return null;
    }

    // Generate required DNS records
    const dnsRecords: DnsRecord[] = [
      {
        type: "A",
        name: "@",
        value: PLATFORM_IP,
        required: true,
        verified: false, // Would check actual DNS
      },
      {
        type: "CNAME",
        name: "www",
        value: `${site.subdomain}.${VERIFICATION_DOMAIN}`,
        required: false,
        verified: false,
      },
      {
        type: "TXT",
        name: "_dramac-verification",
        value: site.domain_verification_token || "",
        required: true,
        verified: false,
      },
    ];

    return {
      domain: site.custom_domain,
      configured: true,
      verified: site.custom_domain_verified || false,
      sslActive: site.custom_domain_verified || false, // SSL auto-enabled when verified
      dnsRecords,
      verificationToken: site.domain_verification_token || "",
      lastChecked: site.domain_last_checked,
    };
  } catch (error) {
    console.error("[DomainService] Get status error:", error);
    return null;
  }
}

export async function verifyDomain(siteId: string): Promise<{ success: boolean; verified: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Get site domain info
    const { data: site, error: fetchError } = await supabase
      .from("sites")
      .select("custom_domain, domain_verification_token")
      .eq("id", siteId)
      .single();

    if (fetchError || !site?.custom_domain) {
      return { success: false, verified: false, error: "Domain not configured" };
    }

    // Perform actual DNS verification
    const isVerified = await performDnsVerification(
      site.custom_domain,
      site.domain_verification_token || ""
    );

    // Update verification status
    const { error: updateError } = await supabase
      .from("sites")
      .update({
        custom_domain_verified: isVerified,
        domain_last_checked: new Date().toISOString(),
      })
      .eq("id", siteId);

    if (updateError) {
      return { success: false, verified: false, error: "Failed to update status" };
    }

    revalidatePath(`/sites/${siteId}`);

    return {
      success: true,
      verified: isVerified,
      error: isVerified ? undefined : "DNS records not found. Please check your configuration.",
    };
  } catch (error) {
    console.error("[DomainService] Verification error:", error);
    return { success: false, verified: false, error: "Verification failed" };
  }
}

async function performDnsVerification(domain: string, token: string): Promise<boolean> {
  try {
    // Check TXT record for verification
    try {
      const txtRecords = await resolveTxt(`_dramac-verification.${domain}`);
      const flatRecords = txtRecords.flat();
      if (flatRecords.some(record => record.includes(token))) {
        // Also verify A record points to our server
        try {
          const aRecords = await resolve4(domain);
          if (aRecords.includes(PLATFORM_IP)) {
            return true;
          }
        } catch {
          // A record check failed but TXT passed - still consider pending
        }
      }
    } catch {
      // TXT record not found
    }

    return false;
  } catch (error) {
    console.error("[DNS] Verification error:", error);
    return false;
  }
}

export interface DomainConfig {
  domain: string;
  txtRecord: string;
  cnameTarget: string;
}

export async function generateDomainConfig(siteId: string): Promise<DomainConfig> {
  const verificationCode = `dramac-verify=${siteId}`;
  const cnameTarget = process.env.NEXT_PUBLIC_CNAME_TARGET || "cname.dramac.app";

  return {
    domain: "",
    txtRecord: verificationCode,
    cnameTarget,
  };
}
