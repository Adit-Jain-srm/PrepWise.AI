import { NextRequest, NextResponse } from "next/server";
import { transcribeAndScoreAudio } from "@/lib/services/speechTranscriber";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const audioFile = formData.get("audio");

  if (!audioFile || !(audioFile instanceof File)) {
    return NextResponse.json({ error: "Audio blob is required." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const analytics = await transcribeAndScoreAudio(buffer);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Speech transcription failed", error);
    return NextResponse.json(
      { error: "Unable to transcribe audio. Please try again." },
      { status: 500 },
    );
  }
}
