"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createUmiInstance, generateSigner } from "@/lib/metaplex";
import { create } from "@metaplex-foundation/mpl-core";
import bs58 from "bs58";

interface MintResult {
  assetId: string;
  signature: string;
}

export default function MintForm() {
  const wallet = useWallet();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [agentEndpoint, setAgentEndpoint] = useState("");
  const [agentType, setAgentType] = useState<"openai" | "webhook">("openai");
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MintResult | null>(null);

  async function handleMint() {
    if (!wallet.publicKey || !imageFile) return;
    setMinting(true);
    setError(null);

    try {
      const umi = createUmiInstance(wallet.wallet!.adapter);
      const asset = generateSigner(umi);
      const assetId = asset.publicKey.toString();

      // 1. Upload image + HTML to Arweave
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("agentName", name);
      formData.append("assetId", assetId);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        throw new Error("Failed to upload assets to Arweave");
      }
      const { imageUri, animationUri } = await uploadRes.json();

      // 2. Build + upload metadata JSON
      const metadata = {
        name,
        description,
        image: imageUri,
        animation_url: animationUri,
        external_url: `${window.location.origin}/agent/${assetId}`,
        attributes: [
          { trait_type: "agent_endpoint", value: agentEndpoint },
          { trait_type: "agent_type", value: agentType },
          { trait_type: "version", value: "1.0" },
        ],
        properties: {
          files: [
            { uri: imageUri, type: imageFile.type },
            { uri: animationUri, type: "text/html" },
          ],
          category: "html",
        },
      };
      const metaRes = await fetch("/api/upload-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });
      if (!metaRes.ok) {
        throw new Error("Failed to upload metadata");
      }
      const { uri: metadataUri } = await metaRes.json();

      // 3. Create NFT on-chain
      const tx = await create(umi, {
        asset,
        name,
        uri: metadataUri,
      }).sendAndConfirm(umi);

      setResult({
        assetId,
        signature: bs58.encode(Buffer.from(tx.signature)),
      });
    } catch (err) {
      // Handle user rejection gracefully
      if (
        err instanceof Error &&
        (err.message.includes("User rejected") ||
          err.message.includes("rejected the request") ||
          err.name === "WalletSignTransactionError")
      ) {
        setError("Transaction cancelled by user");
      } else if (err instanceof Error && err.message.includes("Upload error")) {
        setError(`Upload failed: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : "Minting failed");
      }
    } finally {
      setMinting(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-green-900/20 border border-green-700 rounded-xl">
          <h3 className="text-lg font-semibold text-green-400 mb-3">
            Agent NFT Minted!
          </h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-300">
              <span className="text-gray-500">Asset ID:</span>{" "}
              <code className="text-green-300">{result.assetId}</code>
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <a
                href={`https://explorer.solana.com/address/${result.assetId}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                View on Solana Explorer
              </a>
              <a
                href={`https://magiceden.io/item-details/${result.assetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                View on Magic Eden
              </a>
              <a
                href={`/agent/${result.assetId}`}
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Open Full Agent Chat
              </a>
            </div>
          </div>
        </div>
        <button
          onClick={() => setResult(null)}
          className="text-sm text-gray-400 hover:text-white"
        >
          Mint another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Agent Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="SolBot"
          className="w-full px-4 py-3 rounded-lg border border-[#333] bg-[#1a1a1a] text-white text-sm outline-none focus:border-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A Solana knowledge assistant that helps users understand blockchain concepts..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-[#333] bg-[#1a1a1a] text-white text-sm outline-none focus:border-purple-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Agent Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:text-sm file:font-medium hover:file:bg-purple-700"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Agent Endpoint URL
        </label>
        <input
          type="url"
          value={agentEndpoint}
          onChange={(e) => setAgentEndpoint(e.target.value)}
          placeholder="https://your-agent.com"
          className="w-full px-4 py-3 rounded-lg border border-[#333] bg-[#1a1a1a] text-white text-sm outline-none focus:border-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Endpoint Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="agentType"
              value="openai"
              checked={agentType === "openai"}
              onChange={() => setAgentType("openai")}
              className="accent-purple-600"
            />
            <span className="text-sm text-gray-300">OpenAI Compatible</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="agentType"
              value="webhook"
              checked={agentType === "webhook"}
              onChange={() => setAgentType("webhook")}
              className="accent-purple-600"
            />
            <span className="text-sm text-gray-300">Simple Webhook</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleMint}
        disabled={
          minting ||
          !name ||
          !description ||
          !imageFile ||
          !agentEndpoint ||
          !wallet.publicKey
        }
        className="w-full py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {minting ? (
          <>
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Minting...
          </>
        ) : (
          "Mint Agent NFT"
        )}
      </button>
    </div>
  );
}
