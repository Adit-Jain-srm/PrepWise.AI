import crypto from "node:crypto";
import { z } from "zod";
import { CandidateProfile, InterviewQuestion, InterviewSessionPlan } from "../types/interview";
import { getAzureOpenAIClient, getOpenAIDeployment } from "../azure/openai";

const premiumQuestionSchema = z.object({
  questions: z
    .array(
      z.object({
        category: z.enum(["behavioral", "situational", "school-specific", "essay"]),
        prompt: z.string(),
        follow_ups: z.array(z.string()).default([]),
        rubric_focus: z.array(z.string()).default([]),
        preparation_seconds: z.number().default(30),
        response_seconds: z.number().default(60),
        personalization_level: z.enum(["high", "very_high", "extreme"]).default("very_high"),
        reasoning: z.string().optional(), // Why this question was chosen for this candidate
      }),
    )
    .min(5),
  essay_prompts: z
    .array(
      z.object({
        prompt: z.string(),
        target_word_count: z.number().default(250),
        personalization_note: z.string().optional(), // How this essay is tailored
      }),
    )
    .default([]),
  analysis: z.object({
    candidate_strengths: z.array(z.string()),
    potential_weaknesses: z.array(z.string()),
    recommended_focus_areas: z.array(z.string()),
  }).optional(),
});

type PremiumQuestionLLMResponse = z.infer<typeof premiumQuestionSchema>;

