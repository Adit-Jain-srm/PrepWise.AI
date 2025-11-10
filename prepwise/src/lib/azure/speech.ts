import sdk, { AudioConfig, SpeechConfig, SpeechRecognizer } from "microsoft-cognitiveservices-speech-sdk";
import { requireServerEnv } from "../env";

export type SpeechTranscriptionResult = {
  transcript: string;
  confidence: number | null;
  durationMs: number | null;
};

let cachedSpeechConfig: SpeechConfig | null = null;

export function getSpeechConfig(): SpeechConfig {
  if (cachedSpeechConfig) {
    return cachedSpeechConfig;
  }

  const key = requireServerEnv("AZURE_SPEECH_KEY", "Azure Speech transcription");
  const region = requireServerEnv("AZURE_SPEECH_REGION", "Azure Speech transcription");

  cachedSpeechConfig = SpeechConfig.fromSubscription(key, region);
  cachedSpeechConfig.speechRecognitionLanguage = "en-US";

  return cachedSpeechConfig;
}

export async function transcribeFromStream(
  stream: sdk.AudioInputStream,
): Promise<SpeechTranscriptionResult> {
  const recognizer = new SpeechRecognizer(getSpeechConfig(), AudioConfig.fromStreamInput(stream));

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        recognizer.close();
        resolve({
          transcript: result.text,
          confidence: result.properties.getProperty(
            sdk.PropertyId.SpeechServiceResponse_JsonResult,
          )
            ? result.confidence
            : null,
          durationMs: result.duration / 10000 ?? null,
        });
      },
      (error) => {
        recognizer.close();
        reject(error);
      },
    );
  });
}
