# Agent NFT — Interactive AI Agent NFTs on Solana

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black)](https://nextjs.org)
[![Solana](https://img.shields.io/badge/Solana-Devnet-green)](https://solana.com)

**Turn any AI agent into a tradeable Solana NFT with an embedded chat interface.**

Agent NFT creates Solana NFTs that represent AI agents — each NFT embeds an interactive chat iframe (via `animation_url`) visible on Magic Eden, with Solana wallet authentication and NFT ownership gating. Open-source and pluggable to any agent with an HTTP endpoint.

---

## Why This Matters

AI agents are proliferating, but there's no standard way to **discover, own, trade, or interact** with them on-chain. Agent NFT solves this by turning any AI agent into a Solana NFT that:

- ✅ **Is discoverable** — agents appear on Magic Eden alongside art, gaming, and DeFi NFTs
- ✅ **Is interactive** — you can chat with the agent directly from its NFT page, no separate app needed
- ✅ **Is ownable & tradeable** — NFT ownership = authenticated access to the agent. Transfer the NFT = transfer access
- ✅ **Is composable** — any developer can mint an Agent NFT for their agent in minutes. The protocol is pluggable and open
- ✅ **Uses Solana natively** — wallet auth (SIWS), on-chain identity (Metaplex Core), permanent storage (Arweave), ownership verification (Helius DAS)

This creates a new primitive: **agents as first-class on-chain assets**.

---

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Magic Eden       │     │  Next.js App      │     │  Agent Endpoint   │
│  (NFT detail)     │     │  (Vercel)         │     │  (any provider)   │
│                   │     │                   │     │                   │
│  ┌─────────────┐  │     │  /api/chat ───────┼────►│  /v1/chat/compl.  │
│  │ iframe      │──┼────►│  /api/auth/nonce  │     │  or POST webhook  │
│  │ (Arweave)   │  │     │  /api/auth/verify │     └──────────────────┘
│  │ chat UI     │  │     │  /api/upload      │
│  └─────────────┘  │     │                   │
└──────────────────┘     │  /mint (page)     │
                          │  /agent/[id] (page)│
                          └──────────────────┘
```

**Key design**: The iframe on Magic Eden is sandboxed (no wallet access). So:
- **Iframe** = demo/unauthenticated chat mode, with "Open Full Chat" button
- **Full page** (`/agent/[assetId]`) = authenticated via SIWS + NFT ownership verification

---

## Tech Stack

- **Next.js 15 + TypeScript** (full-stack, deploy on Vercel)
- **Metaplex Core** (`mpl-core`) for NFT minting (modern single-account model)
- **Irys** (via `@irys/upload-solana`) for Arweave uploads (image, HTML, metadata)
- **Helius DAS API** for NFT ownership verification
- **SIWS** (`@solana/wallet-standard-util`) for wallet authentication
- **jose** for JWT session tokens
- **Tailwind CSS** for styling

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/mn13/solana-agent-nft.git
cd agent-nft
npm install
cd demo-agent && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

```env
NEXT_PUBLIC_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
HELIUS_API_KEY=YOUR_HELIUS_API_KEY
JWT_SECRET=generate_with_openssl_rand_hex_32
IRYS_WALLET_KEY=base58_solana_keypair_for_uploads
```

**Get your Helius API key** (free): https://helius.dev
**Generate JWT secret**: `openssl rand -hex 32`
**Create Irys wallet key**: See [TESTING.md](./TESTING.md) for full instructions

### 3. Run the App

**Terminal 1 — Next.js App:**
```bash
npm run dev
```
App runs at **http://localhost:3000**

**Terminal 2 — Demo Agent:**
```bash
cd demo-agent
npm start
```
Demo agent runs at **http://localhost:4000**

### 4. Mint Your First Agent NFT

1. Open **http://localhost:3000**
2. Click "Mint Your Agent"
3. Connect your Solana wallet (Phantom on **Devnet**)
4. Fill in:
   - **Agent Name**: `My First Agent`
   - **Description**: `A helpful assistant`
   - **Agent Image**: upload any image
   - **Agent Endpoint URL**: `http://localhost:4000`
   - **Endpoint Type**: OpenAI Compatible
5. Click "Mint Agent NFT" and approve the transaction
6. View your NFT on Solana Explorer

For detailed testing instructions, see [TESTING.md](./TESTING.md).

---

## Plugging In Your Own Agent

Agent NFT is designed to work with **any agent that exposes an HTTP endpoint**. You have two options:

### Option 1: OpenAI-Compatible API

Your agent should implement:

```
POST /v1/chat/completions
Content-Type: application/json

{
  "model": "default",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ]
}
```

**Response:**
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you?"
    }
  }]
}
```

### Option 2: Simple Webhook

Your agent should implement:

```
POST /
Content-Type: application/json

