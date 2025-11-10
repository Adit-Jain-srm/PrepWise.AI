import { NextRequest, NextResponse } from "next/server";
import { saveInterviewAsset } from "@/lib/services/storageService";

const ALLOWED_TYPES = new Set(["resume", "essay", "video", "audio"]);

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const file = formData.get("file");
  const sessionId = formData.get("sessionId") as string | null;
  const questionId = formData.get("questionId") as string | null;
  const assetType = formData.get("assetType") as string | null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File upload is required." }, { status: 400 });
  }

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }

  if (!assetType || !ALLOWED_TYPES.has(assetType)) {
    return NextResponse.json({ error: "Invalid asset type." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveInterviewAsset({
      sessionId,
      questionId: questionId ?? undefined,
      assetType: assetType as "resume" | "essay" | "video" | "audio",
      buffer,
      mimeType: file.type,
    });

    return NextResponse.json({ assetUrl: url });
  } catch (error) {
    console.error("Failed to persist interview asset", error);
    return NextResponse.json(
      { error: "Unable to upload asset to storage." },
      { status: 500 },
    );
  }
}
