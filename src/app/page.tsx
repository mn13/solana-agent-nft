import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#2a2a2a] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Agent NFT</h1>
          <Link
            href="/mint"
            className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
          >
            Mint Agent
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-6">
          <h2 className="text-5xl font-bold tracking-tight">
            Turn any AI agent into a{" "}
            <span className="text-purple-400">Solana NFT</span>
          </h2>
          <p className="text-lg text-gray-400">
            Mint interactive Agent NFTs with built-in chat interfaces.
            Discoverable on Magic Eden, authenticated via Solana wallet,
            pluggable to any agent endpoint.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Link
              href="/mint"
              className="px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700"
            >
              Mint Your Agent
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg border border-[#333] text-gray-300 font-medium hover:border-purple-500 hover:text-white"
            >
              View Source
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl w-full">
          <div className="p-6 rounded-xl border border-[#2a2a2a] bg-[#111]">
            <h3 className="font-semibold text-lg mb-2">Discoverable</h3>
            <p className="text-sm text-gray-400">
              Your agent appears on Magic Eden alongside art, gaming, and DeFi
              NFTs. Anyone can find and try it.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-[#2a2a2a] bg-[#111]">
            <h3 className="font-semibold text-lg mb-2">Interactive</h3>
            <p className="text-sm text-gray-400">
              Chat with the agent directly from its NFT page — no separate app
              needed. Built-in iframe with full-page mode.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-[#2a2a2a] bg-[#111]">
            <h3 className="font-semibold text-lg mb-2">Tradeable</h3>
            <p className="text-sm text-gray-400">
              NFT ownership = authenticated access. Transfer the NFT to transfer
              agent access. Composable on-chain primitive.
            </p>
          </div>
        </div>

        <div className="mt-20 max-w-3xl w-full">
          <h3 className="text-2xl font-bold text-center mb-8">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto mb-3 font-bold">
                1
              </div>
              <h4 className="font-medium mb-1">Connect Wallet</h4>
              <p className="text-sm text-gray-400">
                Connect your Solana wallet (Phantom, Solflare, etc.)
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto mb-3 font-bold">
                2
              </div>
              <h4 className="font-medium mb-1">Fill Agent Details</h4>
              <p className="text-sm text-gray-400">
                Name, image, description, and your agent&apos;s API endpoint
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto mb-3 font-bold">
                3
              </div>
              <h4 className="font-medium mb-1">Mint NFT</h4>
              <p className="text-sm text-gray-400">
                Sign one transaction. Your agent is now a tradeable NFT on
                Solana.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#2a2a2a] px-6 py-6 mt-20">
        <div className="max-w-5xl mx-auto text-center text-sm text-gray-500">
          Agent NFT — Open source, built with Metaplex Core on Solana
        </div>
      </footer>
    </div>
  );
}
