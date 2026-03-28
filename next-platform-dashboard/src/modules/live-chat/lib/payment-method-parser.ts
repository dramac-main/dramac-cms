/**
 * Payment Method Parser
 *
 * PHASE LC-12: Parses free-text payment instructions from ecommerce settings
 * into structured payment methods for interactive button selection in chat.
 */

export interface ParsedPaymentMethod {
  id: string;
  label: string;
  details: string;
}

/**
 * Parse free-text payment instructions into individual payment methods.
 *
 * Supports common formats:
 * - Numbered lists: "1. Bank Transfer\n  Account: ...\n\n2. Mobile Money\n  ..."
 * - Heading with colon: "Bank Transfer:\nAccount: ...\n\nMobile Money:\n..."
 * - Separator-based: "--- Bank Transfer ---\n...\n--- Mobile Money ---\n..."
 *
 * Returns null if fewer than 2 methods are detected (in which case, fall back
 * to the monolithic AI message).
 */
export function parsePaymentMethods(
  instructions: string,
): ParsedPaymentMethod[] | null {
  if (!instructions || instructions.trim().length === 0) return null;

  // Strategy 1: Numbered list (e.g., "1. ZANACO Bank Transfer\n   Bank: ...\n\n2. Airtel Money")
  const numberedSections = splitByNumberedItems(instructions);
  if (numberedSections && numberedSections.length >= 2) {
    return numberedSections;
  }

  // Strategy 2: Lines ending with colon as headings (e.g., "Bank Transfer:\nAccount:...")
  const colonSections = splitByColonHeadings(instructions);
  if (colonSections && colonSections.length >= 2) {
    return colonSections;
  }

  // Strategy 3: Separator-based (--- or === or *** dividers)
  const separatorSections = splitBySeparators(instructions);
  if (separatorSections && separatorSections.length >= 2) {
    return separatorSections;
  }

  // Could not parse — fall back to monolithic AI message
  return null;
}

// ─── Strategy 1: Numbered items ──────────────────────────────────────────────

function splitByNumberedItems(text: string): ParsedPaymentMethod[] | null {
  // Match patterns like "1. Title" or "1) Title" at the start of a line
  const pattern = /^(\d+)[.)]\s+(.+)/gm;
  const matches: { index: number; number: string; title: string }[] = [];

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    matches.push({
      index: match.index,
      number: match[1],
      title: match[2].trim(),
    });
  }

  if (matches.length < 2) return null;

  const methods: ParsedPaymentMethod[] = [];

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const fullBlock = text.slice(start, end).trim();

    // The title is the first line after the number
    const title = matches[i].title;

    // Details is everything after the title line
    const firstNewline = fullBlock.indexOf("\n");
    const details =
      firstNewline >= 0 ? fullBlock.slice(firstNewline + 1).trim() : "";

    methods.push({
      id: slugify(title),
      label: title,
      details,
    });
  }

  return methods;
}

// ─── Strategy 2: Colon headings ──────────────────────────────────────────────

function splitByColonHeadings(text: string): ParsedPaymentMethod[] | null {
  // Match lines that look like headings: start of line, NO leading whitespace,
  // title text (no colon in the middle), ending with a colon
  // Exclude lines that look like key-value pairs (e.g., "Account Number: 123")
  const lines = text.split("\n");
  const headingIndices: { index: number; title: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Must start at column 0 (no indentation), end with colon, and
    // the part before the colon shouldn't look like a key-value label
    const trimmed = line.trim();
    if (
      trimmed.endsWith(":") &&
      !line.startsWith(" ") &&
      !line.startsWith("\t") &&
      trimmed.length > 3 &&
      trimmed.length <= 60 &&
      // Not a key-value like "Account Number:"
      !trimmed.match(/^(account|bank|branch|name|number|phone|send|reference)/i)
    ) {
      headingIndices.push({
        index: i,
        title: trimmed.slice(0, -1).trim(), // remove trailing colon
      });
    }
  }

  if (headingIndices.length < 2) return null;

  const methods: ParsedPaymentMethod[] = [];
  for (let i = 0; i < headingIndices.length; i++) {
    const startLine = headingIndices[i].index + 1;
    const endLine =
      i + 1 < headingIndices.length
        ? headingIndices[i + 1].index
        : lines.length;
    const details = lines
      .slice(startLine, endLine)
      .join("\n")
      .trim();

    methods.push({
      id: slugify(headingIndices[i].title),
      label: headingIndices[i].title,
      details,
    });
  }

  return methods;
}

// ─── Strategy 3: Separator-based ─────────────────────────────────────────────

function splitBySeparators(text: string): ParsedPaymentMethod[] | null {
  // Split by lines that are only dashes, equals, or asterisks (3+ chars)
  const parts = text.split(/\n[-=*]{3,}\n/);
  if (parts.length < 2) return null;

  const methods: ParsedPaymentMethod[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // First non-empty line is the title
    const firstLineEnd = trimmed.indexOf("\n");
    const title =
      firstLineEnd >= 0 ? trimmed.slice(0, firstLineEnd).trim() : trimmed;
    const details =
      firstLineEnd >= 0 ? trimmed.slice(firstLineEnd + 1).trim() : "";

    // Skip preamble/footer paragraphs that don't look like payment methods
    if (title.length > 80 || title.split(" ").length > 10) continue;

    methods.push({
      id: slugify(title),
      label: title,
      details,
    });
  }

  return methods.length >= 2 ? methods : null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 50);
}
