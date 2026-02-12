// src/lib/domain-availability-fallback.ts
// Fallback domain availability checker using DNS and RDAP
// Used when the primary ResellerClub API is unavailable

/**
 * Check domain availability using DNS resolution as a heuristic.
 * 
 * How it works:
 * - If a domain has NO DNS records at all, it's likely available (or parked without DNS)
 * - If a domain resolves to IP addresses, it's definitely registered
 * - This is NOT 100% accurate (some registered domains have no DNS configured),
 *   but it's much better than showing "Already registered" for everything
 * 
 * We also try RDAP (Registration Data Access Protocol) as a secondary check
 * when DNS is inconclusive.
 */

interface FallbackAvailabilityResult {
  domain: string;
  available: boolean;
  /** Always true for fallback results — they're heuristic-based, not authoritative */
  unverified: true;
  method: 'dns' | 'rdap' | 'error';
}

/**
 * Check domain availability via DNS lookup + RDAP.
 * Returns heuristic result — always marked as `unverified`.
 */
export async function checkAvailabilityFallback(
  domains: string[]
): Promise<FallbackAvailabilityResult[]> {
  const results = await Promise.allSettled(
    domains.map(domain => checkSingleDomain(domain))
  );
  
  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      domain: domains[i],
      available: false,
      unverified: true as const,
      method: 'error' as const,
    };
  });
}

async function checkSingleDomain(domain: string): Promise<FallbackAvailabilityResult> {
  // Method 1: Try RDAP lookup (most reliable free method)
  try {
    const rdapResult = await checkRdap(domain);
    if (rdapResult !== null) {
      return {
        domain,
        available: !rdapResult,
        unverified: true,
        method: 'rdap',
      };
    }
  } catch {
    // RDAP failed, try DNS
  }
  
  // Method 2: DNS resolution check
  try {
    const dnsResult = await checkDns(domain);
    return {
      domain,
      available: !dnsResult,
      unverified: true,
      method: 'dns',
    };
  } catch {
    // Both methods failed
    return {
      domain,
      available: false,
      unverified: true,
      method: 'error',
    };
  }
}

/**
 * Check RDAP (Registration Data Access Protocol) for domain registration status.
 * Returns true if registered, false if available, null if inconclusive.
 * 
 * Uses the IANA RDAP bootstrap to find the right RDAP server for each TLD.
 */
async function checkRdap(domain: string): Promise<boolean | null> {
  const tld = domain.split('.').pop()?.toLowerCase();
  if (!tld) return null;
  
  // Known RDAP endpoints for TLDs
  // Sources: IANA RDAP bootstrap (https://data.iana.org/rdap/dns.json)
  const rdapServers: Record<string, string> = {
    // Popular gTLDs
    com: 'https://rdap.verisign.com/com/v1',
    net: 'https://rdap.verisign.com/net/v1',
    org: 'https://rdap.org/org/v1',
    io: 'https://rdap.nic.io/v1',
    co: 'https://rdap.nic.co/v1',
    app: 'https://rdap.nic.google/v1',
    dev: 'https://rdap.nic.google/v1',
    // Business
    biz: 'https://rdap.nic.biz/v1',
    shop: 'https://rdap.nic.google/v1',
    store: 'https://rdap.nic.store/v1',
    // Tech
    tech: 'https://rdap.centralnic.com/tech/v1',
    cloud: 'https://rdap.nic.google/v1',
    online: 'https://rdap.centralnic.com/online/v1',
    website: 'https://rdap.centralnic.com/website/v1',
    site: 'https://rdap.centralnic.com/site/v1',
    blog: 'https://rdap.nic.blog/v1',
    email: 'https://rdap.centralnic.com/email/v1',
    digital: 'https://rdap.donuts.co/rdap/v1',
    // Creative
    design: 'https://rdap.donuts.co/rdap/v1',
    art: 'https://rdap.centralnic.com/art/v1',
    media: 'https://rdap.donuts.co/rdap/v1',
    space: 'https://rdap.centralnic.com/space/v1',
    // Country
    uk: 'https://rdap.nominet.uk/uk/v1',
    us: 'https://rdap.nic.us/v1',
    de: 'https://rdap.denic.de/v1',
    fr: 'https://rdap.nic.fr/v1',
    au: 'https://rdap.auda.org.au/v1',
    // Africa
    africa: 'https://rdap.nic.africa/v1',
    za: 'https://rdap.nic.za/v1',
    // Lifestyle
    xyz: 'https://rdap.centralnic.com/xyz/v1',
    club: 'https://rdap.nic.club/v1',
    top: 'https://rdap.nic.top/v1',
    live: 'https://rdap.donuts.co/rdap/v1',
    life: 'https://rdap.donuts.co/rdap/v1',
    world: 'https://rdap.donuts.co/rdap/v1',
    // Professional
    pro: 'https://rdap.nic.pro/v1',
    solutions: 'https://rdap.donuts.co/rdap/v1',
    academy: 'https://rdap.donuts.co/rdap/v1',
  };
  
  const server = rdapServers[tld];
  if (!server) return null;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${server}/domain/${domain}`, {
      headers: { Accept: 'application/rdap+json, application/json' },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.status === 200) {
      // Domain exists in RDAP — it's registered
      return true;
    }
    
    if (response.status === 404) {
      // Domain not found in RDAP — likely available
      return false;
    }
    
    // Other status codes are inconclusive
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a domain has DNS records (A, AAAA, or NS).
 * Returns true if DNS records exist (domain is registered), false otherwise.
 * 
 * Uses Cloudflare's DNS-over-HTTPS API.
 */
async function checkDns(domain: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Check NS records — most reliable indicator of registration
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`,
      {
        headers: { Accept: 'application/dns-json' },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return false;
    
    const data = await response.json() as { Answer?: Array<{ type: number; data: string }> };
    
    // If there are NS records, the domain is registered
    return !!(data.Answer && data.Answer.length > 0);
  } catch {
    return false;
  }
}
