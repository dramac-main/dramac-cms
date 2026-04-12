/**
 * Marketing Module - Tracking Utilities
 *
 * Phase MKT-02 / MKT-03: Tracking Token Encoding/Decoding
 *
 * Encodes campaign/subscriber/send IDs into URL-safe tokens for
 * open tracking pixels and click tracking redirects. Uses Base64
 * encoding with HMAC signature to prevent tampering.
 */

import { createHmac } from "crypto";

// ============================================================================
// TOKEN ENCODING
// ============================================================================

const SEPARATOR = ":";
const SIGNATURE_LENGTH = 8; // first 8 chars of HMAC hex for compact URLs

function getSecret(): string {
  return (
    process.env.MARKETING_TRACKING_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "marketing-tracking-fallback-key"
  );
}

function sign(payload: string): string {
  const hmac = createHmac("sha256", getSecret());
  hmac.update(payload);
  return hmac.digest("hex").substring(0, SIGNATURE_LENGTH);
}

function toBase64Url(str: string): string {
  return Buffer.from(str, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return Buffer.from(base64, "base64").toString("utf-8");
}

// ============================================================================
// OPEN TRACKING TOKEN
// ============================================================================

/**
 * Create an open-tracking token: base64url(campaignId:subscriberId:sendId:signature)
 */
export function encodeTrackingToken(
  campaignId: string,
  subscriberId: string,
  sendId: string,
): string {
  const payload = [campaignId, subscriberId, sendId].join(SEPARATOR);
  const sig = sign(payload);
  return toBase64Url(`${payload}${SEPARATOR}${sig}`);
}

/**
 * Decode and verify an open-tracking token.
 */
export function decodeTrackingToken(token: string): {
  campaignId: string;
  subscriberId: string;
  sendId: string;
} {
  const decoded = fromBase64Url(token);
  const parts = decoded.split(SEPARATOR);

  if (parts.length < 4) {
    throw new Error("Invalid tracking token");
  }

  const [campaignId, subscriberId, sendId, sig] = parts;
  const payload = [campaignId, subscriberId, sendId].join(SEPARATOR);
  const expectedSig = sign(payload);

  if (sig !== expectedSig) {
    throw new Error("Invalid tracking token signature");
  }

  return { campaignId, subscriberId, sendId };
}

// ============================================================================
// CLICK TRACKING TOKEN
// ============================================================================

/**
 * Create a click-tracking token: base64url(campaignId:subscriberId:sendId:encodedUrl:signature)
 */
export function encodeClickToken(
  campaignId: string,
  subscriberId: string,
  sendId: string,
  originalUrl: string,
): string {
  const encodedUrl = encodeURIComponent(originalUrl);
  const payload = [campaignId, subscriberId, sendId, encodedUrl].join(
    SEPARATOR,
  );
  const sig = sign(payload);
  return toBase64Url(`${payload}${SEPARATOR}${sig}`);
}

/**
 * Decode and verify a click-tracking token.
 */
export function decodeClickToken(token: string): {
  campaignId: string;
  subscriberId: string;
  sendId: string;
  originalUrl: string;
} {
  const decoded = fromBase64Url(token);
  // Split from the right since URL might contain the separator after encoding
  const parts = decoded.split(SEPARATOR);

  if (parts.length < 5) {
    throw new Error("Invalid click token");
  }

  // Last part is signature, second-to-last is encoded URL
  const sig = parts[parts.length - 1];
  const encodedUrl = parts.slice(3, parts.length - 1).join(SEPARATOR);
  const [campaignId, subscriberId, sendId] = parts;

  const payload = [campaignId, subscriberId, sendId, encodedUrl].join(
    SEPARATOR,
  );
  const expectedSig = sign(payload);

  if (sig !== expectedSig) {
    throw new Error("Invalid click token signature");
  }

  return {
    campaignId,
    subscriberId,
    sendId,
    originalUrl: decodeURIComponent(encodedUrl),
  };
}

// ============================================================================
// UNSUBSCRIBE TOKEN
// ============================================================================

/**
 * Creates a signed unsubscribe token (same format as tracking token).
 */
export function encodeUnsubscribeToken(
  campaignId: string,
  subscriberId: string,
  sendId: string,
): string {
  return encodeTrackingToken(campaignId, subscriberId, sendId);
}

/**
 * Decode and verify an unsubscribe token.
 */
export function decodeUnsubscribeToken(token: string): {
  campaignId: string;
  subscriberId: string;
  sendId: string;
} {
  return decodeTrackingToken(token);
}
