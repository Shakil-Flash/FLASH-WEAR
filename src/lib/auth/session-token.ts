/**
 * FLASHWEAR Cryptographic Admin Session Token
 *
 * Implements HMAC-SHA256 signed session tokens using the Web Crypto API
 * compatible with both Edge runtime (middleware) and Node.js server runtimes.
 */

function getSecretKey(): string {
  return (
    process.env.ADMIN_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "flashwear-production-signed-admin-secret-key-2026"
  );
}

// Convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

// Constant-time string equality check to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const secret = getSecretKey();
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);

  return globalThis.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Creates a signed admin session token: `${userId}:${role}:${expiresAt}:${hexSignature}`
 * Default TTL: 8 hours (28,800,000 ms)
 */
export async function createSignedAdminToken(payload: {
  userId: string;
  role?: string;
  maxAgeMs?: number;
}): Promise<string> {
  const role = payload.role || "admin";
  const maxAgeMs = payload.maxAgeMs || 8 * 60 * 60 * 1000; // 8 hours
  const expiresAt = Date.now() + maxAgeMs;

  const dataToSign = `${payload.userId}:${role}:${expiresAt}`;
  const encoder = new TextEncoder();
  const key = await getCryptoKey();

  const signatureBuffer = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(dataToSign)
  );

  const signatureHex = bufferToHex(signatureBuffer);
  return `${dataToSign}:${signatureHex}`;
}

/**
 * Verifies an admin session token's cryptographic signature and expiration
 */
export async function verifySignedAdminToken(
  token: string | null | undefined
): Promise<{ valid: boolean; userId?: string; role?: string; error?: string }> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Missing token" };
  }

  const parts = token.split(":");
  if (parts.length !== 4) {
    return { valid: false, error: "Malformed token format" };
  }

  const [userId, role, expiresAtStr, providedSignature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return { valid: false, error: "Token expired" };
  }

  if (role !== "admin") {
    return { valid: false, error: "Insufficient role in token" };
  }

  try {
    const dataToSign = `${userId}:${role}:${expiresAtStr}`;
    const encoder = new TextEncoder();
    const key = await getCryptoKey();

    const expectedSignatureBuffer = await globalThis.crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(dataToSign)
    );
    const expectedSignatureHex = bufferToHex(expectedSignatureBuffer);

    if (!timingSafeEqual(providedSignature, expectedSignatureHex)) {
      return { valid: false, error: "Invalid signature" };
    }

    return { valid: true, userId, role };
  } catch (err: any) {
    return { valid: false, error: err.message || "Verification failed" };
  }
}
