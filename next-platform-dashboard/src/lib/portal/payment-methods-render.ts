/**
 * Payment-methods rendering helpers (NOT a server action file).
 *
 * Lives outside any "use server" module so that synchronous helpers can be
 * shared between the portal action layer and other server/client code.
 */

export interface PaymentMethodRow {
  label: string;
  details: string;
}

/** Render a list of structured rows back into the numbered-list format the
 *  parser understands most reliably. */
export function renderPaymentMethods(rows: PaymentMethodRow[]): string {
  return rows
    .map((row, idx) => {
      const label = row.label.trim() || `Method ${idx + 1}`;
      const details = row.details.trim();
      return details
        ? `${idx + 1}. ${label}\n${details}`
        : `${idx + 1}. ${label}`;
    })
    .join("\n\n");
}
