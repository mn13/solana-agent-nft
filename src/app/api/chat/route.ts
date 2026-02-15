import { verifyJWT } from "@/lib/auth";
import { getAsset, extractAgentEndpoint, extractAgentType } from "@/lib/helius";
import { forwardToAgent } from "@/lib/chat-proxy";
import type { ChatMessage } from "@/lib/chat-proxy";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assetId, messages } = body as {
      assetId: string;
      messages: ChatMessage[];
    };

    if (!assetId || !Array.isArray(messages)) {
      return Response.json(
        { error: "Missing assetId or messages" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Auth check: try Authorization header first, then body token
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || body.token;

    if (token) {
      const payload = await verifyJWT(token);
      if (!payload || payload.assetId !== assetId) {
        return Response.json(
          { error: "Unauthorized" },
          { status: 401, headers: CORS_HEADERS }
        );
      }
    }
    // If no token: demo mode — allow through

    // Get agent info from Helius
    const asset = await getAsset(assetId);
    let agentEndpoint = extractAgentEndpoint(asset);
    const agentType = extractAgentType(asset);

    // Fallback to demo agent if no endpoint configured (for testing)
    if (!agentEndpoint) {
      const demoEndpoint = process.env.DEMO_AGENT_ENDPOINT || "http://localhost:4000";
      console.log(`⚠️  No agent endpoint found, using demo agent: ${demoEndpoint}`);
      agentEndpoint = demoEndpoint;
    }

    // Forward to agent
    const reply = await forwardToAgent({ messages, agentEndpoint, agentType });
    return Response.json({ reply }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("Chat proxy error:", err);
    return Response.json(
      { error: "Agent not responding" },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}
