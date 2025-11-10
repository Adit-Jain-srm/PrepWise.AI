import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { parseCandidateProfile } from "@/lib/services/resumeParser";
import { saveCandidateProfile } from "@/lib/db/interviewRepository";
import { CandidateEssay, CandidateProfile } from "@/lib/types/interview";
import { saveInterviewAsset } from "@/lib/services/storageService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const resumeFile = formData.get("resume");
  const essayText = formData.get("essayText") as string | null;
  const essayFile = formData.get("essayFile");
  const essayPromptInput = (formData.get("essayPrompt") as string | null) ?? "MBA Essay";
  const candidateId = (formData.get("candidateId") as string) ?? crypto.randomUUID();

  if (!resumeFile || !(resumeFile instanceof File)) {
    return NextResponse.json({ error: "Missing resume file upload." }, { status: 400 });
  }

  try {
    const profile = await parseCandidateProfile(resumeFile);
    const essays: CandidateEssay[] = [];

    if (essayText && essayText.trim().length > 0) {
      essays.push({
        id: crypto.randomUUID(),
        prompt: essayPromptInput,
        content: essayText.trim(),
      });
    }

    if (essayFile instanceof File) {
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
    }

    const enrichedProfile: CandidateProfile = {
      ...profile,
      ...(essays.length ? { essays } : {}),
    };

    await saveCandidateProfile(candidateId, enrichedProfile);

    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
    await saveInterviewAsset({
      sessionId: candidateId,
      assetType: "resume",
      buffer: resumeBuffer,
      mimeType: resumeFile.type,
    });

    return NextResponse.json({
      candidateId,
      profile: enrichedProfile,
    });
  } catch (error) {
    console.error("Failed to parse candidate resume", error);
    return NextResponse.json(
      { error: "Failed to parse resume. Please verify the file and try again." },
      { status: 500 },
    );
  }
}
