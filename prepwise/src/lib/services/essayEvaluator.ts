import { z } from "zod";
import { getAzureOpenAIClient, getOpenAIDeployment } from "../azure/openai";
import { EssayPrompt, EssayEvaluation, CandidateProfile } from "../types/interview";

export type EssayEvaluationInput = {
  sessionId: string;
  essayPrompt: EssayPrompt;
  essayContent: string;
  profile: CandidateProfile;
};

const essayEvaluationSchema = z.object({
  overall_commentary: z.string(),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  // Coerce string numbers to numbers (LLM sometimes returns numbers as strings in JSON)
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
  writing_clarity: z.string().optional(),
  structure_analysis: z.string().optional(),
  depth_analysis: z.string().optional(),
});

type EssayEvaluationLLMResponse = z.infer<typeof essayEvaluationSchema>;

function profileToEssayContext(profile: CandidateProfile): string {
  const highlights: string[] = [];

  if (profile.fullName) {
    highlights.push(`Name: ${profile.fullName}`);
  }

  if (profile.currentRole) {
    highlights.push(`Current Role: ${profile.currentRole}`);
  }

  if (profile.totalExperienceYears !== undefined) {
    highlights.push(`Experience: ${profile.totalExperienceYears} years`);
  }

  if (profile.summaryBullets.length > 0) {
    highlights.push(`Summary: ${profile.summaryBullets.join("; ")}`);
  }

  if (profile.keywords.length > 0) {
    highlights.push(`Key Strengths: ${profile.keywords.join(", ")}`);
  }

  return highlights.join("\n");
}

