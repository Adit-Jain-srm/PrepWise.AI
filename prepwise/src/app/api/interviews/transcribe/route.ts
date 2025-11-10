import { NextRequest, NextResponse } from "next/server";
import { transcribeAndScoreAudio } from "@/lib/services/speechTranscriber";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof File)) {
      // Return empty transcript instead of error to allow evaluation to continue
      console.warn("No audio file provided in transcription request");
      return NextResponse.json({
        transcript: "[No audio file provided]",
        fillerWordCount: 0,
        speakingRateWpm: 0,
        confidence: undefined,
      });
    }

    // Check if file is empty
    if (audioFile.size === 0) {
      console.warn("Empty audio file provided");
      return NextResponse.json({
        transcript: "[Empty audio file]",
        fillerWordCount: 0,
        speakingRateWpm: 0,
        confidence: undefined,
      });
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Check if buffer is empty
    if (!buffer || buffer.length === 0) {
      console.warn("Empty audio buffer after conversion");
      return NextResponse.json({
        transcript: "[Empty audio buffer]",
        fillerWordCount: 0,
        speakingRateWpm: 0,
        confidence: undefined,
      });
    }

    const analytics = await transcribeAndScoreAudio(buffer);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Speech transcription failed", error);
    // Return empty transcript instead of error to allow evaluation to continue
    // The evaluation engine can still provide feedback based on other signals
    return NextResponse.json({
      transcript: `[Transcription error: ${error instanceof Error ? error.message : "Unknown error"}]`,
      fillerWordCount: 0,
      speakingRateWpm: 0,
      confidence: undefined,
    });
  }
}
