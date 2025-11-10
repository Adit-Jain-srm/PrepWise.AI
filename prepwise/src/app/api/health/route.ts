import { NextResponse } from "next/server";
import { serverEnv, getEnvVar } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const endpoint = getEnvVar("AZURE_OPENAI_ENDPOINT");
  const apiKey = getEnvVar("AZURE_OPENAI_API_KEY");
  const deployment = getEnvVar("AZURE_OPENAI_DEPLOYMENT");

  const config = {
    azureOpenAI: {
      endpoint: endpoint ? `${endpoint.substring(0, 20)}...` : "Not set",
      apiKey: apiKey ? "***" : "Not set",
      deployment: deployment || "Not set",
    },
    status: endpoint && apiKey && deployment ? "configured" : "missing",
  };

  return NextResponse.json(config);
}

