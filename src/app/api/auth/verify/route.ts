import { consumeNonce, verifySIWSSignature, issueJWT } from "@/lib/auth";
import { verifyOwnership } from "@/lib/helius";
import type {
  SolanaSignInInput,
  SolanaSignInOutput,
} from "@solana/wallet-standard-features";
import bs58 from "bs58";

export async function POST(req: Request) {
  try {
    const { input, output, assetId } = (await req.json()) as {
      input: SolanaSignInInput;
      output: SolanaSignInOutput;
      assetId: string;
    };

    if (!input || !output || !assetId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify nonce
    if (!input.nonce || !consumeNonce(input.nonce)) {
      return Response.json(
        { error: "Invalid or expired nonce" },
        { status: 400 }
      );
    }

    // Verify SIWS signature
    if (!verifySIWSSignature(input, output)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Extract public key - handle Buffer JSON format {type: 'Buffer', data: [...]}
    let publicKey: string;
    if (typeof output.account.publicKey === "string") {
      publicKey = output.account.publicKey;
    } else if (
      typeof output.account.publicKey === "object" &&
      output.account.publicKey !== null &&
      "type" in output.account.publicKey &&
      output.account.publicKey.type === "Buffer" &&
      "data" in output.account.publicKey &&
      Array.isArray(output.account.publicKey.data)
    ) {
      // Buffer JSON format
      publicKey = bs58.encode(Buffer.from(output.account.publicKey.data));
    } else if (Array.isArray(output.account.publicKey)) {
      // Plain array
      publicKey = bs58.encode(Buffer.from(output.account.publicKey));
    } else {
      // Object format {0: 1, 1: 2, ...}
      publicKey = bs58.encode(
        Buffer.from(Object.values(output.account.publicKey as any))
      );
    }

    // Verify NFT ownership
    const owns = await verifyOwnership(publicKey, assetId);
    if (!owns) {
      return Response.json(
        { error: "You do not own this Agent NFT" },
        { status: 403 }
      );
    }

    // Issue JWT
    const token = await issueJWT({ publicKey, assetId });
    return Response.json({ token });
  } catch (err) {
    console.error("Auth verify error:", err);
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }
}
