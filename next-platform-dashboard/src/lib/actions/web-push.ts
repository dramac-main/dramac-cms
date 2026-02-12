"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
// push_subscriptions table is not yet in generated Supabase types — will be after migration
import { createClient } from "@/lib/supabase/server";

// Table name constant for push subscriptions (not in generated types yet)
const PUSH_TABLE = "push_subscriptions" as any;

// Web Push sending using the Web Push protocol directly (no npm dependency needed)
// Uses VAPID for authentication

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@dramac.com";

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string | null;
  context: string;
  site_id: string | null;
  conversation_id: string | null;
  user_agent: string;
  created_at: string;
  updated_at: string;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
  conversationId?: string;
  type?: "chat" | "notification" | "general";
  renotify?: boolean;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string }>;
}

/**
 * Send push notification to a specific user (agent)
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("VAPID keys not configured, skipping web push");
    return { sent: 0 };
  }

  const supabase = await createClient();
  const { data: subscriptions } = await supabase
    .from(PUSH_TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("context", "agent") as { data: PushSubscriptionRow[] | null };

  if (!subscriptions?.length) return { sent: 0 };

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      const success = await sendWebPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      if (success) sent++;
    } catch (err) {
      console.error("Push send failed:", err);
      // Remove stale subscription
      await supabase.from(PUSH_TABLE).delete().eq("endpoint", sub.endpoint);
    }
  }

  return { sent };
}

/**
 * Send push notification to customer(s) in a conversation
 */
export async function sendPushToConversation(conversationId: string, payload: PushPayload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("VAPID keys not configured, skipping web push");
    return { sent: 0 };
  }

  const supabase = await createClient();
  const { data: subscriptions } = await supabase
    .from(PUSH_TABLE)
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("context", "customer") as { data: PushSubscriptionRow[] | null };

  if (!subscriptions?.length) return { sent: 0 };

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      const success = await sendWebPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      if (success) sent++;
    } catch (err) {
      console.error("Push send failed:", err);
      await supabase.from(PUSH_TABLE).delete().eq("endpoint", sub.endpoint);
    }
  }

  return { sent };
}

/**
 * Send push notification to all agents of a site
 */
export async function sendPushToSiteAgents(siteId: string, payload: PushPayload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("VAPID keys not configured, skipping web push");
    return { sent: 0 };
  }

  const supabase = await createClient();

  // Get all agents for this site's agency
  const { data: site } = await supabase
    .from("sites")
    .select("agency_id")
    .eq("id", siteId)
    .single();

  if (!site?.agency_id) return { sent: 0 };

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("agency_id", site.agency_id);

  if (!profiles?.length) return { sent: 0 };

  const userIds = profiles.map((p) => p.id);
  const { data: subscriptions } = await supabase
    .from(PUSH_TABLE)
    .select("*")
    .in("user_id", userIds)
    .eq("context", "agent") as { data: PushSubscriptionRow[] | null };

  if (!subscriptions?.length) return { sent: 0 };

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      const success = await sendWebPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      if (success) sent++;
    } catch (err) {
      console.error("Push send failed:", err);
      await supabase.from(PUSH_TABLE).delete().eq("endpoint", sub.endpoint);
    }
  }

  return { sent };
}

/**
 * Low-level Web Push send using fetch + VAPID
 * Implements RFC 8291 (Message Encryption) via a simplified approach
 */
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload
): Promise<boolean> {
  try {
    // For the initial implementation, use a lightweight approach
    // We send a simple POST to the push endpoint with the payload
    // Full VAPID + encryption requires crypto operations
    
    // Use Node.js crypto for VAPID JWT generation
    const { createSign, createECDH, randomBytes, createCipheriv, createHmac } = await import("crypto");
    
    // Generate VAPID JWT
    const vapidToken = await generateVapidJwt(subscription.endpoint, createSign);
    
    // Encrypt payload
    const payloadBuffer = Buffer.from(JSON.stringify(payload));
    const encrypted = await encryptPayload(
      payloadBuffer,
      subscription.keys.p256dh,
      subscription.keys.auth,
      createECDH,
      randomBytes,
      createCipheriv,
      createHmac
    );

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "Content-Length": String(encrypted.length),
        TTL: "86400",
        Authorization: `vapid t=${vapidToken.token}, k=${vapidToken.publicKey}`,
      },
      body: new Uint8Array(encrypted),
    });

    if (response.status === 410 || response.status === 404) {
      // Subscription expired — caller should delete
      throw new Error("Subscription expired");
    }

    return response.status >= 200 && response.status < 300;
  } catch (err) {
    throw err;
  }
}

