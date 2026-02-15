"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import WalletButton from "@/components/WalletButton";
import MintForm from "@/components/MintForm";
import Link from "next/link";

export default function MintPage() {
  const { publicKey } = useWallet();

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2a2a2a] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold hover:text-purple-400">
            Agent NFT
          </Link>
          <WalletButton />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-2">Mint Agent NFT</h2>
        <p className="text-gray-400 mb-8">
          Create an on-chain NFT for your AI agent. It will get an interactive
          chat interface visible on Magic Eden and a full-page agent view.
        </p>

        {publicKey ? (
          <MintForm />
        ) : (
          <div className="text-center py-16 space-y-4">
            <p className="text-gray-400">
              Connect your wallet to start minting
            </p>
            <WalletButton />
          </div>
        )}
      </main>
    </div>
  );
}
