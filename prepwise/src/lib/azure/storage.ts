import { BlobServiceClient, BlockBlobParallelUploadOptions } from "@azure/storage-blob";
import { requireServerEnv } from "../env";

let cachedBlobService: BlobServiceClient | null = null;

export function getBlobServiceClient(): BlobServiceClient {
  if (cachedBlobService) {
    return cachedBlobService;
  }

  const connectionString = requireServerEnv(
    "AZURE_STORAGE_CONNECTION_STRING",
    "Azure Blob Storage uploads",
  );

  cachedBlobService = BlobServiceClient.fromConnectionString(connectionString);
  return cachedBlobService;
}

export async function ensureContainer(containerName: string): Promise<void> {
  const containerClient = getBlobServiceClient().getContainerClient(containerName);
  const exists = await containerClient.exists();

  if (!exists) {
    // Container access is optional - default is private
    await containerClient.create();
  }
}

export async function uploadBufferToBlob(
  containerName: string,
  blobName: string,
  buffer: Buffer,
  contentType?: string,
  options?: BlockBlobParallelUploadOptions,
): Promise<string> {
  await ensureContainer(containerName);

  const containerClient = getBlobServiceClient().getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    ...options,
    blobHTTPHeaders: {
      blobCacheControl: "private, max-age=0, no-cache",
      blobContentType: contentType,
      ...options?.blobHTTPHeaders,
    },
  });

  return blockBlobClient.url;
}
