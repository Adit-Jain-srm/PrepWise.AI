import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { parseCandidateProfile } from "@/lib/services/resumeParser";
import { saveCandidateProfile } from "@/lib/db/interviewRepository";
import { CandidateEssay, CandidateProfile } from "@/lib/types/interview";
import { saveInterviewAsset } from "@/lib/services/storageService";
import { serverEnv, getEnvVar } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("=== Resume Parse API Called ===");
    
    // Get environment variables with fallback
    const endpoint = getEnvVar("AZURE_OPENAI_ENDPOINT");
    const apiKey = getEnvVar("AZURE_OPENAI_API_KEY");
    const deployment = getEnvVar("AZURE_OPENAI_DEPLOYMENT");

    // Validate Azure OpenAI configuration before processing
    if (!endpoint || !apiKey || !deployment) {
      const missingVars = [];
      if (!endpoint) missingVars.push("AZURE_OPENAI_ENDPOINT");
      if (!apiKey) missingVars.push("AZURE_OPENAI_API_KEY");
      if (!deployment) missingVars.push("AZURE_OPENAI_DEPLOYMENT");

      console.error("Missing environment variables:", missingVars);
      console.error("Available serverEnv keys:", Object.keys(serverEnv).filter(key => serverEnv[key as keyof typeof serverEnv]));
      console.error("Endpoint present:", !!endpoint);
      console.error("API key present:", !!apiKey);
      console.error("Deployment present:", !!deployment);

      return NextResponse.json(
        {
          error: `Azure OpenAI is not configured. Missing: ${missingVars.join(", ")}. Please ensure these environment variables are set in your .env.local file in the prepwise directory and restart your development server.`,
        },
        { status: 500 },
      );
    }

    console.log("Azure OpenAI configuration validated");

    let formData: FormData;
    try {
      formData = await request.formData();
      console.log("Form data parsed successfully");
    } catch (formError) {
      console.error("Failed to parse form data:", formError);
      return NextResponse.json({ error: "Failed to parse form data." }, { status: 400 });
    }

    const resumeFile = formData.get("resume");
    const essayText = formData.get("essayText") as string | null;
    const essayFile = formData.get("essayFile");
    const essayPromptInput = (formData.get("essayPrompt") as string | null) ?? "MBA Essay";
    const candidateId = (formData.get("candidateId") as string) ?? crypto.randomUUID();

    if (!resumeFile || !(resumeFile instanceof File)) {
      console.error("Missing resume file");
      return NextResponse.json({ error: "Missing resume file upload." }, { status: 400 });
    }

    console.log(`Resume file received: ${resumeFile.name}, type: ${resumeFile.type}, size: ${resumeFile.size} bytes`);

    // Parse the resume profile
    let profile: CandidateProfile;
    try {
      console.log("Starting resume parsing...");
      profile = await parseCandidateProfile(resumeFile);
      console.log("Resume parsed successfully");
    } catch (parseError) {
      console.error("Error parsing resume:", parseError);
      throw parseError; // Re-throw to be caught by outer catch
    }
    const essays: CandidateEssay[] = [];

    // Handle essay text
    if (essayText && essayText.trim().length > 0) {
      essays.push({
        id: crypto.randomUUID(),
        prompt: essayPromptInput,
        content: essayText.trim(),
      });
    }

    // Handle essay file upload (optional, don't fail if storage is unavailable)
    if (essayFile instanceof File) {
      try {
        const essayBuffer = Buffer.from(await essayFile.arrayBuffer());
        await saveInterviewAsset({
          sessionId: candidateId,
          assetType: "essay",
          buffer: essayBuffer,
          mimeType: essayFile.type,
        });

        const essayContent = essayFile.type.startsWith("text/")
          ? await essayFile.text()
          : "Essay uploaded as attachment.";

        essays.push({
          id: crypto.randomUUID(),
          prompt: essayPromptInput,
          content: essayContent,
        });
      } catch (storageError) {
        console.warn("Failed to save essay file to storage, continuing without it:", storageError);
        // Continue without saving to storage
        const essayContent = essayFile.type.startsWith("text/")
          ? await essayFile.text()
          : "Essay uploaded as attachment.";

        essays.push({
          id: crypto.randomUUID(),
          prompt: essayPromptInput,
          content: essayContent,
        });
      }
    }

    const enrichedProfile: CandidateProfile = {
      ...profile,
      ...(essays.length ? { essays } : {}),
    };

    // Save candidate profile (this uses in-memory storage if Supabase is not configured)
    await saveCandidateProfile(candidateId, enrichedProfile);

    // Save resume to storage (optional, don't fail if storage is unavailable)
    try {
      const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
      await saveInterviewAsset({
        sessionId: candidateId,
        assetType: "resume",
        buffer: resumeBuffer,
        mimeType: resumeFile.type,
      });
    } catch (storageError) {
      console.warn("Failed to save resume to storage, continuing without it:", storageError);
      // Continue without saving to storage - the profile is already saved
    }

    return NextResponse.json({
      candidateId,
      profile: enrichedProfile,
    });
  } catch (error) {
    console.error("=== ERROR in resume parse route ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Full error:", error);

    // Provide more detailed error messages
    let errorMessage = "Failed to parse resume. Please verify the file and try again.";
    let statusCode = 500;

    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      // Check for common Azure OpenAI errors
      if (
        errorMsg.includes("azure_openai") ||
        errorMsg.includes("missing required environment variable")
      ) {
        errorMessage =
          "Azure OpenAI is not configured. Please check your environment variables in .env.local file.";
        statusCode = 500;
      } else if (errorMsg.includes("api key") || errorMsg.includes("authentication") || errorMsg.includes("401")) {
        errorMessage = "Azure OpenAI authentication failed. Please check your API key and ensure it's valid.";
        statusCode = 401;
      } else if (errorMsg.includes("deployment") || errorMsg.includes("404")) {
        errorMessage = "Azure OpenAI deployment not found. Please check your deployment name (currently: " + getEnvVar("AZURE_OPENAI_DEPLOYMENT") + ").";
        statusCode = 404;
      } else if (errorMsg.includes("rate limit") || errorMsg.includes("quota") || errorMsg.includes("429")) {
        errorMessage = "Azure OpenAI quota exceeded. Please check your usage limits.";
        statusCode = 429;
      } else if (errorMsg.includes("json_schema") || errorMsg.includes("response_format")) {
        errorMessage = "Azure OpenAI API version may not support JSON schema. Please check your API version (currently: " + (getEnvVar("AZURE_OPENAI_API_VERSION") || "2024-10-01-preview") + ").";
        statusCode = 500;
      } else if (errorMsg.includes("invalid") || errorMsg.includes("malformed")) {
        errorMessage = `Resume parsing error: ${error.message}`;
        statusCode = 400;
      } else {
        // Include the actual error message for debugging
        errorMessage = error.message || errorMessage;
        statusCode = 500;
      }
    } else {
      errorMessage =
        "An unexpected error occurred. Please check the server logs and ensure all Azure services are configured correctly.";
      statusCode = 500;
    }

    console.error("Returning error response:", { errorMessage, statusCode });

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
