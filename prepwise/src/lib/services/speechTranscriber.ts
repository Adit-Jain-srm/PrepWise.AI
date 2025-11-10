import sdk from "microsoft-cognitiveservices-speech-sdk";
import { SpeechAnalyticsSnapshot } from "../types/interview";
import { transcribeFromStream } from "../azure/speech";

const fillerWordPattern = /\b(um|uh|erm|hmm|like|you know|sort of|kind of)\b/gi;

function calculateSpeakingRate(transcript: string, durationMs: number | null): number {
  if (!durationMs || durationMs <= 0) {
    return 0;
  }

  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  const minutes = durationMs / 1000 / 60;
  return Number((words / minutes).toFixed(1));
}

function countFillerWords(transcript: string): number {
  if (!transcript) {
    return 0;
  }

  const matches = transcript.match(fillerWordPattern);
  return matches ? matches.length : 0;
}

export async function transcribeAndScoreAudio(buffer: Buffer): Promise<SpeechAnalyticsSnapshot> {
  const pushStream = sdk.AudioInputStream.createPushStream();
  pushStream.write(buffer);
  pushStream.close();

  const result = await transcribeFromStream(pushStream);

  return {
    transcript: result.transcript ?? "",
    fillerWordCount: countFillerWords(result.transcript ?? ""),
    speakingRateWpm: calculateSpeakingRate(result.transcript ?? "", result.durationMs),
    confidence: result.confidence ?? undefined,
  };
}
