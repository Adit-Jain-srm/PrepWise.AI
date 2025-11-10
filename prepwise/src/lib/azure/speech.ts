import { getEnvVar } from "../env";

// Import Azure Speech SDK using require for better compatibility with Next.js server environment
// This avoids webpack bundling issues with CommonJS modules
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const sdk = require("microsoft-cognitiveservices-speech-sdk");

const { AudioConfig, SpeechConfig, SpeechRecognizer } = sdk;

export type SpeechTranscriptionResult = {
  transcript: string;
  confidence: number | null;
  durationMs: number | null;
};

// Type for SpeechConfig (using any to avoid type issues with CommonJS module)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedSpeechConfig: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSpeechConfig(): any {
  // Check if Azure Speech is configured
  const key = getEnvVar("AZURE_SPEECH_KEY");
  const region = getEnvVar("AZURE_SPEECH_REGION");

  if (!key || !region) {
    console.warn("Azure Speech SDK not configured. Missing AZURE_SPEECH_KEY or AZURE_SPEECH_REGION.");
    return null;
  }

  if (cachedSpeechConfig) {
    return cachedSpeechConfig;
  }

  try {
    cachedSpeechConfig = SpeechConfig.fromSubscription(key, region);
    cachedSpeechConfig.speechRecognitionLanguage = "en-US";
    // Request detailed JSON results for better transcription quality
    cachedSpeechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_RequestSentenceLevelConfidence, "true");
    // Enable word-level timestamps for better analysis
    cachedSpeechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_RequestWordLevelTimestamps, "true");

    return cachedSpeechConfig;
  } catch (error) {
    console.error("Failed to create SpeechConfig:", error);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function transcribeFromStream(
  stream: any,
): Promise<SpeechTranscriptionResult> {
  const speechConfig = getSpeechConfig();
  
  if (!speechConfig) {
    throw new Error("Azure Speech SDK is not configured. Cannot transcribe audio.");
  }

  const audioConfig = AudioConfig.fromStreamInput(stream);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognizer = new SpeechRecognizer(speechConfig, audioConfig) as any;

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result: any) => {
        recognizer.close();
        
        // Handle cancellation or no match
        if (result.reason === sdk.ResultReason.Canceled) {
          const cancellation = sdk.CancellationDetails.fromResult(result);
          reject(new Error(`Speech recognition canceled: ${cancellation.reason}. ${cancellation.errorDetails}`));
          return;
        }

        if (result.reason === sdk.ResultReason.NoMatch) {
          resolve({
            transcript: "",
            confidence: null,
            durationMs: null,
          });
          return;
        }

        // Extract transcript and confidence
        const transcript = result.text || "";
        let confidence: number | null = null;
        
        // Try to get confidence from detailed results
        try {
          const detailedResult = result.properties.getProperty(
            sdk.PropertyId.SpeechServiceResponse_JsonResult,
          );
          if (detailedResult) {
            const jsonResult = JSON.parse(detailedResult);
            confidence = jsonResult?.Confidence ?? result.confidence ?? null;
          } else {
            confidence = result.confidence ?? null;
          }
        } catch {
          confidence = result.confidence ?? null;
        }

        resolve({
          transcript,
          confidence,
          durationMs: result.duration ? result.duration / 10000 : null,
        });
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => {
        recognizer.close();
        reject(error);
      },
    );
  });
}