async function buildEssayEvaluation(input: EssayEvaluationInput): Promise<EssayEvaluationLLMResponse> {
  const client = getAzureOpenAIClient();
  const deployment = getOpenAIDeployment();

  const wordCount = input.essayContent.trim().split(/\s+/).filter(Boolean).length;
  const profileContext = profileToEssayContext(input.profile);

  // Use JSON mode for better compatibility with API versions
  const jsonSchemaPrompt = `You must return a valid JSON object with this exact structure:
{
  "overall_commentary": "string - comprehensive analysis of the essay",
  "strengths": ["string"] - 3-5 specific strengths,
  "improvements": ["string"] - 3-5 actionable areas for improvement,
  "rubric_scores": {
    "Writing Quality": 8.5,
    "Clarity": 7.5,
    "Structure": 8.0,
    "Depth": 7.0,
    "Impact": 8.5
  },
  "writing_clarity": "REQUIRED - analysis of writing clarity, grammar, word choice, and readability",
  "structure_analysis": "REQUIRED - analysis of essay structure, organization, flow, and coherence",
  "depth_analysis": "REQUIRED - assessment of depth of thought, self-reflection, and insightfulness"
}

REQUIRED FIELDS:
- writing_clarity: MUST provide detailed analysis of writing clarity, grammar, word choice, and readability
- structure_analysis: MUST provide analysis of essay structure, organization, flow, and coherence
- depth_analysis: MUST provide assessment of depth of thought, self-reflection, and insightfulness

CRITICAL RUBRIC SCORING REQUIREMENTS:
- All values in "rubric_scores" MUST be VALID NUMBERS (not strings, not NaN, not null, not undefined, not Infinity)
- Use NUMERIC values like 8.5, 7.0, 9.2, NOT "8.5" or "7.0" or null or undefined
- Each score MUST be between 0 and 10 (inclusive)
- VALID examples: 8.5, 7.0, 9.2, 6.5, 8.0, 7.5, 5.0
- INVALID examples: "8.5", null, undefined, NaN, "high", "medium", Infinity, "N/A"
- If you cannot determine a score, ALWAYS use 5.0 (a number, not a string)
- NEVER use null, undefined, NaN, Infinity, or string values for rubric scores
- The JSON must have scores for: Writing Quality, Clarity, Structure, Depth, Impact
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
          "You are an elite MBA admissions essay reviewer with deep expertise in evaluating written submissions for top-tier business schools.",
          "Your role is to provide comprehensive, actionable feedback that helps candidates understand their strengths and areas for improvement.",
          "",
          "ESSAY EVALUATION FRAMEWORK:",
          "1. WRITING QUALITY:",
          "   - Grammar, syntax, and mechanics",
          "   - Word choice and vocabulary",
          "   - Sentence variety and flow",
          "   - Professional tone and style",
          "",
          "2. CLARITY:",
          "   - Readability and comprehension",
          "   - Precision of expression",
          "   - Ability to convey complex ideas simply",
          "   - Clarity of message and purpose",
          "",
          "3. STRUCTURE:",
          "   - Organization and logical flow",
          "   - Paragraph structure and transitions",
          "   - Introduction and conclusion effectiveness",
          "   - Overall coherence and unity",
          "",
          "4. DEPTH:",
          "   - Depth of thought and reflection",
          "   - Self-awareness and introspection",
          "   - Insightfulness and originality",
          "   - Ability to connect experiences to larger themes",
          "",
          "5. IMPACT:",
          "   - Memorable and compelling content",
          "   - Emotional resonance",
          "   - Ability to differentiate the candidate",
          "   - Alignment with MBA program values",
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
          "- Be specific and actionable - cite exact examples",
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
          "=== ESSAY PROMPT ===",
          input.essayPrompt.prompt,
          `Target Word Count: ${input.essayPrompt.targetWordCount} words`,
          "",
          "=== CANDIDATE ESSAY ===",
          input.essayContent,
          "",
          "=== ESSAY METADATA ===",
          `Word Count: ${wordCount} words`,
          `Target: ${input.essayPrompt.targetWordCount} words`,
          wordCount < input.essayPrompt.targetWordCount * 0.8
            ? `⚠️ Warning: Essay is below minimum word count (${Math.floor(input.essayPrompt.targetWordCount * 0.8)} words)`
            : wordCount > 500
              ? "⚠️ Warning: Essay exceeds maximum word count (500 words)"
              : "✓ Word count is within acceptable range",
          "",
          "=== CANDIDATE CONTEXT ===",
          profileContext || "No background context",
          "",
          "=== EVALUATION REQUEST ===",
          "Provide a comprehensive evaluation as a JSON object. You MUST include all of the following:",
          "",
          "1. overall_commentary: Comprehensive analysis of essay quality",
          "2. strengths: Array of 3-5 specific strengths",
          "3. improvements: Array of 3-5 actionable improvement areas",
          "4. rubric_scores: Object with VALID NUMERIC scores for Writing Quality, Clarity, Structure, Depth, Impact (each 0-10).",
          "   - MUST be actual numbers (not strings, not null, not NaN): 8.5, 7.0, 9.2",
          "   - Each score MUST be between 0 and 10 (inclusive)",
          "   - Invalid examples: \"8.5\", null, undefined, NaN, \"high\"",
          "   - Valid examples: 8.5, 7.0, 9.2, 6.5, 8.0",
          "",
          "REQUIRED ANALYSIS FIELDS (Must provide detailed analysis for each - 2-4 sentences minimum):",
          "5. writing_clarity: REQUIRED - Detailed analysis of writing clarity, grammar, word choice, and readability. Evaluate sentence structure, vocabulary, and overall writing quality.",
          "6. structure_analysis: REQUIRED - Analysis of essay structure, organization, flow, and coherence. Evaluate paragraph structure, transitions, and overall organization.",
          "7. depth_analysis: REQUIRED - Assessment of depth of thought, self-reflection, and insightfulness. Evaluate the level of introspection and ability to connect experiences to larger themes.",
          "",
          "IMPORTANT: For writing_clarity, structure_analysis, and depth_analysis, provide detailed, specific feedback (2-4 sentences each) that helps the candidate understand their performance and areas for improvement.",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Azure OpenAI returned an empty response for essay evaluation.");
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
    console.error("Failed to parse essay evaluation JSON:", parseError);
    console.error("Response content:", cleanedContent.substring(0, 500));
    throw new Error(
      `Failed to parse essay evaluation JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
    );
  }

  // Preprocess rubric_scores to convert string numbers to actual numbers
  if (parsedJson && typeof parsedJson === "object" && "rubric_scores" in parsedJson) {
    const rubricScores = (parsedJson as { rubric_scores?: Record<string, unknown> }).rubric_scores;
    if (rubricScores && typeof rubricScores === "object") {
      const processedScores: Record<string, number> = {};
      for (const [key, value] of Object.entries(rubricScores)) {
        // Convert to number based on type with comprehensive validation
        let numValue: number;
        
        if (value === null || value === undefined) {
          console.warn(`Rubric score for ${key} is null/undefined, using default 5.0`);
          processedScores[key] = 5.0;
          continue;
        } else if (typeof value === "string") {
          const trimmed = String(value).trim();
          numValue = parseFloat(trimmed);
          if (isNaN(numValue) || !isFinite(numValue)) {
            const intValue = parseInt(trimmed, 10);
            if (!isNaN(intValue) && isFinite(intValue)) {
              numValue = intValue;
            } else {
              console.warn(`Invalid rubric score string for ${key}: "${trimmed}", using default 5.0`);
              processedScores[key] = 5.0;
              continue;
            }
          }
        } else if (typeof value === "number") {
          if (isNaN(value) || !isFinite(value)) {
            console.warn(`Invalid rubric score number for ${key}: ${value}, using default 5.0`);
            processedScores[key] = 5.0;
            continue;
          }
          numValue = value;
        } else {
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
          console.error(`Unexpected invalid rubric score for ${key}: ${numValue}, using default 5.0`);
          processedScores[key] = 5.0;
        } else if (numValue < 0) {
          console.warn(`Rubric score for ${key} below minimum: ${numValue}, clamping to 0`);
          processedScores[key] = 0;
        } else if (numValue > 10) {
          console.warn(`Rubric score for ${key} above maximum: ${numValue}, clamping to 10`);
          processedScores[key] = 10;
        } else {
          processedScores[key] = Math.round(numValue * 100) / 100;
        }
      }
      
      // Validate that we have all required dimensions
      const requiredDimensions = ["Writing Quality", "Clarity", "Structure", "Depth", "Impact"];
      for (const dimension of requiredDimensions) {
        if (!(dimension in processedScores)) {
          console.warn(`Missing required rubric dimension: ${dimension}, using default 5.0`);
          processedScores[dimension] = 5.0;
        }
      }
      
      (parsedJson as { rubric_scores: Record<string, number> }).rubric_scores = processedScores;
      
      console.log(`Processed essay rubric scores:`, JSON.stringify(processedScores, null, 2));
    } else {
      console.warn("No rubric_scores found in essay response, creating default scores");
      (parsedJson as { rubric_scores: Record<string, number> }).rubric_scores = {
        "Writing Quality": 5.0,
        "Clarity": 5.0,
        "Structure": 5.0,
        "Depth": 5.0,
        "Impact": 5.0,
      };
    }
  } else {
    console.warn("rubric_scores missing from parsed essay JSON, creating default scores");
    if (parsedJson && typeof parsedJson === "object") {
      (parsedJson as { rubric_scores: Record<string, number> }).rubric_scores = {
        "Writing Quality": 5.0,
        "Clarity": 5.0,
        "Structure": 5.0,
        "Depth": 5.0,
        "Impact": 5.0,
      };
    }
  }

  // Additional safety check: ensure rubric_scores doesn't contain any NaN values before validation
  if (parsedJson && typeof parsedJson === "object" && "rubric_scores" in parsedJson) {
    const rubricScores = (parsedJson as { rubric_scores?: Record<string, unknown> }).rubric_scores;
    if (rubricScores && typeof rubricScores === "object") {
      for (const [key, value] of Object.entries(rubricScores)) {
        if (typeof value === "number" && (isNaN(value) || !isFinite(value))) {
          console.error(`Found NaN or Infinity in rubric_scores.${key}: ${value}, replacing with 5.0`);
          (rubricScores as Record<string, unknown>)[key] = 5.0;
        }
      }
    }
  }

  const parsed = essayEvaluationSchema.safeParse(parsedJson);

  if (!parsed.success) {
    console.error("Schema validation failed:", parsed.error);
    console.error("Parsed JSON (first 2000 chars):", JSON.stringify(parsedJson, null, 2).substring(0, 2000));
    
    // Check if the issue is with rubric_scores containing NaN
    if (parsedJson && typeof parsedJson === "object" && "rubric_scores" in parsedJson) {
      const rubricScores = (parsedJson as { rubric_scores?: Record<string, unknown> }).rubric_scores;
      if (rubricScores) {
        console.error("Rubric scores that failed validation:", JSON.stringify(rubricScores, null, 2));
        // Try to fix NaN values one more time
        let fixedAny = false;
        for (const [key, value] of Object.entries(rubricScores)) {
          if (typeof value === "number" && (isNaN(value) || !isFinite(value))) {
            console.error(`Fixing NaN/Infinity in ${key}: ${value} -> 5.0`);
            (rubricScores as Record<string, unknown>)[key] = 5.0;
            fixedAny = true;
          }
        }
        // Try parsing again after fixing
        if (fixedAny) {
          const retryParsed = essayEvaluationSchema.safeParse(parsedJson);
          if (retryParsed.success) {
            console.log("Successfully fixed essay rubric scores and re-validated");
            return retryParsed.data;
          }
        }
      }
    }
    
    // Try to provide a more helpful error message
    const issues = parsed.error?.issues;
    const errorDetails = issues && Array.isArray(issues)
      ? issues.map((err) => {
          const path = err?.path ? err.path.join(".") : "unknown";
          const message = err?.message || "Unknown error";
          return `Path: ${path} - ${message}`;
        }).join("; ")
      : parsed.error?.message || "Unknown validation error";
    
    throw new Error(`Failed to validate essay evaluation JSON: ${errorDetails}`);
  }

  return parsed.data;
}

