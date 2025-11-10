import { AzureOpenAI } from "openai";
import { requireServerEnv, serverEnv } from "../env";

let cachedClient: AzureOpenAI | null = null;

export function getAzureOpenAIClient(): AzureOpenAI {
  if (cachedClient) {
    return cachedClient;
  }

  const endpoint = requireServerEnv("AZURE_OPENAI_ENDPOINT", "Azure OpenAI");
  const apiKey = requireServerEnv("AZURE_OPENAI_API_KEY", "Azure OpenAI");
  const deployment = requireServerEnv("AZURE_OPENAI_DEPLOYMENT", "Azure OpenAI deployment name");
  const apiVersion = serverEnv.AZURE_OPENAI_API_VERSION ?? "2024-10-01-preview";

  cachedClient = new AzureOpenAI({
    endpoint,
    apiKey,
    deployment,
    apiVersion,
  });
  return cachedClient;
}

export function getOpenAIDeployment(): string {
  return requireServerEnv("AZURE_OPENAI_DEPLOYMENT", "Azure OpenAI deployment name");
}
