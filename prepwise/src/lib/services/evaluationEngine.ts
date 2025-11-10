import { z } from "zod";
import { getAzureOpenAIClient, getOpenAIDeployment } from "../azure/openai";
import {
  InterviewQuestion,
  ResponseEvaluation,
  InterviewEvaluation,
  CandidateProfile,
  SpeechAnalyticsSnapshot,
  NonVerbalSignal,
} from "../types/interview";

export type ResponseEvaluationInput = {
  sessionId: string;
  question: InterviewQuestion;
  profile: CandidateProfile;
  speech: SpeechAnalyticsSnapshot;
  nonVerbalSignals?: NonVerbalSignal[];
};

const evaluationSchema = z.object({
  overall_commentary: z.string(),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  rubric_scores: z.record(z.number()),
  tone_analysis: z.string().optional(),
  non_verbal_analysis: z.string().optional(),
});

type EvaluationLLMResponse = z.infer<typeof evaluationSchema>;

async function buildLLMEvaluation(
  input: ResponseEvaluationInput,
): Promise<EvaluationLLMResponse> {
  const client = getAzureOpenAIClient();
  const deployment = getOpenAIDeployment();

  const nonVerbalSummary = input.nonVerbalSignals
    ?.map((signal) => `${signal.label}: ${signal.score}/10${signal.notes ? ` (${signal.notes})` : ""}`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: deployment,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "mba_interview_evaluation",
        schema: {
          type: "object",
          required: ["overall_commentary", "strengths", "improvements", "rubric_scores"],
          additionalProperties: false,
          properties: {
            overall_commentary: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            rubric_scores: {
              type: "object",
              additionalProperties: { type: "number" },
            },
            tone_analysis: { type: "string" },
            non_verbal_analysis: { type: "string" },
          },
        },
      },
    },
    messages: [
      {
        role: "system",
        content: [
          "You are an admissions interviewer for top MBA programs.",
          "Provide concise, actionable feedback on the candidate's response.",
          "Score rubric dimensions from 1-10 with decimals allowed.",
          "Be direct and data-driven. Do not invent facts.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          `Question category: ${input.question.category}`,
          `Prompt: ${input.question.prompt}`,
          `Candidate transcript:\n${input.speech.transcript}`,
          `Filler words: ${input.speech.fillerWordCount}`,
          `Speaking rate (words per minute): ${input.speech.speakingRateWpm}`,
          input.speech.averagePitchHz
            ? `Average pitch (Hz): ${input.speech.averagePitchHz}`
            : null,
          input.speech.sentiment ? `Detected sentiment: ${input.speech.sentiment}` : null,
          input.speech.confidence ? `ASR confidence: ${input.speech.confidence}` : null,
          nonVerbalSummary ? `Non-verbal cues:\n${nonVerbalSummary}` : null,
          input.profile.summaryBullets.length
            ? `Candidate highlights:\n${input.profile.summaryBullets.join("\n")}`
            : null,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Azure OpenAI returned an empty response for evaluation.");
  }

  const parsedJson = JSON.parse(content) as EvaluationLLMResponse;
  const parsed = evaluationSchema.safeParse(parsedJson);

  if (!parsed.success) {
    throw new Error(`Failed to parse evaluation JSON: ${parsed.error.message}`);
  }

  return parsed.data;
}

export async function evaluateResponse(
  input: ResponseEvaluationInput,
): Promise<ResponseEvaluation> {
  const evaluation = await buildLLMEvaluation(input);

  return {
    questionId: input.question.id,
    transcript: input.speech.transcript,
    toneAnalysis: evaluation.tone_analysis,
    nonVerbalAnalysis: evaluation.non_verbal_analysis,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    scores: evaluation.rubric_scores,
  };
}

export async function compileInterviewEvaluation(
  inputs: ResponseEvaluationInput[],
): Promise<InterviewEvaluation> {
  const evaluations = await Promise.all(inputs.map((input) => evaluateResponse(input)));

  const rubricAccumulator = new Map<string, number[]>();

  evaluations.forEach((evaluation) => {
    Object.entries(evaluation.scores).forEach(([dimension, score]) => {
      if (!rubricAccumulator.has(dimension)) {
        rubricAccumulator.set(dimension, []);
      }
      rubricAccumulator.get(dimension)?.push(score);
    });
  });

  const rubricScores: Record<string, number> = {};

  rubricAccumulator.forEach((scores, dimension) => {
    const aggregate =
      scores.reduce((sum, current) => sum + current, 0) / Math.max(scores.length, 1);
    rubricScores[dimension] = Number(aggregate.toFixed(2));
  });

  const overallScoreValues = Object.values(rubricScores);
  const overallScore =
    overallScoreValues.length > 0
      ? Number(
          (
            overallScoreValues.reduce((sum, current) => sum + current, 0) /
            overallScoreValues.length
          ).toFixed(2),
        )
      : 0;

  return {
    overallScore,
    rubricScores,
    responses: evaluations,
  };
}
