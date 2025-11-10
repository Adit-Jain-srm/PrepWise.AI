import { uploadBufferToBlob } from "../azure/storage";
import { serverEnv } from "../env";

type AssetType = "resume" | "essay" | "video" | "audio";

const MIME_EXTENSION_MAP: Record<string, string> = {
  "video/webm": "webm",
  "audio/webm": "webm",
  "video/mp4": "mp4",
  "audio/mp3": "mp3",
  "audio/mpeg": "mp3",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export function getAssetContainer(): string {
  return serverEnv.AZURE_STORAGE_CONTAINER ?? "prepwise-assets";
}

function guessExtension(mimeType: string | undefined): string {
  if (!mimeType) {
    return "bin";
  }

  return MIME_EXTENSION_MAP[mimeType] ?? mimeType.split("/").pop() ?? "bin";
}

export async function saveInterviewAsset(params: {
  sessionId: string;
  questionId?: string;
  assetType: AssetType;
  buffer: Buffer;
  mimeType?: string;
}): Promise<string> {
  const container = getAssetContainer();
  const extension = guessExtension(params.mimeType);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  const blobNameParts = [
    params.sessionId,
    params.questionId ?? "session",
    `${params.assetType}-${timestamp}.${extension}`,
  ];

  const blobName = blobNameParts.join("/");

  return uploadBufferToBlob(container, blobName, params.buffer, params.mimeType);
}