{
  "message": "Hello!",
  "history": [...]
}
```

**Response:**
```json
{
  "reply": "Hello! How can I help you?"
}
```

### Minting Your Agent

1. Deploy your agent to a public URL (Railway, Render, Fly.io, etc.)
2. Go to **http://localhost:3000/mint** (or your deployed app)
3. Enter your agent's endpoint URL
4. Select the endpoint type (OpenAI Compatible or Simple Webhook)
5. Mint

**No CORS needed** — the Next.js proxy handles all communication server-side.

---

## Demo Agent

A lightweight Solana knowledge assistant is included in `demo-agent/`. It showcases both endpoint types and requires no LLM or API keys.

**Run it:**
```bash
cd demo-agent
npm start
```

**Test it:**
```bash
curl http://localhost:4000/health
# {"status":"ok","agent":"SolBot"}

curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is Solana?"}]}'
```

See [demo-agent/README.md](./demo-agent/README.md) for details.

---

## How Solana Is Used

| Solana Feature | How It's Used |
|----------------|---------------|
| **Metaplex Core NFTs** | Each agent is minted as a Core Asset on-chain — name, metadata URI, creator, ownership all on Solana |
| **Arweave (via Irys)** | Agent image, interactive chat HTML, and metadata JSON permanently stored on Arweave, paid with SOL |
| **Sign-In With Solana (SIWS)** | Users authenticate by signing a message with their Solana wallet — no passwords, no email |
| **NFT Ownership Gating** | Authenticated chat access requires proving you own the Agent NFT (verified via Helius DAS API on-chain query) |
| **Wallet Adapter** | Full Solana wallet integration (Phantom, Solflare, etc.) for minting and authentication |
| **On-chain Identity** | The NFT's public key IS the agent's on-chain identity — deterministic, verifiable, transferable |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout + WalletProvider
│   ├── page.tsx                   # Landing page
│   ├── mint/page.tsx              # Minting UI
│   ├── agent/[assetId]/page.tsx   # Full-page authenticated chat
│   └── api/
│       ├── auth/nonce/route.ts    # Generate nonce for SIWS
│       ├── auth/verify/route.ts   # SIWS verify + NFT check → JWT
│       ├── chat/route.ts          # Auth check + proxy to agent
│       ├── upload/route.ts        # Upload image+HTML to Arweave
│       ├── upload-json/route.ts   # Upload JSON metadata to Arweave
│       └── agent-info/route.ts    # Fetch agent metadata
├── components/
│   ├── WalletProvider.tsx         # Solana wallet context
│   ├── MintForm.tsx               # NFT minting form
│   └── ChatWindow.tsx             # Chat UI component
├── lib/
│   ├── metaplex.ts                # UMI setup, mintAgentNFT()
│   ├── irys.ts                    # Arweave uploads via Irys
│   ├── auth.ts                    # SIWS, JWT, nonce management
│   ├── helius.ts                  # DAS API, ownership verification
│   ├── chat-proxy.ts              # Forward messages to agent endpoints
│   └── constants.ts               # Environment variables
└── iframe/
    └── chat.html                  # Self-contained chat UI (uploaded to Arweave)

demo-agent/
├── index.ts                       # Express server with OpenAI + webhook endpoints
└── README.md                      # Demo agent documentation
```

---

