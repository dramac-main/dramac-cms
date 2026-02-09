/**
 * Domain Health Monitoring Service
 *
 * Phase DM-01: Domain Management Overhaul
 *
 * Checks DNS resolution, HTTP reachability, and SSL validity
 * for all sites with custom domains.
 */

export interface HealthCheck {
  name: string;
  passed: boolean;
  detail: string;
  responseTime?: number;
}

export interface DomainHealthReport {
  domain: string;
  healthy: boolean;
  checks: HealthCheck[];
  lastChecked: string;
}

/**
 * Verify DNS records for a domain.
 * Checks if CNAME or A record points to Vercel.
 */
export async function verifyDnsRecords(domain: string): Promise<{
  cname: boolean;
  aRecord: boolean;
  propagated: boolean;
  details: string;
}> {
  try {
    // Use DNS-over-HTTPS (works in edge/serverless environments)
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
      { next: { revalidate: 0 } }
    );

    if (!response.ok) {
      return {
        cname: false,
        aRecord: false,
        propagated: false,
        details: "DNS lookup failed",
      };
    }

    const data = await response.json();
    const answers: Array<{ type: number; data: string }> = data.Answer || [];

    // Type 5 = CNAME, Type 1 = A
    const cnameRecords = answers
      .filter((a) => a.type === 5)
      .map((a) => a.data);
    const aRecords = answers
      .filter((a) => a.type === 1)
      .map((a) => a.data);

    const hasCname = cnameRecords.some((r) =>
      r.toLowerCase().includes("vercel")
    );
    const hasARecord = aRecords.includes("76.76.21.21");

    return {
      cname: hasCname,
      aRecord: hasARecord,
      propagated: hasCname || hasARecord,
      details: hasCname
        ? `CNAME → ${cnameRecords[0]}`
        : hasARecord
          ? `A → ${aRecords[0]}`
          : `No matching DNS records found. Got: ${JSON.stringify(answers.map((a) => a.data))}`,
    };
  } catch (error) {
    return {
      cname: false,
      aRecord: false,
      propagated: false,
      details:
        error instanceof Error ? error.message : "DNS verification failed",
    };
  }
}

/**
 * Check if a domain is reachable over HTTPS.
 */
export async function checkHttpReachability(
  domain: string
): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const response = await fetch(`https://${domain}`, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    const responseTime = Date.now() - start;
    return {
      name: "HTTP Reachability",
      passed: response.ok || response.status === 301 || response.status === 302,
      detail: `Status ${response.status} (${responseTime}ms)`,
      responseTime,
    };
  } catch (error) {
    return {
      name: "HTTP Reachability",
      passed: false,
      detail: error instanceof Error ? error.message : "Connection failed",
      responseTime: Date.now() - start,
    };
  }
}

/**
 * Full domain health check combining DNS + HTTP.
 */
export async function checkDomainHealth(
  domain: string
): Promise<DomainHealthReport> {
  const checks: HealthCheck[] = [];

  // 1. DNS Resolution
  const dns = await verifyDnsRecords(domain);
  checks.push({
    name: "DNS Resolution",
    passed: dns.propagated,
    detail: dns.details,
  });

  // 2. HTTP Reachability (only if DNS is good)
  if (dns.propagated) {
    const http = await checkHttpReachability(domain);
    checks.push(http);
  } else {
    checks.push({
      name: "HTTP Reachability",
      passed: false,
      detail: "Skipped — DNS not propagated",
    });
  }

  return {
    domain,
    healthy: checks.every((c) => c.passed),
    checks,
    lastChecked: new Date().toISOString(),
  };
}
