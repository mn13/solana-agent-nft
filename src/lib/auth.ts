import { randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { verifySignIn } from "@solana/wallet-standard-util";
import type {
  SolanaSignInInput,
  SolanaSignInOutput,
} from "@solana/wallet-standard-features";
import { NONCE_TTL_MS, JWT_SECRET, JWT_EXPIRY } from "./constants";

const nonceStore = new Map<string, number>();

function cleanExpiredNonces() {
  const now = Date.now();
  for (const [nonce, createdAt] of nonceStore) {
    if (now - createdAt > NONCE_TTL_MS) {
      nonceStore.delete(nonce);
    }
  }
}

export function generateNonce(): string {
  cleanExpiredNonces();
  const nonce = randomBytes(16).toString("hex");
  nonceStore.set(nonce, Date.now());
  return nonce;
}

export function consumeNonce(nonce: string): boolean {
  const createdAt = nonceStore.get(nonce);
  if (createdAt === undefined) return false;
  if (Date.now() - createdAt > NONCE_TTL_MS) {
    nonceStore.delete(nonce);
    return false;
  }
  nonceStore.delete(nonce);
  return true;
}

// Helper to convert various formats to Uint8Array
function toUint8Array(data: any): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (Array.isArray(data)) {
    return new Uint8Array(data);
  }
  if (typeof data === 'object' && data !== null) {
    // Handle Buffer JSON format: {type: 'Buffer', data: [...]}
    if (data.type === 'Buffer' && Array.isArray(data.data)) {
      return new Uint8Array(data.data);
    }
    // Handle plain object format: {0: 1, 1: 2, ...}
    return new Uint8Array(Object.values(data));
  }
  throw new Error(`Cannot convert ${typeof data} to Uint8Array`);
}

export function verifySIWSSignature(
  input: SolanaSignInInput,
  output: SolanaSignInOutput
): boolean {
  // JSON serialization converts Uint8Array to plain objects/arrays
  // We need to convert them back to Uint8Array for verification
  const normalizedOutput: SolanaSignInOutput = {
    account: {
      ...output.account,
      publicKey: toUint8Array(output.account.publicKey),
    },
    signature: toUint8Array(output.signature),
    signedMessage: toUint8Array(output.signedMessage),
  };

  return verifySignIn(input, normalizedOutput);
}

const secret = new TextEncoder().encode(JWT_SECRET);

export async function issueJWT(payload: {
  publicKey: string;
  assetId: string;
}): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRY)
    .setIssuedAt()
    .sign(secret);
}

export async function verifyJWT(
  token: string
): Promise<{ publicKey: string; assetId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      publicKey: payload.publicKey as string,
      assetId: payload.assetId as string,
    };
  } catch {
    return null;
  }
}
