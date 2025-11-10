import { SpeechAnalyticsSnapshot } from "../types/interview";
import { transcribeFromStream } from "../azure/speech";
import { getEnvVar } from "../env";

// Import Azure Speech SDK using require for better compatibility with Next.js server environment
// This avoids webpack bundling issues with CommonJS modules
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const sdk = require("microsoft-cognitiveservices-speech-sdk");

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
  // Check if Azure Speech is configured
  const speechKey = getEnvVar("AZURE_SPEECH_KEY");
  const speechRegion = getEnvVar("AZURE_SPEECH_REGION");

  if (!speechKey || !speechRegion) {
    console.warn("Azure Speech SDK not configured. Skipping transcription.");
    return {
      transcript: "[Audio transcription not available - Azure Speech not configured]",
      fillerWordCount: 0,
      speakingRateWpm: 0,
      confidence: undefined,
    };
  }

  // Handle empty or invalid buffer
  if (!buffer || buffer.length === 0) {
    console.warn("Empty audio buffer provided. Returning empty transcript.");
    return {
      transcript: "[No audio data provided]",
      fillerWordCount: 0,
      speakingRateWpm: 0,
      confidence: undefined,
    };
  }

  try {
    // Check if AudioInputStream is available in the SDK
    if (!sdk.AudioInputStream) {
      console.error("AudioInputStream not available in Azure Speech SDK. SDK structure:", Object.keys(sdk).slice(0, 30));
      throw new Error("Azure Speech SDK AudioInputStream is not available. The SDK may not be properly imported.");
    }

      // Use PushAudioInputStream.create() which is the correct API
      // AudioInputStream.createPushStream() is a static method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let pushStream: any;
      
      try {
        // Try the createPushStream static method first
        if (typeof sdk.AudioInputStream?.createPushStream === "function") {
          pushStream = sdk.AudioInputStream.createPushStream();
        } else if (typeof sdk.PushAudioInputStream?.create === "function") {
          // Fallback to PushAudioInputStream.create()
          pushStream = sdk.PushAudioInputStream.create();
        } else {
          throw new Error("Neither AudioInputStream.createPushStream nor PushAudioInputStream.create is available");
        }
      } catch (streamError) {
        console.error("Failed to create push stream:", streamError);
        console.error("Available SDK methods:", Object.keys(sdk).filter((k: string) => k.includes("Audio") || k.includes("Stream")).join(", "));
        throw new Error(`Failed to create audio input stream: ${streamError instanceof Error ? streamError.message : String(streamError)}`);
      }
      
      // Write audio data to stream
      if (pushStream && typeof pushStream.write === "function") {
        pushStream.write(buffer);
      }
      if (pushStream && typeof pushStream.close === "function") {
        pushStream.close();
      }

    const result = await transcribeFromStream(pushStream);
    const transcript = result.transcript?.trim() ?? "";

    // Calculate metrics
    const fillerCount = countFillerWords(transcript);
    const speakingRate = calculateSpeakingRate(transcript, result.durationMs);

    return {
      transcript: transcript || "[No speech detected in audio]",
      fillerWordCount: fillerCount,
      speakingRateWpm: speakingRate,
      confidence: result.confidence ?? undefined,
    };
  } catch (error) {
    console.error("Speech transcription error:", error);
    // Return empty snapshot on error to allow evaluation to continue
    // The evaluation engine can still analyze based on other signals
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      transcript: `[Transcription failed: ${errorMessage}]`,
      fillerWordCount: 0,
      speakingRateWpm: 0,
      confidence: undefined,
    };
  }
}
