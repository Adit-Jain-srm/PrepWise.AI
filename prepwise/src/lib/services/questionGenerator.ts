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
  essay_prompt: z
    .object({
      prompt: z.string(),
      target_word_count: z.number().default(200),
    })
    .nullable()
    .default(null),
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
    "You are PrepWise.AI, an expert MBA admissions interviewer.",
    "Craft questions tailored to the candidate's unique background to test leadership, impact, collaboration, and school fit.",
    "Each question should be crisp, high signal, and refer to the candidate's achievements when relevant.",
    "Return JSON only.",
    "Candidate highlights:",
    highlights,
    keywords ? `Keywords: ${keywords}` : null,
    summary ? `Resume summary bullets:\n- ${summary}` : null,
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

  const essay = payload.essay_prompt
    ? {
        id: `${sessionId}-essay`,
        prompt: payload.essay_prompt.prompt,
        targetWordCount: payload.essay_prompt.target_word_count ?? 200,
      }
    : null;

  return {
    sessionId,
    candidateId,
    questions,
    essayPrompt: essay,
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

  const response = await client.chat.completions.create({
    model: deployment,
    temperature: 0.4,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "mba_interview_plan",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["questions"],
          properties: {
            questions: {
              type: "array",
              minItems: questionCount,
              maxItems: questionCount,
              items: {
                type: "object",
                required: ["category", "prompt"],
                additionalProperties: false,
                properties: {
                  category: {
                    type: "string",
                    enum: ["behavioral", "situational", "school-specific", "essay"],
                  },
                  prompt: { type: "string" },
                  follow_ups: { type: "array", items: { type: "string" } },
                  rubric_focus: { type: "array", items: { type: "string" } },
                  preparation_seconds: { type: "number" },
                  response_seconds: { type: "number" },
                },
              },
            },
            essay_prompt: {
              anyOf: [
                { type: "null" },
                {
                  type: "object",
                  required: ["prompt"],
                  properties: {
                    prompt: { type: "string" },
                    target_word_count: { type: "number" },
                  },
                  additionalProperties: false,
                },
              ],
            },
          },
        },
      },
    },
    messages: [
      {
        role: "system",
        content: profileToSystemPrompt(profile),
      },
      {
        role: "user",
        content: `Generate ${questionCount} high signal interview questions and an optional essay prompt.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Azure OpenAI returned an empty response when generating questions.");
  }

  const parsedJson = JSON.parse(content) as QuestionLLMResponse;
  const parsed = questionSchema.safeParse(parsedJson);

  if (!parsed.success) {
    throw new Error(`Failed to parse question set JSON: ${parsed.error.message}`);
  }

  return materializeQuestions(parsed.data, sessionId, candidateId);
}
