import { uploadJSON } from "@/lib/irys";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const uri = await uploadJSON(data);
    return Response.json({ uri });
  } catch (err) {
    console.error("JSON upload error:", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