function profileToPremiumSystemPrompt(profile: CandidateProfile): string {
  const highlights = [
    profile.fullName ? `Candidate: ${profile.fullName}` : null,
    profile.currentRole ? `Current role: ${profile.currentRole}` : null,
    profile.totalExperienceYears
      ? `Years of experience: ${profile.totalExperienceYears}`
      : null,
    profile.education.length
      ? `Education:\n${profile.education
          .map(
            (entry) =>
              `  - ${entry.degree}${entry.fieldOfStudy ? ` in ${entry.fieldOfStudy}` : ""} @ ${entry.institution}${entry.achievements ? ` (${entry.achievements.join(", ")})` : ""}`,
          )
          .join("\n")}`
      : null,
    profile.experience.length
      ? `Professional Experience:\n${profile.experience
          .map(
            (exp) =>
              `  - ${exp.title} at ${exp.company}${exp.startDate && exp.endDate ? ` (${exp.startDate} - ${exp.endDate})` : ""}\n    ${exp.achievements ? `    Achievements: ${exp.achievements.slice(0, 3).join("; ")}` : ""}\n    ${exp.leadershipHighlights ? `    Leadership: ${exp.leadershipHighlights.slice(0, 2).join("; ")}` : ""}`,
          )
          .join("\n\n")}`
      : null,
    profile.leadership.length
      ? `Leadership Experience:\n${profile.leadership
          .map(
            (lead) =>
              `  - ${lead.role} at ${lead.organization}: ${lead.impact}${lead.metrics ? ` (${lead.metrics.join(", ")})` : ""}`,
          )
          .join("\n")}`
      : null,
    profile.extracurriculars?.length
      ? `Extracurriculars: ${profile.extracurriculars.join(", ")}`
      : null,
    profile.achievements?.length
      ? `Key Achievements: ${profile.achievements.join("; ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const keywords = profile.keywords.join(", ");
  const summary = profile.summaryBullets.join("\n- ");

  return [
    "You are PrepWise.AI Premium, an elite MBA admissions consultant with deep expertise in top-tier business school evaluations.",
    "Your mission is to design HIGHLY PERSONALIZED interview questions that deeply probe the candidate's unique background, achievements, and potential.",
    "",
    "PREMIUM QUESTION DESIGN PRINCIPLES:",
    "- EXTREME PERSONALIZATION: Every question MUST reference specific experiences, achievements, or details from the candidate's profile",
    "- Depth over breadth: Probe deeply into specific achievements rather than asking generic questions",
    "- Challenge assumptions: Ask questions that test self-awareness and ability to handle critique",
    "- Connect experiences: Ask about relationships between different roles/experiences",
    "- Future-focused: Link past achievements to future MBA goals and career trajectory",
    "- School-specific nuance: If targeting specific schools, incorporate their values and culture",
    "",
    "QUESTION CATEGORIES:",
    "- Behavioral: Deep dive into specific past experiences with STAR method focus",
    "- Situational: Hypothetical scenarios tailored to the candidate's likely challenges",
    "- School-specific: Why this MBA program, why now, career goals alignment",
    "",
    "ESSAY PROMPTS (Premium):",
    "- Generate 2-3 written essay prompts that require deep self-reflection",
    "- Each essay should be tailored to reveal different aspects of the candidate",
    "- Prompts should be distinct from interview questions",
    "- Target: 250 words (can go up to 500 max)",
    "",
    "ANALYSIS (Optional but recommended):",
    "- Identify candidate's key strengths based on profile",
    "- Highlight potential areas of concern or weakness",
    "- Recommend focus areas for interview preparation",
    "",
    "Return valid JSON only. Be precise, detailed, and extremely personalized.",
    "",
    "=== CANDIDATE PROFILE ===",
    highlights,
    "",
    `Key Strengths/Traits: ${keywords}`,
    "",
    "Resume Summary:",
    summary ? `- ${summary}` : "Not provided",
  ]
    .filter(Boolean)
    .join("\n");
}

function materializePremiumQuestions(
  payload: PremiumQuestionLLMResponse,
  sessionId: string,
  candidateId: string,
): InterviewSessionPlan {
  const questions: InterviewQuestion[] = payload.questions.map((question, index) => ({
    id: `${sessionId}-q${index + 1}`,
    category: question.category === "essay" ? "behavioral" : question.category,
    prompt: question.prompt,
    followUps: question.follow_ups ?? [],
    rubricFocus: question.rubric_focus ?? [],
    preparationSeconds: question.preparation_seconds ?? 30,
    responseSeconds: question.response_seconds ?? 60,
  }));

  // Support multiple essay prompts with enhanced personalization
  const essayPrompts = payload.essay_prompts?.length
    ? payload.essay_prompts.map((essay, index) => ({
        id: `${sessionId}-essay-${index + 1}`,
        prompt: essay.prompt,
        targetWordCount: essay.target_word_count ?? 250,
      }))
    : [];

  // For backward compatibility, use first essay as essayPrompt if only one
  const essayPrompt = essayPrompts.length === 1 ? essayPrompts[0] : null;

  return {
    sessionId,
    candidateId,
    questions,
    essayPrompt,
    essayPrompts: essayPrompts.length > 1 ? essayPrompts : undefined,
  };
}

export async function generatePremiumInterviewSessionPlan(
  candidateId: string,
  profile: CandidateProfile,
  opts?: { sessionId?: string; questionCount?: number; targetSchools?: string[] },
): Promise<InterviewSessionPlan> {
  const client = getAzureOpenAIClient();
  const deployment = getOpenAIDeployment();
  const sessionId = opts?.sessionId ?? crypto.randomUUID();
  const questionCount = opts?.questionCount ?? 7; // Premium gets more questions by default

  const schoolContext = opts?.targetSchools?.length
    ? `\n\nTARGET SCHOOLS CONTEXT:\nThe candidate is targeting these MBA programs: ${opts.targetSchools.join(", ")}. Incorporate school-specific values, culture, and interview approaches where relevant.`
    : "";

  const jsonSchemaPrompt = `You must return a valid JSON object with this exact structure:
{
  "questions": [
    {
      "category": "behavioral" | "situational" | "school-specific",
      "prompt": "string - HIGHLY PERSONALIZED interview question referencing specific experiences",
      "follow_ups": ["string"] - challenging follow-up questions,
      "rubric_focus": ["string"] - what this question tests (leadership, impact, etc.),
      "preparation_seconds": number (default: 30),
      "response_seconds": number (default: 60),
      "personalization_level": "high" | "very_high" | "extreme",
      "reasoning": "string - why this question was chosen for THIS candidate"
    }
  ],
  "essay_prompts": [
    {
      "prompt": "string - personalized essay question",
      "target_word_count": number (default: 250, max: 500),
      "personalization_note": "string - how this essay is tailored"
    }
  ],
  "analysis": {
    "candidate_strengths": ["string"],
    "potential_weaknesses": ["string"],
    "recommended_focus_areas": ["string"]
  }
}

Generate ${questionCount} EXTREMELY PERSONALIZED questions and 2-3 essay prompts. Every question MUST reference specific details from the candidate's profile. Return ONLY valid JSON. No markdown, no code blocks.`;

  const response = await client.chat.completions.create({
    model: deployment,
    temperature: 0.5, // Slightly higher for more creativity in personalization
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: profileToPremiumSystemPrompt(profile) + schoolContext + "\n\n" + jsonSchemaPrompt,
      },
      {
        role: "user",
        content: `Generate ${questionCount} EXTREMELY PERSONALIZED interview questions that deeply probe this candidate's unique background. Every question should reference specific experiences, achievements, or details from their profile. Also create 2-3 highly tailored essay prompts that test written communication and self-reflection. Include an analysis of the candidate's strengths, potential weaknesses, and recommended focus areas.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Azure OpenAI returned an empty response when generating premium questions.");
  }

  // Clean the content - remove markdown code blocks if present
  let cleanedContent = content.trim();
  if (cleanedContent.startsWith("```json")) {
    cleanedContent = cleanedContent.replace(/^```json\s*/i, "").replace(/\s*```\s*$/, "");
  } else if (cleanedContent.startsWith("```")) {
    cleanedContent = cleanedContent.replace(/^```\s*/, "").replace(/\s*```\s*$/, "");
  }
  cleanedContent = cleanedContent.trim();

  let parsedJson: PremiumQuestionLLMResponse;
  try {
    parsedJson = JSON.parse(cleanedContent) as PremiumQuestionLLMResponse;
  } catch (parseError) {
    console.error("Failed to parse premium questions JSON:", parseError);
    console.error("Response content:", cleanedContent.substring(0, 500));
    throw new Error(
      `Failed to parse premium question set JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
    );
  }

  const parsed = premiumQuestionSchema.safeParse(parsedJson);

  if (!parsed.success) {
    console.error("Premium schema validation failed:", parsed.error);
    throw new Error(`Failed to validate premium question set JSON: ${parsed.error.message}`);
  }

  return materializePremiumQuestions(parsed.data, sessionId, candidateId);
}

