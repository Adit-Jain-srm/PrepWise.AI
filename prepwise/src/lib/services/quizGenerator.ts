import { z } from "zod";
import { getAzureOpenAIClient, getOpenAIDeployment } from "../azure/openai";
import { QuizQuestion } from "../types/user";

const quizQuestionSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      type: z.enum(["multiple-choice", "true-false", "short-answer"]),
      options: z.array(z.string()).optional(),
      correctAnswer: z.union([z.string(), z.array(z.string())]),
      explanation: z.string().optional(),
    }),
  ).min(5).max(20),
});

type QuizLLMResponse = z.infer<typeof quizQuestionSchema>;

function createQuizSystemPrompt(
  category: string,
  difficulty: "beginner" | "intermediate" | "advanced",
  questionCount: number,
): string {
  return `You are an expert MBA interview preparation coach. Generate ${questionCount} high-quality quiz questions for MBA interview preparation.

Category: ${category}
Difficulty: ${difficulty}

Requirements:
1. Generate exactly ${questionCount} questions
2. Mix question types: 60% multiple-choice, 20% true-false, 20% short-answer
3. For multiple-choice: Provide 4 options with exactly one correct answer
4. For true-false: Simple true/false questions
5. For short-answer: Questions requiring brief written responses (1-2 sentences)
6. All questions should be relevant to MBA interview preparation
7. Include explanations for correct answers
8. Questions should test knowledge of:
   - Interview best practices
   - STAR method and behavioral questions
   - Leadership scenarios
   - School-specific knowledge (if applicable)
   - Communication skills
   - Case study approaches

Return a JSON object with this structure:
{
  "questions": [
    {
      "id": "unique-id",
      "question": "Question text",
      "type": "multiple-choice" | "true-false" | "short-answer",
      "options": ["Option A", "Option B", "Option C", "Option D"], // Only for multiple-choice
      "correctAnswer": "correct answer or array for multiple correct",
      "explanation": "Why this answer is correct"
    }
  ]
}`;
}

export async function generateQuizQuestions(
  category: string,
  difficulty: "beginner" | "intermediate" | "advanced",
  questionCount: number = 10,
): Promise<QuizQuestion[]> {
  const client = getAzureOpenAIClient();
  const deployment = getOpenAIDeployment();

  const systemPrompt = createQuizSystemPrompt(category, difficulty, questionCount);

  const userPrompt = `Generate ${questionCount} ${difficulty} level quiz questions about ${category} for MBA interview preparation.`;

  try {
    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Invalid JSON response from OpenAI");
    }

    const validated = quizQuestionSchema.parse(parsed);

    return validated.questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || `The correct answer is: ${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : q.correctAnswer}`,
    }));
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    throw new Error(
      `Failed to generate quiz questions: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

