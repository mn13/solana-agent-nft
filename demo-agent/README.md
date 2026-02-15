# SolBot - Demo Agent for Agent NFT

A lightweight demo AI agent that showcases the Agent NFT platform. SolBot is a Solana knowledge assistant that can answer questions about Solana, NFTs, DeFi, staking, and more.

## Features

- **OpenAI-compatible API**: Implements the `/v1/chat/completions` endpoint
- **Simple webhook mode**: Also supports a basic webhook endpoint
- **Pattern matching**: Uses keyword-based responses (no LLM required)
- **Instant responses**: Fast, deterministic answers about Solana topics
- **Zero dependencies**: No API keys or external services needed

## Quick Start

```bash
# Install dependencies
npm install

# Start the agent
npm start
```

The agent will run on **http://localhost:4000** by default.

## Verify It's Running

```bash
curl http://localhost:4000/health
# Expected: {"status":"ok","agent":"SolBot"}
```

## API Endpoints

### OpenAI-Compatible Chat

```bash
POST /v1/chat/completions
Content-Type: application/json

{
  "model": "default",
  "messages": [
    { "role": "user", "content": "What is Solana?" }
  ]
}
```

**Response:**
```json
{
  "id": "chatcmpl-1234567890",
  "object": "chat.completion",
  "model": "solbot-1.0",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Solana is a high-performance blockchain..."
    },
    "finish_reason": "stop"
  }]
}
```

### Simple Webhook

```bash
POST /webhook
Content-Type: application/json

{
  "message": "What is Solana?",
  "history": []
}
```

**Response:**
```json
{
  "reply": "Solana is a high-performance blockchain..."
}
```

### Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "agent": "SolBot"
}
```

## Topics SolBot Can Discuss

SolBot can answer questions about:

- **Solana** - Architecture, consensus, performance
- **NFTs** - Metaplex standards, Core assets
- **DeFi** - DEXes, AMMs, lending protocols
- **Staking** - Validators, liquid staking, rewards
- **Wallets** - Popular wallets, security
- **Tokens** - SPL tokens, Token-2022 extensions
- **Transactions** - Transaction structure, fees
- **Metaplex** - NFT standards, plugins
- **Agent NFT** - This project itself

## How It Works

SolBot uses keyword pattern matching to identify topics in user messages and returns pre-written responses. For example:

- Message contains "solana" → Returns info about Solana blockchain
- Message contains "nft" → Returns info about Solana NFTs
- Message contains "staking" → Returns info about Solana staking

If no keywords match, it returns a help message listing available topics.

## Using with Agent NFT

When minting an Agent NFT:

1. **Agent Endpoint URL**: `http://localhost:4000` (for local testing)
2. **Endpoint Type**: Choose either:
   - **OpenAI Compatible** (uses `/v1/chat/completions`)
   - **Simple Webhook** (uses `/webhook`)

For production, deploy SolBot to a public server and use the deployed URL.

## Deployment

SolBot can be deployed to any Node.js hosting platform:

### Railway
```bash
railway up
```

### Render
1. Connect your GitHub repo
2. Set build command: `npm install`
3. Set start command: `npm start`

### Fly.io
```bash
fly deploy
```

Make sure to set the `PORT` environment variable if your platform requires it (SolBot defaults to 4000).

## Extending SolBot

To add new topics:

1. Add new keywords and responses to the `RESPONSES` object in `index.ts`
2. Restart the server

Example:
```typescript
const RESPONSES: Record<string, string> = {
  // ... existing responses
  "bridge": "Solana bridges include Wormhole, Allbridge, and Portal...",
};
```

## License

MIT
