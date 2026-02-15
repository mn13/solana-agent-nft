import { generateNonce } from "@/lib/auth";

export async function GET() {
  const nonce = generateNonce();
  return Response.json({ nonce });
}
