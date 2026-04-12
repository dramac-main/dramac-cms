/**
 * SMS Utility Functions (client-safe)
 *
 * Pure utility functions for SMS segment calculation and personalization.
 * Separated from sms-provider.ts to avoid importing server-only code in client components.
 */

/**
 * Calculate number of SMS segments for a message
 * Standard SMS: 160 chars (GSM-7) or 70 chars (UCS-2/Unicode)
 */
export function calculateSMSSegments(message: string): {
  characterCount: number;
  segments: number;
  encoding: "GSM-7" | "UCS-2";
} {
  // Check if message contains non-GSM characters
  const gsmRegex =
    /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1B !"#¤%&'()*+,\-.\/0-9:;<=>?¡A-ZÄÖÑÜa-zäöñüà§]*$/;
  const isGSM = gsmRegex.test(message);
  const charCount = message.length;

  if (isGSM) {
    const segments = charCount <= 160 ? 1 : Math.ceil(charCount / 153);
    return { characterCount: charCount, segments, encoding: "GSM-7" };
  } else {
    const segments = charCount <= 70 ? 1 : Math.ceil(charCount / 67);
    return { characterCount: charCount, segments, encoding: "UCS-2" };
  }
}

/**
 * Apply personalization tokens to SMS text
 */
export function personalizeSMS(
  template: string,
  contact: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  },
): string {
  return template
    .replace(/\{\{first_name\}\}/g, contact.firstName || "")
    .replace(/\{\{last_name\}\}/g, contact.lastName || "")
    .replace(/\{\{email\}\}/g, contact.email || "")
    .replace(/\{\{phone\}\}/g, contact.phone || "")
    .trim();
}
