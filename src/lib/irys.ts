import Uploader from "@irys/upload";
import Solana from "@irys/upload-solana";
import * as fs from "fs";
import * as path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let irysClient: any = null;

async function getIrys() {
  if (irysClient) return irysClient;

  const walletKeyBase58 = process.env.IRYS_WALLET_KEY;
  if (!walletKeyBase58) {
    throw new Error("IRYS_WALLET_KEY not set");
  }

  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL!;
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  const isDevnet = network === "devnet";

  console.log(`🌐 Initializing Irys on ${network}...`);

  // Irys expects the private key as a base58 string directly
  const uploader = Uploader(Solana)
    .withWallet(walletKeyBase58)
    .withRpc(rpcUrl);

  // Use devnet or mainnet based on environment
  irysClient = await (isDevnet ? uploader.devnet() : uploader.mainnet()).build();

  return irysClient;
}

export async function uploadBuffer(
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const irys = await getIrys();

  // Check balance and price before uploading
  const price = await irys.getPrice(buffer.length);
  let balance = await irys.getLoadedBalance();

  // Ensure both are BigInt for proper comparison
  const priceBigInt = BigInt(price);
  const balanceBigInt = BigInt(balance);

  console.log(`📊 Upload Stats:
  - File size: ${buffer.length} bytes
  - Upload cost: ${irys.utils.fromAtomic(price)} SOL
  - Current Irys balance: ${irys.utils.fromAtomic(balance)} SOL
  - Price (atomic): ${price.toString()}
  - Balance (atomic): ${balance.toString()}
  - Price BigInt: ${priceBigInt.toString()}
  - Balance BigInt: ${balanceBigInt.toString()}
  - Comparison (balance < price): ${balanceBigInt < priceBigInt}`);

  // Auto-fund if balance is insufficient (fund 3x the cost to avoid frequent funding)
  if (balanceBigInt < priceBigInt) {
    const fundAmount = priceBigInt * 3n;
    console.log(`💰 Irys balance insufficient. Funding ${irys.utils.fromAtomic(fundAmount)} SOL from wallet...`);

    try {
      const fundTx = await irys.fund(fundAmount);
      console.log(`✅ Funded Irys successfully! TX: ${fundTx.id}`);

      // Refresh balance after funding
      balance = await irys.getLoadedBalance();
      console.log(`📊 New Irys balance: ${irys.utils.fromAtomic(balance)} SOL`);
    } catch (fundError) {
      console.error("❌ Failed to fund Irys:", fundError);
      throw new Error(
        `Failed to fund Irys. Make sure wallet has enough SOL. ` +
        `Need: ${irys.utils.fromAtomic(fundAmount)} SOL. ` +
        `Error: ${fundError instanceof Error ? fundError.message : String(fundError)}`
      );
    }
  }

  console.log(`✅ Sufficient balance. Uploading...`);

  const receipt = await irys.upload(buffer, {
    tags: [{ name: "Content-Type", value: contentType }],
  });

  // Use correct gateway based on network
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  const isDevnet = network === "devnet";
  const gatewayUrl = isDevnet
    ? `https://devnet.irys.xyz/${receipt.id}`
    : `https://arweave.net/${receipt.id}`;

  console.log(`✅ Upload complete: ${gatewayUrl}`);
  return gatewayUrl;
}

export async function uploadChatHTML(
  assetId: string,
  apiBaseUrl: string,
  agentName: string
): Promise<string> {
  const templatePath = path.join(process.cwd(), "src", "iframe", "chat.html");
  let html = fs.readFileSync(templatePath, "utf-8");

  html = html.replace(/__API_BASE_URL__/g, apiBaseUrl);
  html = html.replace(/__ASSET_ID__/g, assetId);
  html = html.replace(/__AGENT_NAME__/g, agentName);

  return uploadBuffer(Buffer.from(html, "utf-8"), "text/html");
}

export async function uploadJSON(data: object): Promise<string> {
  const buffer = Buffer.from(JSON.stringify(data), "utf-8");
  return uploadBuffer(buffer, "application/json");
}

// Helper function to check wallet balance and estimate costs
export async function checkIrysStatus() {
  const irys = await getIrys();

  const balance = await irys.getLoadedBalance();
  const address = await irys.address;

  // Estimate costs for typical uploads
  const typicalImageSize = 500000; // 500KB
  const typicalHtmlSize = 50000; // 50KB
  const typicalJsonSize = 5000; // 5KB

  const imagePrice = await irys.getPrice(typicalImageSize);
  const htmlPrice = await irys.getPrice(typicalHtmlSize);
  const jsonPrice = await irys.getPrice(typicalJsonSize);

  // Ensure BigInt for calculations
  const totalEstimate = BigInt(imagePrice) + BigInt(htmlPrice) + BigInt(jsonPrice);
  const balanceBigInt = BigInt(balance);

  return {
    address,
    balance: irys.utils.fromAtomic(balance),
    balanceAtomic: balance.toString(),
    estimates: {
      image500kb: irys.utils.fromAtomic(imagePrice),
      html50kb: irys.utils.fromAtomic(htmlPrice),
      json5kb: irys.utils.fromAtomic(jsonPrice),
      totalPerMint: irys.utils.fromAtomic(totalEstimate),
    },
    canAfford: balanceBigInt >= totalEstimate,
    mintsAvailable:
      balanceBigInt >= totalEstimate ? Number(balanceBigInt / totalEstimate) : 0,
  };
}
