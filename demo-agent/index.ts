import express from "express";

const app = express();
app.use(express.json());

const RESPONSES: Record<string, string> = {
  solana:
    "Solana is a high-performance blockchain supporting 65,000+ TPS with ~400ms block times. It uses Proof of History (PoH) combined with Proof of Stake for consensus. Transaction fees are typically under $0.01.",
  nft: "Solana NFTs use the Metaplex standard. The modern approach is Metaplex Core, which uses a single-account model for simpler and cheaper NFTs. NFTs can include images, animations, and even interactive HTML content via the animation_url field.",
  staking:
    "Solana uses Delegated Proof of Stake (DPoS). You can stake SOL with validators to earn rewards (~6-8% APY). Liquid staking protocols like Marinade (mSOL) and Jito (jitoSOL) let you stake while keeping your SOL liquid for DeFi.",
  defi: "Solana DeFi includes: Jupiter (DEX aggregator), Raydium & Orca (AMMs), Marinade (liquid staking), Drift (perpetuals), Kamino (lending). The ecosystem processes billions in daily volume with sub-second finality.",
  wallet:
    "Popular Solana wallets include Phantom (most popular), Solflare, Backpack, and Ledger (hardware). Most support SPL tokens, NFTs, staking, and dApp connections via the Wallet Standard.",
  token:
    "Solana tokens use the SPL Token standard. Creating an SPL token costs ~0.002 SOL. Token-2022 (Token Extensions) adds features like transfer fees, confidential transfers, and permanent delegates.",
  metaplex:
    "Metaplex is the NFT standard on Solana. Metaplex Core is the latest version — it stores NFTs as single accounts (cheaper than the legacy Token Metadata approach). It supports plugins for royalties, freeze authority, and more.",
  transaction:
    "Solana transactions can contain multiple instructions. Each transaction has a 1232-byte limit. Priority fees help during congestion. Transactions are confirmed in ~400ms and finalized in ~12 seconds.",
  agent:
    "Agent NFT turns AI agents into Solana NFTs. Each NFT has an embedded chat interface (via animation_url) visible on Magic Eden. Authentication uses Sign-In With Solana (SIWS) and NFT ownership verification.",
  hello:
    "Hello! I'm SolBot, a Solana blockchain assistant. Ask me about Solana, NFTs, DeFi, staking, wallets, tokens, or transactions!",
  hi: "Hi there! I'm SolBot, ready to help you learn about Solana. What would you like to know?",
};

function getResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const [key, response] of Object.entries(RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  return `I'm SolBot, a Solana blockchain assistant! I can help you understand:\n\n• Solana basics and architecture\n• NFTs and Metaplex standards\n• DeFi protocols and trading\n• Staking and validators\n• Wallets and security\n• Tokens (SPL & Token-2022)\n• Transactions and fees\n\nWhat would you like to know about?`;
}

// OpenAI-compatible endpoint
app.post("/v1/chat/completions", (req, res) => {
  const { messages } = req.body;
  const lastUserMsg = messages
    ?.filter((m: { role: string }) => m.role === "user")
    .pop();
  const reply = getResponse(lastUserMsg?.content ?? "");
  res.json({
    id: "chatcmpl-" + Date.now(),
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "solbot-1.0",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: reply },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  });
});

// Simple webhook endpoint
app.post("/webhook", (req, res) => {
  const { message } = req.body;
  res.json({ reply: getResponse(message ?? "") });
});

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", agent: "SolBot" })
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`SolBot demo agent running on http://localhost:${PORT}`)
);
