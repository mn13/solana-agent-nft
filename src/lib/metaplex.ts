import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore, create } from "@metaplex-foundation/mpl-core";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { generateSigner } from "@metaplex-foundation/umi";
import type { Umi } from "@metaplex-foundation/umi";
import type { WalletAdapter } from "@solana/wallet-adapter-base";
import bs58 from "bs58";

export function createUmiInstance(wallet: WalletAdapter): Umi {
  return createUmi(process.env.NEXT_PUBLIC_RPC_URL!)
    .use(mplCore())
    .use(walletAdapterIdentity(wallet));
}

export { generateSigner };

export interface MintParams {
  name: string;
  description: string;
  imageUri: string;
  animationUri: string;
  agentEndpoint: string;
  agentType: "openai" | "webhook";
}

export async function mintAgentNFT(
  umi: Umi,
  params: MintParams
): Promise<{ assetId: string; signature: string }> {
  const asset = generateSigner(umi);
  const assetId = asset.publicKey.toString();

  const metadata = {
    name: params.name,
    description: params.description,
    image: params.imageUri,
    animation_url: params.animationUri,
    external_url: `${process.env.NEXT_PUBLIC_APP_URL}/agent/${assetId}`,
    attributes: [
      { trait_type: "agent_endpoint", value: params.agentEndpoint },
      { trait_type: "agent_type", value: params.agentType },
      { trait_type: "version", value: "1.0" },
    ],
    properties: {
      files: [
        { uri: params.imageUri, type: "image/png" },
        { uri: params.animationUri, type: "text/html" },
      ],
      category: "html",
    },
  };

  const metadataRes = await fetch("/api/upload-json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  });
  const { uri: metadataUri } = await metadataRes.json();

  const tx = await create(umi, {
    asset,
    name: params.name,
    uri: metadataUri,
  }).sendAndConfirm(umi);

  return {
    assetId,
    signature: bs58.encode(Buffer.from(tx.signature)),
  };
}
