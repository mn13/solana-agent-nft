import { checkIrysStatus } from "@/lib/irys";

export async function GET() {
  try {
    const status = await checkIrysStatus();
    return Response.json(status);
  } catch (error) {
    console.error("Irys status check error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check Irys status",
      },
      { status: 500 }
    );
  }
}
