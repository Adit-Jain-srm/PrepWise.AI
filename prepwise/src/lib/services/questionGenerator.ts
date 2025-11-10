import crypto from "node:crypto";
import { z } from "zod";
import { CandidateProfile, InterviewQuestion, InterviewSessionPlan } from "../types/interview";
import { getAzureOpenAIClient, getOpenAIDeployment } from "../azure/openai";

const questionSchema = z.object({
  questions: z
    .array(
      z.object({
        category: z.enum(["behavioral", "situational", "school-specific", "essay"]),
        prompt: z.string(),
        follow_ups: z.array(z.string()).default([]),
        rubric_focus: z.array(z.string()).default([]),
        preparation_seconds: z.number().default(30),
        response_seconds: z.number().default(60),
      }),
    )
    .min(3),
  essay_prompts: z
    .array(
      z.object({
        prompt: z.string(),
        target_word_count: z.number().default(250),
      }),
    )
    .default([]),
});

type QuestionLLMResponse = z.infer<typeof questionSchema>;

function profileToSystemPrompt(profile: CandidateProfile): string {
  const highlights = [
    profile.currentRole ? `Current role: ${profile.currentRole}` : null,
    profile.totalExperienceYears
      ? `Years of experience: ${profile.totalExperienceYears}`
      : null,
    profile.education.length
      ? `Education: ${profile.education
          .map(
            (entry) =>
              `${entry.degree} @ ${entry.institution}${
                entry.fieldOfStudy ? ` in ${entry.fieldOfStudy}` : ""
              }`,
          )
          .join("; ")}`
      : null,
    profile.experience.length
      ? `Leadership/impact: ${profile.experience
          .flatMap((exp) => exp.leadershipHighlights ?? [])
          .slice(0, 3)
          .join(" | ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const keywords = profile.keywords.slice(0, 12).join(", ");
  const summary = profile.summaryBullets.slice(0, 6).join("\n- ");

  return [
    "You are PrepWise.AI, an elite MBA admissions interviewer with deep expertise in top-tier business school evaluations.",
    "Your mission is to design interview questions that rigorously test leadership potential, impact orientation, collaboration skills, and school-cultural fit.",
    "",
    "QUESTION DESIGN PRINCIPLES:",
    "- Each question must be highly personalized, referencing specific achievements, roles, or experiences from the candidate's background",
    "- Questions should probe for STAR-method responses (Situation, Task, Action, Result) with quantifiable outcomes",
    "- Mix behavioral (past experiences), situational (hypothetical scenarios), and school-specific (why this MBA program) questions",
    "- Focus on differentiating factors: leadership under pressure, cross-functional collaboration, innovation, global perspective",
    "- Avoid generic questions - every question should reveal something unique about this candidate",
    "",
    "ESSAY PROMPTS:",
    "- Generate 1-2 written essay prompts that require deep reflection (250 words target, 500 max)",
    "- Essays should test self-awareness, values alignment, and ability to articulate complex thoughts",
    "- Prompts should be distinct from interview questions and require written analysis",
    "",
    "Return valid JSON only. Be precise and actionable.",
    "",
    "Candidate Profile:",
    highlights,
    keywords ? `Key Strengths: ${keywords}` : null,
    summary ? `Resume Highlights:\n- ${summary}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function materializeQuestions(payload: QuestionLLMResponse, sessionId: string, candidateId: string): InterviewSessionPlan {
  const questions: InterviewQuestion[] = payload.questions.map((question, index) => ({
    id: `${sessionId}-q${index + 1}`,
    category: question.category === "essay" ? "behavioral" : question.category,
    prompt: question.prompt,
    followUps: question.follow_ups ?? [],
    rubricFocus: question.rubric_focus ?? [],
    preparationSeconds: question.preparation_seconds ?? 30,
    responseSeconds: question.response_seconds ?? 60,
  }));

  // Support multiple essay prompts
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

export async function generateInterviewSessionPlan(
  candidateId: string,
  profile: CandidateProfile,
  opts?: { sessionId?: string; questionCount?: number },
): Promise<InterviewSessionPlan> {
  const client = getAzureOpenAIClient();
  const deployment = getOpenAIDeployment();
  const sessionId = opts?.sessionId ?? crypto.randomUUID();
  const questionCount = opts?.questionCount ?? 5;

  // Use JSON mode for better compatibility
  const jsonSchemaPrompt = `You must return a valid JSON object with this exact structure:
{
  "questions": [
    {
      "category": "behavioral" | "situational" | "school-specific",
      "prompt": "string - the interview question",
      "follow_ups": ["string"] - optional follow-up questions,
      "rubric_focus": ["string"] - what this question tests,
      "preparation_seconds": number (default: 30),
      "response_seconds": number (default: 60)
    }
  ],
  "essay_prompts": [
    {
      "prompt": "string - the essay question",
      "target_word_count": number (default: 250, max: 500)
    }
  ]
}

Generate ${questionCount} questions and 1-2 essay prompts. Return ONLY valid JSON. No markdown, no code blocks.`;

  const response = await client.chat.completions.create({
    model: deployment,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: profileToSystemPrompt(profile) + "\n\n" + jsonSchemaPrompt,
      },
      {
        role: "user",
        content: `Generate ${questionCount} high-signal, personalized interview questions that deeply probe the candidate's leadership, impact, and fit. Also create 1-2 essay prompts (250 words target, 500 words maximum) that test written communication and self-reflection. Ensure all questions are tailored to this specific candidate's background and experiences.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Azure OpenAI returned an empty response when generating questions.");
  }

  // Clean the content - remove markdown code blocks if present
  let cleanedContent = content.trim();
  if (cleanedContent.startsWith("```json")) {
    cleanedContent = cleanedContent.replace(/^```json\s*/i, "").replace(/\s*```\s*$/, "");
  } else if (cleanedContent.startsWith("```")) {
    cleanedContent = cleanedContent.replace(/^```\s*/, "").replace(/\s*```\s*$/, "");
  }
  cleanedContent = cleanedContent.trim();

  let parsedJson: QuestionLLMResponse;
  try {
    parsedJson = JSON.parse(cleanedContent) as QuestionLLMResponse;
  } catch (parseError) {
    console.error("Failed to parse questions JSON:", parseError);
    console.error("Response content:", cleanedContent.substring(0, 500));
    throw new Error(
      `Failed to parse question set JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
    );
  }

  const parsed = questionSchema.safeParse(parsedJson);

  if (!parsed.success) {
    console.error("Schema validation failed:", parsed.error);
    throw new Error(`Failed to validate question set JSON: ${parsed.error.message}`);
  }

  return materializeQuestions(parsed.data, sessionId, candidateId);
}
