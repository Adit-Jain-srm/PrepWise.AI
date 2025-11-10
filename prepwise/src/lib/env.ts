import { z } from "zod";

const serverSchema = z.object({
  AZURE_OPENAI_ENDPOINT: z
    .string()
    .url()
    .optional()
    .describe("Azure OpenAI endpoint e.g. https://your-resource.openai.azure.com"),
  AZURE_OPENAI_API_KEY: z
    .string()
    .min(1)
    .optional()
    .describe("Azure OpenAI API key"),
  AZURE_OPENAI_DEPLOYMENT: z
    .string()
    .min(1)
    .optional()
    .describe("Azure OpenAI deployment name for chat completions"),
  AZURE_OPENAI_API_VERSION: z
    .string()
    .min(1)
    .optional()
    .default("2024-10-01-preview")
    .describe("Azure OpenAI API version"),
  AZURE_STORAGE_CONNECTION_STRING: z
    .string()
    .min(1)
    .optional()
    .describe("Azure Blob Storage connection string"),
  AZURE_STORAGE_CONTAINER: z
    .string()
    .min(1)
    .optional()
    .describe("Default Azure Blob Storage container for interview assets"),
  AZURE_SPEECH_KEY: z
    .string()
    .min(1)
    .optional()
    .describe("Azure Speech service subscription key"),
  AZURE_SPEECH_REGION: z
    .string()
    .min(1)
    .optional()
    .describe("Azure Speech service region, e.g. eastus"),
  SUPABASE_URL: z
    .string()
    .url()
    .optional()
    .describe("Supabase project URL"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1)
    .optional()
    .describe("Supabase service role key for secure writes"),
  REPORT_SIGNING_SECRET: z
    .string()
    .min(1)
    .optional()
    .describe("Secret used to sign downloadable PDF reports"),
});

const parsedServer = serverSchema.safeParse(process.env);

export type ServerEnv = z.infer<typeof serverSchema>;

export const serverEnv: ServerEnv = parsedServer.success ? parsedServer.data : {};

export function requireServerEnv<Key extends keyof ServerEnv>(
  key: Key,
  featureHint?: string,
): NonNullable<ServerEnv[Key]> {
  const value = serverEnv[key];

  if (value === undefined || value === null || value === "") {
    const hintSuffix = featureHint ? ` (${featureHint})` : "";
    throw new Error(`Missing required environment variable: ${String(key)}${hintSuffix}`);
  }

  return value as NonNullable<ServerEnv[Key]>;
}
