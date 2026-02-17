/**
 * Normalize domain search keyword so pasted text (SMS, messenger, etc.) and typed
 * input produce the same value. Avoids different results when "text" vs "type".
 *
 * Preserves dots so users can type full domain names like "1044.io" or "example.com".
 * The search action will detect if the keyword contains a TLD and extract it.
 */
export function normalizeDomainKeyword(keyword: string): string {
  if (typeof keyword !== 'string') return '';
  return keyword
    .trim()
    .normalize('NFKC') // collapse Unicode variants (e.g. different spaces, zero-width)
    .toLowerCase()
    .replace(/[^a-z0-9.\-]/g, '')  // keep dots and hyphens for domain names
    .replace(/^[.\-]+/, '')          // strip leading dots/hyphens
    .replace(/\.{2,}/g, '.');       // collapse consecutive dots
}

/**
 * Parse a search keyword that may contain a full domain name (e.g. "1044.io", "example.com").
 * Returns the SLD (keyword) and, if a TLD was detected, the TLD to prioritize.
 * @param keyword  Normalized keyword (may contain dots)
 * @param knownTlds List of supported TLDs to match against (e.g. ['.com', '.io', '.co.za'])
 * @returns  { sld: string, detectedTld?: string }
 */
export function parseDomainKeyword(
  keyword: string,
  knownTlds: string[]
): { sld: string; detectedTld?: string } {
  if (!keyword || !keyword.includes('.')) {
    // No dot → plain keyword, no TLD detection
    return { sld: keyword.replace(/\./g, '') };
  }

  // Sort TLDs by length descending so compound TLDs like .co.za match before .za
  const sorted = [...knownTlds].sort((a, b) => b.length - a.length);

  for (const tld of sorted) {
    const bare = tld.startsWith('.') ? tld : '.' + tld;
    if (keyword.endsWith(bare.slice(1)) || keyword.endsWith(bare)) {
      // User typed e.g. "1044.io" or "mysite.co.za"
      const sld = keyword.endsWith(bare)
        ? keyword.slice(0, -bare.length)
        : keyword.slice(0, -(bare.length - 1));
      if (sld && sld.length >= 1) {
        return { sld: sld.replace(/\.$/, ''), detectedTld: bare };
      }
    }
  }

  // Dot present but no known TLD matched — treat everything before the last dot as keyword
  const lastDot = keyword.lastIndexOf('.');
  const sld = keyword.slice(0, lastDot);
  const possibleTld = '.' + keyword.slice(lastDot + 1);
  if (sld && sld.length >= 1) {
    return { sld, detectedTld: possibleTld };
  }

  // Fallback: strip dots and use as plain keyword
  return { sld: keyword.replace(/\./g, '') };
}
