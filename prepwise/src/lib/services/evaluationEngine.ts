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
  // Coerce string numbers to numbers (LLM sometimes returns numbers as strings in JSON)
  // Use transform to handle NaN cases and validate/clamp values
  rubric_scores: z.record(
    z.string(), // Key schema (dimension names)
    z
      .union([z.number(), z.string()])
      .transform((val) => {
        // Convert to number
        const numVal = typeof val === "string" ? parseFloat(val) : val;
        
        // Validate the number
        if (isNaN(numVal) || !isFinite(numVal)) {
          console.warn(`Invalid rubric score detected during validation: ${val}, using default 5.0`);
          return 5.0;
        }
        
        // Clamp to [0, 10]
        return Math.max(0, Math.min(10, numVal));
      })
      .pipe(z.number().min(0).max(10)),
  ),
  tone_analysis: z.string().optional(),
  non_verbal_analysis: z.string().optional(),
  communication_clarity: z.string().optional(),
  confidence_analysis: z.string().optional(),
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

  // Use JSON mode for better compatibility with API versions
  const jsonSchemaPrompt = `You must return a valid JSON object with this exact structure:
{
  "overall_commentary": "string - comprehensive analysis of the response",
  "strengths": ["string"] - 3-5 specific strengths,
  "improvements": ["string"] - 3-5 actionable areas for improvement,
  "rubric_scores": {
    "Leadership": 8.5,
    "Communication": 7.5,
    "Clarity": 8.0,
    "Impact": 7.0,
    "Fit": 8.5
  },
  "tone_analysis": "REQUIRED - detailed analysis of vocal tone, confidence, engagement, and professionalism. Analyze pitch variation, enthusiasm, and vocal delivery style.",
  "communication_clarity": "REQUIRED - analysis of how clearly the candidate communicated their ideas. Evaluate structure, articulation, use of filler words, and ability to convey complex thoughts simply.",
  "confidence_analysis": "REQUIRED - assessment of confidence level and presence. Evaluate vocal authority, composure, self-assurance, and overall presentation confidence.",
  "non_verbal_analysis": "string - analysis of non-verbal cues if data available (eye contact, presence, composure, engagement level)"
}

REQUIRED FIELDS:
- tone_analysis: MUST provide detailed analysis of vocal tone, confidence, engagement, and professionalism
- communication_clarity: MUST provide analysis of communication clarity, structure, and articulation
- confidence_analysis: MUST provide assessment of confidence level and presence

CRITICAL RUBRIC SCORING REQUIREMENTS:
- All values in "rubric_scores" MUST be VALID NUMBERS (not strings, not NaN, not null, not undefined, not Infinity)
- Use NUMERIC values like 8.5, 7.0, 9.2, NOT "8.5" or "7.0" or null or undefined
- Each score MUST be between 0 and 10 (inclusive)
- VALID examples: 8.5, 7.0, 9.2, 6.5, 8.0, 7.5, 5.0
- INVALID examples: "8.5", null, undefined, NaN, "high", "medium", Infinity, "N/A"
- If you cannot determine a score, ALWAYS use 5.0 (a number, not a string)
- NEVER use null, undefined, NaN, Infinity, or string values for rubric scores
- The JSON must have exactly 5 scores: Leadership, Communication, Clarity, Impact, Fit
- Each score must be a valid number that can be parsed and is between 0 and 10

Return ONLY valid JSON. No markdown, no code blocks, no explanations.`;

  const response = await client.chat.completions.create({
    model: deployment,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You are an elite MBA admissions interviewer and coach with expertise in evaluating candidates for top-tier business schools.",
          "Your role is to provide comprehensive, actionable feedback that helps candidates understand their strengths and areas for improvement.",
          "",
          "EVALUATION FRAMEWORK:",
          "1. CONTENT ANALYSIS:",
          "   - STAR method structure (Situation, Task, Action, Result)",
          "   - Quantifiable outcomes and impact metrics",
          "   - Relevance to the question asked",
          "   - Depth of insight and self-awareness",
          "",
          "2. COMMUNICATION CLARITY:",
          "   - Structure and organization of response",
          "   - Clarity of expression and articulation",
          "   - Ability to convey complex ideas simply",
          "   - Use of filler words and verbal crutches",
          "",
          "3. TONE & CONFIDENCE:",
          "   - Vocal confidence and authority",
          "   - Appropriate enthusiasm and engagement",
          "   - Professional demeanor",
          "   - Speaking pace (ideal: 140-160 words/minute)",
          "   - Pitch variation (monotone vs. engaging)",
          "",
          "4. NON-VERBAL CUES:",
          "   - Eye contact and focus",
          "   - Presence and composure",
          "   - Engagement level",
          "",
          "SCORING GUIDELINES:",
          "- Score each rubric dimension from 1-10 (decimals allowed)",
          "- 9-10: Exceptional, admission-competitive",
          "- 7-8: Strong, with minor improvements needed",
          "- 5-6: Adequate, significant room for growth",
          "- 3-4: Weak, needs substantial work",
          "- 1-2: Very weak, fundamental issues",
          "",
          "FEEDBACK STYLE:",
          "- Be specific and actionable - cite exact moments or examples",
          "- Balance criticism with strengths",
          "- Provide concrete suggestions for improvement",
          "- Reference the candidate's background when relevant",
          "- Be direct but constructive",
          "",
          "Return valid JSON only. Be precise and detailed in your analysis.",
          "",
          jsonSchemaPrompt,
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          "=== INTERVIEW QUESTION ===",
          `Category: ${input.question.category}`,
          `Question: ${input.question.prompt}`,
          input.question.rubricFocus?.length
            ? `Focus Areas: ${input.question.rubricFocus.join(", ")}`
            : null,
          "",
          "=== CANDIDATE RESPONSE ===",
          `Transcript:\n${input.speech.transcript || "[No transcript available]"}`,
          "",
          "=== SPEECH ANALYTICS ===",
          `Speaking Rate: ${input.speech.speakingRateWpm || "N/A"} words per minute`,
          `Filler Words: ${input.speech.fillerWordCount || 0}`,
          input.speech.averagePitchHz
            ? `Average Pitch: ${input.speech.averagePitchHz} Hz`
            : null,
          input.speech.sentiment ? `Sentiment: ${input.speech.sentiment}` : null,
          input.speech.confidence
            ? `Speech Recognition Confidence: ${(input.speech.confidence * 100).toFixed(1)}%`
            : null,
          "",
          "=== NON-VERBAL ANALYSIS ===",
          nonVerbalSummary || "No non-verbal data available",
          "",
          "=== CANDIDATE CONTEXT ===",
          input.profile.summaryBullets.length
            ? `Background Highlights:\n${input.profile.summaryBullets.slice(0, 5).join("\n")}`
            : "No background context",
          "",
          "=== EVALUATION REQUEST ===",
          "Provide a comprehensive evaluation as a JSON object. You MUST include all of the following:",
          "",
          "1. overall_commentary: Comprehensive analysis of response quality",
          "2. strengths: Array of 3-5 specific strengths",
          "3. improvements: Array of 3-5 actionable improvement areas",
          "4. rubric_scores: Object with NUMERIC scores for Leadership, Communication, Clarity, Impact, Fit (each 1-10). Use numbers like 8.5, 7.0, NOT strings like \"8.5\"",
          "",
          "REQUIRED ANALYSIS FIELDS (Must provide detailed analysis for each - 2-4 sentences minimum):",
          "5. tone_analysis: REQUIRED - Detailed analysis of vocal tone, confidence, engagement, and professionalism. Analyze pitch variation, enthusiasm level, vocal delivery style, and professional demeanor based on the speech analytics provided.",
          "6. communication_clarity: REQUIRED - Analysis of how clearly ideas were communicated. Evaluate response structure, articulation quality, use of filler words, ability to convey complex thoughts simply, and overall clarity of expression.",
          "7. confidence_analysis: REQUIRED - Assessment of confidence level and presence. Evaluate vocal authority, composure under pressure, self-assurance, speaking pace control, and overall presentation confidence.",
          "8. non_verbal_analysis: Analysis of non-verbal cues based on available data (eye contact metrics, presence, composure, engagement level)",
          "",
          "CRITICAL: For rubric_scores, you MUST provide VALID NUMERIC VALUES (0-10) for each dimension:",
          "- Leadership: A number between 0 and 10 (e.g., 8.5, 7.0, 9.2)",
          "- Communication: A number between 0 and 10 (e.g., 7.5, 8.0, 6.5)",
          "- Clarity: A number between 0 and 10 (e.g., 8.0, 7.5, 9.0)",
          "- Impact: A number between 0 and 10 (e.g., 7.0, 8.5, 6.0)",
          "- Fit: A number between 0 and 10 (e.g., 8.5, 7.5, 9.0)",
          "- DO NOT use strings, null, undefined, NaN, or Infinity",
          "- DO NOT omit any of the five dimensions",
          "- If uncertain, use a score between 5.0 and 8.0",
          "",
          "IMPORTANT: For tone_analysis, communication_clarity, and confidence_analysis, provide detailed, specific feedback (2-4 sentences each) that helps the candidate understand their performance and areas for improvement.",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Azure OpenAI returned an empty response for evaluation.");
  }

  // Clean the content - remove markdown code blocks if present
  let cleanedContent = content.trim();
  if (cleanedContent.startsWith("```json")) {
    cleanedContent = cleanedContent.replace(/^```json\s*/i, "").replace(/\s*```\s*$/, "");
  } else if (cleanedContent.startsWith("```")) {
    cleanedContent = cleanedContent.replace(/^```\s*/, "").replace(/\s*```\s*$/, "");
  }
  cleanedContent = cleanedContent.trim();

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error("Failed to parse evaluation JSON:", parseError);
    console.error("Response content:", cleanedContent.substring(0, 500));
    throw new Error(
      `Failed to parse evaluation JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
    );
  }

  // Preprocess rubric_scores to convert string numbers to actual numbers
  // This handles cases where the LLM returns numbers as strings or invalid values
  if (parsedJson && typeof parsedJson === "object" && "rubric_scores" in parsedJson) {
    const rubricScores = (parsedJson as { rubric_scores?: Record<string, unknown> }).rubric_scores;
    if (rubricScores && typeof rubricScores === "object") {
      const processedScores: Record<string, number> = {};
      for (const [key, value] of Object.entries(rubricScores)) {
        // Convert to number based on type with comprehensive validation
        let numValue: number;
        
        if (value === null || value === undefined) {
          // Handle null/undefined explicitly
          console.warn(`Rubric score for ${key} is null/undefined, using default 5.0`);
          processedScores[key] = 5.0;
          continue; // Skip to next iteration
        } else if (typeof value === "string") {
          const trimmed = String(value).trim();
          // Try parsing as float first
          numValue = parseFloat(trimmed);
          // Check if parseFloat failed
          if (isNaN(numValue) || !isFinite(numValue)) {
            // Try parseInt as fallback
            const intValue = parseInt(trimmed, 10);
            if (!isNaN(intValue) && isFinite(intValue)) {
              numValue = intValue;
            } else {
              // Invalid string - use default
              console.warn(`Invalid rubric score string for ${key}: "${trimmed}", using default 5.0`);
              processedScores[key] = 5.0;
              continue;
            }
          }
        } else if (typeof value === "number") {
          // Check if it's a valid number (not NaN, not Infinity)
          if (isNaN(value) || !isFinite(value)) {
            console.warn(`Invalid rubric score number for ${key}: ${value}, using default 5.0`);
            processedScores[key] = 5.0;
            continue;
          }
          numValue = value;
        } else {
          // Try to convert other types
          const converted = Number(value);
          if (isNaN(converted) || !isFinite(converted)) {
            console.warn(`Invalid rubric score type for ${key}: ${typeof value} (${value}), using default 5.0`);
            processedScores[key] = 5.0;
            continue;
          }
          numValue = converted;
        }
        
        // Final validation and clamping
        if (typeof numValue !== "number" || isNaN(numValue) || !isFinite(numValue)) {
          // This should never happen due to checks above, but just in case
          console.error(`Unexpected invalid rubric score for ${key}: ${numValue}, using default 5.0`);
          processedScores[key] = 5.0;
        } else if (numValue < 0) {
          console.warn(`Rubric score for ${key} below minimum: ${numValue}, clamping to 0`);
          processedScores[key] = 0;
        } else if (numValue > 10) {
          console.warn(`Rubric score for ${key} above maximum: ${numValue}, clamping to 10`);
          processedScores[key] = 10;
        } else {
          // Valid score - round to 2 decimal places
          processedScores[key] = Math.round(numValue * 100) / 100;
        }
      }
      // Validate that we have all required dimensions
      const requiredDimensions = ["Leadership", "Communication", "Clarity", "Impact", "Fit"];
      for (const dimension of requiredDimensions) {
        if (!(dimension in processedScores)) {
          console.warn(`Missing required rubric dimension: ${dimension}, using default 5.0`);
          processedScores[dimension] = 5.0;
        }
      }
      
      (parsedJson as { rubric_scores: Record<string, number> }).rubric_scores = processedScores;
      
      // Log the processed scores for debugging
      console.log(`Processed rubric scores:`, JSON.stringify(processedScores, null, 2));
    } else {
      // No rubric_scores object found - create default scores
      console.warn("No rubric_scores found in response, creating default scores");
      (parsedJson as { rubric_scores: Record<string, number> }).rubric_scores = {
        Leadership: 5.0,
        Communication: 5.0,
        Clarity: 5.0,
        Impact: 5.0,
        Fit: 5.0,
      };
    }
  } else {
    // No rubric_scores in parsedJson - create default scores
    console.warn("rubric_scores missing from parsed JSON, creating default scores");
    if (parsedJson && typeof parsedJson === "object") {
      (parsedJson as { rubric_scores: Record<string, number> }).rubric_scores = {
        Leadership: 5.0,
        Communication: 5.0,
        Clarity: 5.0,
        Impact: 5.0,
        Fit: 5.0,
      };
    }
  }

  const parsed = evaluationSchema.safeParse(parsedJson);

  if (!parsed.success) {
    console.error("Schema validation failed:", parsed.error);
    console.error("Parsed JSON (first 1000 chars):", JSON.stringify(parsedJson, null, 2).substring(0, 1000));
    
    // Try to provide a more helpful error message
    // Use error.issues which is the correct property for ZodError
    const issues = parsed.error?.issues;
    const errorDetails = issues && Array.isArray(issues)
      ? issues.map((err) => {
          const path = err?.path ? err.path.join(".") : "unknown";
          const message = err?.message || "Unknown error";
          return `Path: ${path} - ${message}`;
        }).join("; ")
      : parsed.error?.message || "Unknown validation error";
    
    throw new Error(`Failed to validate evaluation JSON: ${errorDetails}`);
  }

  return parsed.data;
}

export async function evaluateResponse(
  input: ResponseEvaluationInput,
): Promise<ResponseEvaluation> {
  const evaluation = await buildLLMEvaluation(input);

  // Validate that required analysis fields are present
  // Log warnings if they're missing (but don't fail - allow evaluation to continue)
  if (!evaluation.tone_analysis) {
    console.warn(`Missing tone_analysis for question ${input.question.id}`);
  }
  if (!evaluation.communication_clarity) {
    console.warn(`Missing communication_clarity for question ${input.question.id}`);
  }
  if (!evaluation.confidence_analysis) {
    console.warn(`Missing confidence_analysis for question ${input.question.id}`);
  }

  return {
    questionId: input.question.id,
    transcript: input.speech.transcript,
    toneAnalysis: evaluation.tone_analysis ?? "Tone analysis not available for this response.",
    nonVerbalAnalysis: evaluation.non_verbal_analysis,
    communicationClarity: evaluation.communication_clarity ?? "Communication clarity analysis not available for this response.",
    confidenceAnalysis: evaluation.confidence_analysis ?? "Confidence analysis not available for this response.",
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    scores: evaluation.rubric_scores as Record<string, number>,
  };
}

export async function compileInterviewEvaluation(
  inputs: ResponseEvaluationInput[],
): Promise<InterviewEvaluation> {
  // Validate inputs
  if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
    throw new Error("No evaluation inputs provided");
  }

  const evaluations = await Promise.all(inputs.map((input) => evaluateResponse(input)));

  const rubricAccumulator = new Map<string, number[]>();

  evaluations.forEach((evaluation) => {
    // Ensure evaluation has scores
    if (!evaluation || !evaluation.scores || typeof evaluation.scores !== "object") {
      console.warn(`Evaluation missing scores for question ${evaluation?.questionId || "unknown"}, skipping`);
      return;
    }

    Object.entries(evaluation.scores).forEach(([dimension, score]) => {
      // Validate score is a number
      if (typeof score !== "number" || isNaN(score)) {
        console.warn(`Invalid score for ${dimension}: ${score}, skipping`);
        return;
      }

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
