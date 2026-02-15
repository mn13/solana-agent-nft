import { getAsset } from "@/lib/helius";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get("assetId");

    if (!assetId) {
      return Response.json({ error: "Missing assetId" }, { status: 400 });
    }

    const asset = await getAsset(assetId);
    return Response.json({
      name: asset.content.metadata.name,
      description: asset.content.metadata.description,
      image: asset.content.links?.image ?? null,
    });
  } catch (err) {
    console.error("Agent info error:", err);
    return Response.json(
      { error: "Failed to fetch agent info" },
      { status: 500 }
    );
  }
}
