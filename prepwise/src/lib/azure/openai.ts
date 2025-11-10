import { AzureOpenAI } from "openai";
import { serverEnv, getEnvVar } from "../env";

let cachedClient: AzureOpenAI | null = null;

/**
 * Clean up the endpoint URL by removing any paths or query parameters
 * The endpoint should be just the base URL like: https://your-resource.openai.azure.com
 */
function cleanEndpointUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Return just the origin (protocol + host)
    return urlObj.origin;
  } catch {
    // If URL parsing fails, try to manually clean it
    // Remove everything after the domain
    const match = url.match(/^(https?:\/\/[^\/]+)/);
    return match ? match[1] : url;
  }
}

export function getAzureOpenAIClient(): AzureOpenAI {
  if (cachedClient) {
    return cachedClient;
  }

  // Get environment variables with fallback
  const endpointRaw = getEnvVar("AZURE_OPENAI_ENDPOINT");
  const apiKey = getEnvVar("AZURE_OPENAI_API_KEY");
  const deployment = getEnvVar("AZURE_OPENAI_DEPLOYMENT");
  const apiVersion = getEnvVar("AZURE_OPENAI_API_VERSION") || serverEnv.AZURE_OPENAI_API_VERSION || "2024-10-01-preview";

  // Validate required variables
  if (!endpointRaw || !apiKey || !deployment) {
    const missing = [];
    if (!endpointRaw) missing.push("AZURE_OPENAI_ENDPOINT");
    if (!apiKey) missing.push("AZURE_OPENAI_API_KEY");
    if (!deployment) missing.push("AZURE_OPENAI_DEPLOYMENT");
    throw new Error(`Missing required Azure OpenAI environment variables: ${missing.join(", ")}`);
  }

  // Clean the endpoint URL to remove any paths or query parameters
  // This handles cases where users include the full API path in the endpoint
  const endpoint = cleanEndpointUrl(endpointRaw);

  console.log("Initializing Azure OpenAI client with:");
  console.log(`  Endpoint: ${endpoint.substring(0, 50)}...`);
  console.log(`  Deployment: ${deployment}`);
  console.log(`  API Version: ${apiVersion}`);
  console.log(`  API Key: ${apiKey ? "***" + apiKey.slice(-4) : "MISSING"}`);

  try {
    cachedClient = new AzureOpenAI({
      endpoint,
      apiKey,
      deployment,
      apiVersion,
    });
    console.log("Azure OpenAI client initialized successfully");
  } catch (clientError) {
    console.error("Failed to initialize Azure OpenAI client:", clientError);
    throw new Error(`Failed to initialize Azure OpenAI client: ${clientError instanceof Error ? clientError.message : String(clientError)}`);
  }
  
  return cachedClient;
}

export function getOpenAIDeployment(): string {
  const deployment = getEnvVar("AZURE_OPENAI_DEPLOYMENT");
  if (!deployment) {
    throw new Error("Missing required environment variable: AZURE_OPENAI_DEPLOYMENT");
  }
  return deployment;
}