export async function evaluateEssay(input: EssayEvaluationInput): Promise<EssayEvaluation> {
  const evaluation = await buildEssayEvaluation(input);

  // Validate that required analysis fields are present
  if (!evaluation.writing_clarity) {
    console.warn(`Missing writing_clarity for essay ${input.essayPrompt.id}`);
  }
  if (!evaluation.structure_analysis) {
    console.warn(`Missing structure_analysis for essay ${input.essayPrompt.id}`);
  }
  if (!evaluation.depth_analysis) {
    console.warn(`Missing depth_analysis for essay ${input.essayPrompt.id}`);
  }

  const wordCount = input.essayContent.trim().split(/\s+/).filter(Boolean).length;

  return {
    essayId: input.essayPrompt.id,
    prompt: input.essayPrompt.prompt,
    content: input.essayContent,
    wordCount,
    writingClarity: evaluation.writing_clarity ?? "Writing clarity analysis not available for this essay.",
    structureAnalysis: evaluation.structure_analysis ?? "Structure analysis not available for this essay.",
    depthAnalysis: evaluation.depth_analysis ?? "Depth analysis not available for this essay.",
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    scores: evaluation.rubric_scores as Record<string, number>,
  };
}

export async function evaluateEssays(inputs: EssayEvaluationInput[]): Promise<EssayEvaluation[]> {
  if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
    return [];
  }

  return Promise.all(inputs.map((input) => evaluateEssay(input)));
}

