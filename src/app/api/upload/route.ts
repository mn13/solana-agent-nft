import { uploadBuffer, uploadChatHTML } from "@/lib/irys";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const agentName = formData.get("agentName") as string;
    const assetId = formData.get("assetId") as string;

    if (!image || !agentName || !assetId) {
      return Response.json(
        { error: "Missing image, agentName, or assetId" },
        { status: 400 }
      );
    }

    // Upload image to Arweave
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const imageUri = await uploadBuffer(imageBuffer, image.type);

    // Upload chat HTML to Arweave
    const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const animationUri = await uploadChatHTML(assetId, apiBaseUrl, agentName);

    return Response.json({ imageUri, animationUri });
  } catch (err) {
    console.error("Upload error:", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
