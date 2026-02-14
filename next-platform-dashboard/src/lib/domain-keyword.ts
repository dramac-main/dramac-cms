/**
 * Normalize domain search keyword so pasted text (SMS, messenger, etc.) and typed
 * input produce the same value. Avoids different results when "text" vs "type".
 */
export function normalizeDomainKeyword(keyword: string): string {
  if (typeof keyword !== 'string') return '';
  return keyword
    .trim()
    .normalize('NFKC') // collapse Unicode variants (e.g. different spaces, zero-width)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}
