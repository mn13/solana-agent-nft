import { HELIUS_RPC_URL } from "./constants";

export interface DASAsset {
  id: string;
  content: {
    json_uri: string;
    metadata: { name: string; description: string };
    links?: {
      image?: string;
      animation_url?: string;
      external_url?: string;
    };
  };
  ownership: { owner: string };
  attributes?: {
    attribute_list: Array<{ trait_type: string; value: string }>;
  };
}

export async function getAsset(assetId: string): Promise<DASAsset> {
  const rpcUrl = HELIUS_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL!;
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "agent-nft",
      method: "getAsset",
      params: { id: assetId },
    }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`Helius DAS error: ${data.error.message}`);
  }
  return data.result as DASAsset;
}

export async function verifyOwnership(
  ownerPublicKey: string,
  assetId: string
): Promise<boolean> {
  const asset = await getAsset(assetId);
  return asset.ownership.owner === ownerPublicKey;
}

export function extractAgentEndpoint(asset: DASAsset): string | null {
  const attr = asset.attributes?.attribute_list?.find(
    (a) => a.trait_type === "agent_endpoint"
  );
  return attr?.value ?? null;
}

export function extractAgentType(asset: DASAsset): "openai" | "webhook" {
  const attr = asset.attributes?.attribute_list?.find(
    (a) => a.trait_type === "agent_type"
  );
  return (attr?.value as "openai" | "webhook") ?? "openai";
}