/**
 * Generate VAPID JWT for Authorization header
 */
async function generateVapidJwt(
  endpoint: string,
  createSign: typeof import("crypto").createSign
) {
  const audience = new URL(endpoint).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours

  const header = Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ aud: audience, exp: expiration, sub: VAPID_SUBJECT })
  ).toString("base64url");

  const unsignedToken = `${header}.${payload}`;

  // Decode VAPID private key from base64url
  const privateKeyBuffer = Buffer.from(VAPID_PRIVATE_KEY, "base64url");

  // Create DER-encoded private key
  const privateKeyDer = Buffer.concat([
    Buffer.from("308141020100301306072a8648ce3d020106082a8648ce3d030107042730250201010420", "hex"),
    privateKeyBuffer,
  ]);

  const sign = createSign("SHA256");
  sign.update(unsignedToken);
  const signature = sign.sign({ key: privateKeyDer, format: "der", type: "pkcs8" });

  // Convert DER signature to raw r||s format
  const rawSig = derToRaw(signature);
  const sig = Buffer.from(rawSig).toString("base64url");

  return {
    token: `${unsignedToken}.${sig}`,
    publicKey: VAPID_PUBLIC_KEY,
  };
}

function derToRaw(derSig: Buffer): Buffer {
  // DER format: 0x30 [total-len] 0x02 [r-len] [r] 0x02 [s-len] [s]
  const rLen = derSig[3];
  const rStart = 4;
  const sLen = derSig[4 + rLen + 1];
  const sStart = 4 + rLen + 2;

  const r = derSig.subarray(rStart, rStart + rLen);
  const s = derSig.subarray(sStart, sStart + sLen);

  // Pad/trim to 32 bytes each
  const rPad = Buffer.alloc(32);
  const sPad = Buffer.alloc(32);
  r.copy(rPad, 32 - r.length);
  s.copy(sPad, 32 - s.length);

  return Buffer.concat([rPad, sPad]);
}

/**
 * Encrypt push message payload using aes128gcm content encoding (RFC 8291)
 */
async function encryptPayload(
  payload: Buffer,
  p256dhKey: string,
  authSecret: string,
  createECDH: typeof import("crypto").createECDH,
  randomBytes: typeof import("crypto").randomBytes,
  createCipheriv: typeof import("crypto").createCipheriv,
  createHmac: typeof import("crypto").createHmac
): Promise<Buffer> {
  // Decode subscriber keys
  const clientPublicKey = Buffer.from(p256dhKey, "base64url");
  const clientAuth = Buffer.from(authSecret, "base64url");

  // Generate ephemeral ECDH key pair
  const serverKey = createECDH("prime256v1");
  serverKey.generateKeys();
  const serverPublicKey = serverKey.getPublicKey();

  // Compute shared secret
  const sharedSecret = serverKey.computeSecret(clientPublicKey);

  // Generate salt
  const salt = randomBytes(16);

  // HKDF-based key derivation (RFC 8291)
  const ikm = hkdf(
    createHmac,
    clientAuth,
    sharedSecret,
    Buffer.concat([
      Buffer.from("WebPush: info\0"),
      clientPublicKey,
      serverPublicKey,
    ]),
    32
  );

  const contentEncryptionKey = hkdf(
    createHmac,
    salt,
    ikm,
    Buffer.from("Content-Encoding: aes128gcm\0"),
    16
  );

  const nonce = hkdf(
    createHmac,
    salt,
    ikm,
    Buffer.from("Content-Encoding: nonce\0"),
    12
  );

  // Add padding delimiter
  const paddedPayload = Buffer.concat([payload, Buffer.from([2])]);

  // Encrypt with AES-128-GCM
  const cipher = createCipheriv("aes-128-gcm", contentEncryptionKey, nonce);
  const encrypted = Buffer.concat([cipher.update(paddedPayload), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65)
  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(4096);

  const header = Buffer.concat([
    salt,
    recordSize,
    Buffer.from([serverPublicKey.length]),
    serverPublicKey,
  ]);

  return Buffer.concat([header, encrypted, tag]);
}

/**
 * HKDF extract + expand (simplified for our use case)
 */
function hkdf(
  createHmac: typeof import("crypto").createHmac,
  salt: Buffer,
  ikm: Buffer,
  info: Buffer,
  length: number
): Buffer {
  // Extract
  const prk = createHmac("sha256", salt).update(ikm).digest();
  // Expand
  const infoBuffer = Buffer.concat([info, Buffer.from([1])]);
  const okm = createHmac("sha256", prk).update(infoBuffer).digest();
  return okm.subarray(0, length);
}
