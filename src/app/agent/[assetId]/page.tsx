"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import WalletButton from "@/components/WalletButton";
import ChatWindow from "@/components/ChatWindow";
import Link from "next/link";

interface AgentInfo {
  name: string;
  description: string;
  image: string | null;
}

export default function AgentPage() {
  const params = useParams();
  const assetId = params.assetId as string;
  const wallet = useWallet();

  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [infoLoading, setInfoLoading] = useState(true);

  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch(`/api/agent-info?assetId=${assetId}`);
        if (res.ok) {
          setAgentInfo(await res.json());
        }
      } catch {
        // Agent info fetch failed — continue without it
      } finally {
        setInfoLoading(false);
      }
    }
    fetchInfo();
  }, [assetId]);

  const handleSignIn = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signMessage) return;
    setAuthLoading(true);
    setAuthError(null);

    try {
      // 1. Get nonce
      const nonceRes = await fetch("/api/auth/nonce");
      const { nonce } = await nonceRes.json();

      // 2. Create SIWS message and sign it
      const domain = window.location.host;
      const message = `${domain} wants you to sign in with your Solana account:\n${wallet.publicKey.toBase58()}\n\nSign in to chat with this agent\n\nNonce: ${nonce}`;
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await wallet.signMessage(encodedMessage);

      // 3. Verify with backend
      const input = {
        domain,
        address: wallet.publicKey.toBase58(),
        statement: "Sign in to chat with this agent",
        nonce,
      };
      const output = {
        account: {
          publicKey: wallet.publicKey.toBytes(),
          address: wallet.publicKey.toBase58(),
        },
        signature,
        signedMessage: encodedMessage,
      };

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, output, assetId }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || "Verification failed");
      }

      const { token: jwt } = await verifyRes.json();
      setToken(jwt);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setAuthLoading(false);
    }
  }, [wallet, assetId]);

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-[#2a2a2a] px-4 py-3 bg-[#141414] flex items-center gap-4">
        <Link href="/" className="text-lg font-bold hover:text-purple-400">
          Agent NFT
        </Link>

        <div className="flex-1 flex items-center gap-3">
          {agentInfo?.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={agentInfo.image}
              alt={agentInfo.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-sm font-semibold">
              {infoLoading
                ? "Loading..."
                : agentInfo?.name || `Agent ${assetId.slice(0, 8)}...`}
            </h1>
            {agentInfo?.description && (
              <p className="text-xs text-gray-500 truncate max-w-md">
                {agentInfo.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {token ? (
            <span className="text-xs text-green-400 px-2 py-1 bg-green-900/20 rounded">
              Authenticated
            </span>
          ) : wallet.publicKey ? (
            <button
              onClick={handleSignIn}
              disabled={authLoading}
              className="text-xs px-3 py-1.5 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {authLoading ? "Signing..." : "Sign In (SIWS)"}
            </button>
          ) : null}
          <WalletButton />
        </div>
      </header>

      {authError && (
        <div className="px-4 py-2 bg-red-900/20 text-red-300 text-sm text-center">
          {authError}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <ChatWindow assetId={assetId} token={token} />
      </div>
    </div>
  );
}