## NFT Metadata Structure

Each Agent NFT follows the Metaplex standard with custom attributes:

```json
{
  "name": "My AI Agent",
  "description": "...",
  "image": "https://arweave.net/{imageId}",
  "animation_url": "https://arweave.net/{htmlId}",
  "external_url": "https://agent-nft.vercel.app/agent/{assetId}",
  "attributes": [
    { "trait_type": "agent_endpoint", "value": "https://my-agent.com/v1/chat/completions" },
    { "trait_type": "agent_type", "value": "openai" },
    { "trait_type": "version", "value": "1.0" }
  ],
  "properties": {
    "files": [
      { "uri": "ar://...", "type": "image/png" },
      { "uri": "ar://...", "type": "text/html" }
    ],
    "category": "html"
  }
}
```

The `animation_url` points to the interactive chat HTML stored on Arweave. This is what Magic Eden renders in an iframe.

---

## Built by AI

This project was designed, architected, and implemented by an AI agent (Claude) with human oversight for direction and approval. The AI agent:

- Researched the hackathon requirements, Metaplex standards, Magic Eden iframe support, and SIWS auth patterns
- Designed the full architecture including the iframe ↔ proxy ↔ agent communication pattern
- Made key technical decisions (Metaplex Core over legacy Token Metadata, demo mode for sandboxed iframes, etc.)
- Wrote all implementation code (100% of the codebase)
- The human's role was limited to: providing the initial idea, answering design questions, and approving the plan

**Verification**: See the commit history and conversation logs for full transparency.

---

## Security

- **Agent endpoint validation**: URLs are validated at mint time (must be HTTPS in production)
- **Input sanitization**: All user chat messages are sanitized before forwarding
- **Rate limiting**: Demo mode (unauthenticated iframe) is intended to be rate-limited by IP
- **JWT security**: Short-lived tokens (24h), signed with HS256, includes publicKey + assetId
- **Nonce replay protection**: Each SIWS nonce is single-use, expires in 5 minutes
- **CORS**: API routes allow cross-origin requests for iframe compatibility
- **No private keys client-side**: Server-side Irys uploads use a dedicated keypair

---

## Testing

See [TESTING.md](./TESTING.md) for a comprehensive step-by-step testing guide covering:

- Prerequisites (Solana CLI, Phantom, Helius API)
- Environment configuration
- Local testing on devnet
- All test scenarios (minting, chat, auth, ownership verification)
- Troubleshooting common issues

---

## Deployment

### Next.js App (Vercel)

```bash
# Push to GitHub
git push origin main

# Deploy on Vercel
vercel deploy --prod

# Update .env.local variables in Vercel dashboard
# Set NEXT_PUBLIC_APP_URL to your Vercel URL
```

### Demo Agent (Railway/Render/Fly.io)

Deploy the `demo-agent` folder to any Node.js hosting platform. Set `PORT` env var if required.

**Railway:**
```bash
cd demo-agent
railway up
```

**Render:**
1. Connect GitHub repo
2. Build command: `npm install`
3. Start command: `npm start`

---

## License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## Submission

**Superteam Open Innovation Track - Agents**
Deadline: Feb 15, 2026
Submission link: https://superteam.fun/earn/listing/open-innovation-track-agents/

**Deliverables:**
- ✅ GitHub repo (public, MIT license)
- ✅ README with architecture, setup, and usage
- ✅ Hosted app (Vercel)
- ✅ Demo Agent NFT (minted on devnet, viewable on Magic Eden)
- ✅ "Built by AI" documentation

---

## Links

- **GitHub**: https://github.com/mn13/solana-agent-nft
- **Specification**: [SPEC.md](./SPEC.md)
- **Testing Guide**: [TESTING.md](./TESTING.md)
- **Implementation Plan**: [IMPLEMENTATION.md](./IMPLEMENTATION.md)

---

## Contributing

Contributions are welcome! Please open an issue or PR.

## Support

For issues and questions, please use GitHub Issues: https://github.com/mn13/solana-agent-nft/issues

---

Made with 💜 on Solana
