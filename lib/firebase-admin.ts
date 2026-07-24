import * as jose from "jose";

const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "curlysports-mazin";

let cachedKeys: { keys: CryptoKey[]; expiresAt: number } | null = null;

async function getGooglePublicKeys(): Promise<CryptoKey[]> {
  if (cachedKeys && Date.now() < cachedKeys.expiresAt) {
    return cachedKeys.keys;
  }

  const res = await fetch(GOOGLE_CERTS_URL);
  const certs: Record<string, string> = await res.json();

  // Parse cache-control max-age for key rotation
  const cacheControl = res.headers.get("cache-control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : 3600_000;

  const keys = await Promise.all(
    Object.values(certs).map((pem) => jose.importX509(pem, "RS256"))
  );

  cachedKeys = { keys, expiresAt: Date.now() + maxAge };
  return keys;
}

export interface FirebaseTokenPayload {
  uid: string;
  phone_number?: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Verify a Firebase ID token using Google's public certificates.
 * No service account key required.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseTokenPayload> {
  const keys = await getGooglePublicKeys();

  // Try each public key (Firebase rotates keys)
  let lastError: Error | null = null;
  for (const key of keys) {
    try {
      const { payload } = await jose.jwtVerify(idToken, key, {
        issuer: `https://securetoken.google.com/${PROJECT_ID}`,
        audience: PROJECT_ID,
      });

      return {
        uid: payload.sub as string,
        phone_number: payload.phone_number as string | undefined,
        email: payload.email as string | undefined,
        ...payload,
      };
    } catch (e) {
      lastError = e as Error;
      continue;
    }
  }

  throw lastError || new Error("Failed to verify Firebase ID token");
}
