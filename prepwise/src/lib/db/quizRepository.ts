import crypto from "node:crypto";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabaseAdmin";
import { Quiz, QuizQuestion, QuizAttempt } from "../types/user";

type QuizRecord = {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  questions_json: QuizQuestion[];
  correct_answers_json: Record<string, string | string[]>;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_premium: boolean;
};

type QuizAttemptRecord = {
  id: string;
  user_id: string;
  quiz_id: string;
  answers_json: Record<string, string>;
  score: number;
  time_taken_seconds: number;
  completed_at: string;
  created_at: string;
};

const inMemoryStore = {
  quizzes: new Map<string, QuizRecord>(),
  quizAttempts: new Map<string, QuizAttemptRecord>(),
};

export async function saveQuiz(
  title: string,
  description: string | undefined,
  category: string,
  difficulty: "beginner" | "intermediate" | "advanced",
  questions: QuizQuestion[],
  isPremium: boolean = false,
  existingQuizId?: string,
): Promise<string> {
  const quizId = existingQuizId || crypto.randomUUID();
  const now = new Date().toISOString();

  // Create correct answers map
  const correctAnswers: Record<string, string | string[]> = {};
  questions.forEach((q) => {
    correctAnswers[q.id] = q.correctAnswer;
  });

  const record: QuizRecord = {
    id: quizId,
    title,
    description,
    category,
    difficulty,
    questions_json: questions,
    correct_answers_json: correctAnswers,
    created_at: now,
    updated_at: now,
    is_active: true,
    is_premium: isPremium,
  };

  if (!isSupabaseConfigured()) {
    inMemoryStore.quizzes.set(quizId, record);
    return quizId;
  }

  try {
    const supabase = getSupabaseAdmin();

    // Check if quiz already exists (in case we're updating an existing quiz)
    const existingQuiz = await getQuiz(quizId);
    
    if (existingQuiz) {
      // Update existing quiz
      const { error: updateError } = await supabase
        .from("quizzes")
        .update({
          title,
          description,
          category,
          difficulty,
          questions_json: questions,
          correct_answers_json: correctAnswers,
          is_premium: isPremium,
          updated_at: now,
        })
        .eq("id", quizId);

      if (updateError) {
        const errorMessage = updateError.message || String(updateError);
        if (
          errorMessage.includes("Could not find the table") ||
          (errorMessage.includes("relation") && errorMessage.includes("does not exist")) ||
          errorMessage.includes("schema cache")
        ) {
          console.warn(
            "⚠️  Quiz table not found in Supabase. Please run the migration script (docs/SUPABASE_MIGRATION.sql). " +
            "Saving to in-memory storage."
          );
        } else {
          console.error("Error updating quiz in Supabase:", updateError);
        }
        // Fallback to in-memory
        inMemoryStore.quizzes.set(quizId, record);
      }
    } else {
      // Insert new quiz
      const { error: insertError } = await supabase.from("quizzes").insert({
        id: quizId,
        title,
        description,
        category,
        difficulty,
        questions_json: questions,
        correct_answers_json: correctAnswers,
        is_premium: isPremium,
      });

      if (insertError) {
        const errorMessage = insertError.message || String(insertError);
        if (
          errorMessage.includes("Could not find the table") ||
          (errorMessage.includes("relation") && errorMessage.includes("does not exist")) ||
          errorMessage.includes("schema cache")
        ) {
          console.warn(
            "⚠️  Quiz table not found in Supabase. Please run the migration script (docs/SUPABASE_MIGRATION.sql). " +
            "Saving to in-memory storage."
          );
        } else {
          console.error("Error saving quiz to Supabase:", insertError);
        }
        // Fallback to in-memory
        inMemoryStore.quizzes.set(quizId, record);
      }
    }
  } catch (err) {
    // Catch any unexpected errors (like table not found exceptions)
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (
      errorMessage.includes("Could not find the table") ||
      (errorMessage.includes("relation") && errorMessage.includes("does not exist")) ||
      errorMessage.includes("schema cache")
    ) {
      console.warn(
        "⚠️  Quiz table not found in Supabase. Please run the migration script (docs/SUPABASE_MIGRATION.sql). " +
        "Saving to in-memory storage."
      );
    } else {
      console.error("Unexpected error saving quiz:", err);
    }
    // Fallback to in-memory
    inMemoryStore.quizzes.set(quizId, record);
  }

  return quizId;
}

export async function getQuiz(quizId: string): Promise<QuizRecord | null> {
  if (!isSupabaseConfigured()) {
    return inMemoryStore.quizzes.get(quizId) || null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .eq("is_active", true)
      .single();

    if (error) {
      // Check if error is due to table not existing (ignore if just not found)
      const errorMessage = error.message || String(error);
      if (
        errorMessage.includes("Could not find the table") ||
        (errorMessage.includes("relation") && errorMessage.includes("does not exist")) ||
        errorMessage.includes("schema cache")
      ) {
        console.warn(
          "⚠️  Quiz table not found in Supabase. Please run the migration script (docs/SUPABASE_MIGRATION.sql). " +
          "Falling back to in-memory storage."
        );
      }
      // Fallback to in-memory (also handles "not found" errors)
      return inMemoryStore.quizzes.get(quizId) || null;
    }

    if (!data) {
      return inMemoryStore.quizzes.get(quizId) || null;
    }

    return data as QuizRecord;
  } catch (err) {
    // Catch any unexpected errors (like table not found exceptions)
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (
      errorMessage.includes("Could not find the table") ||
      (errorMessage.includes("relation") && errorMessage.includes("does not exist")) ||
      errorMessage.includes("schema cache")
    ) {
      console.warn(
        "⚠️  Quiz table not found in Supabase. Please run the migration script (docs/SUPABASE_MIGRATION.sql). " +
        "Falling back to in-memory storage."
      );
    }
    return inMemoryStore.quizzes.get(quizId) || null;
  }
}

export async function getAllQuizzes(): Promise<Quiz[]> {
  if (!isSupabaseConfigured()) {
    const quizzes = Array.from(inMemoryStore.quizzes.values())
      .filter((q) => q.is_active)
      .map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        category: q.category,
        difficulty: q.difficulty,
        questionCount: q.questions_json.length,
        isPremium: q.is_premium,
        estimatedMinutes: Math.ceil(q.questions_json.length * 1.5),
      }));
    return quizzes;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("quizzes")
      .select("id, title, description, category, difficulty, questions_json, is_premium")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      // Check if error is due to table not existing
      const errorMessage = error.message || String(error);
      if (
        errorMessage.includes("Could not find the table") ||
        errorMessage.includes("relation") && errorMessage.includes("does not exist") ||
        errorMessage.includes("schema cache")
      ) {
        console.warn(
          "⚠️  Quiz table not found in Supabase. Please run the migration script (docs/SUPABASE_MIGRATION.sql). " +
          "Falling back to in-memory storage."
        );
      } else {
        console.error("Error fetching quizzes from Supabase:", error);
      }
      
      // Fallback to in-memory
      return Array.from(inMemoryStore.quizzes.values())
        .filter((q) => q.is_active)
        .map((q) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          category: q.category,
          difficulty: q.difficulty,
          questionCount: q.questions_json.length,
          isPremium: q.is_premium,
          estimatedMinutes: Math.ceil(q.questions_json.length * 1.5),
        }));
    }

    if (!data) {
      return [];
    }

    return data.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      difficulty: q.difficulty,
      questionCount: (q.questions_json as QuizQuestion[]).length,
      isPremium: q.is_premium,
      estimatedMinutes: Math.ceil((q.questions_json as QuizQuestion[]).length * 1.5),
    }));
  } catch (err) {
    // Catch any unexpected errors (like table not found exceptions)
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (
      errorMessage.includes("Could not find the table") ||
      errorMessage.includes("relation") && errorMessage.includes("does not exist") ||
      errorMessage.includes("schema cache")
    ) {
      console.warn(
        "⚠️  Quiz table not found in Supabase. Please run the migration script (docs/SUPABASE_MIGRATION.sql). " +
        "Falling back to in-memory storage."
      );
    } else {
      console.error("Unexpected error fetching quizzes:", err);
    }
    
    // Fallback to in-memory
    return Array.from(inMemoryStore.quizzes.values())
      .filter((q) => q.is_active)
      .map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        category: q.category,
        difficulty: q.difficulty,
        questionCount: q.questions_json.length,
        isPremium: q.is_premium,
        estimatedMinutes: Math.ceil(q.questions_json.length * 1.5),
      }));
  }
}

export async function saveQuizAttempt(
  userId: string,
  quizId: string,
  answers: Record<string, string>,
  score: number,
  timeTakenSeconds: number,
): Promise<string> {
  const attemptId = crypto.randomUUID();
  const now = new Date().toISOString();

  const record: QuizAttemptRecord = {
    id: attemptId,
    user_id: userId,
    quiz_id: quizId,
    answers_json: answers,
    score,
    time_taken_seconds: timeTakenSeconds,
    completed_at: now,
    created_at: now,
  };

  if (!isSupabaseConfigured()) {
    inMemoryStore.quizAttempts.set(attemptId, record);
    return attemptId;
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("quiz_attempts").insert({
    id: attemptId,
    user_id: userId,
    quiz_id: quizId,
    answers_json: answers,
    score,
    time_taken_seconds: timeTakenSeconds,
  });

  if (error) {
    console.error("Error saving quiz attempt to Supabase:", error);
    // Fallback to in-memory
    inMemoryStore.quizAttempts.set(attemptId, record);
  }

  return attemptId;
}

export async function getQuizAttempts(
  userId: string,
  quizId?: string,
): Promise<QuizAttempt[]> {
  if (!isSupabaseConfigured()) {
    const attempts = Array.from(inMemoryStore.quizAttempts.values())
      .filter((a) => a.user_id === userId && (quizId ? a.quiz_id === quizId : true))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((a) => ({
        id: a.id,
        quizId: a.quiz_id,
        userId: a.user_id,
        score: a.score,
        answers: a.answers_json,
        timeTakenSeconds: a.time_taken_seconds,
        completedAt: a.completed_at,
      }));
    return attempts;
  }

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });

  if (quizId) {
    query = query.eq("quiz_id", quizId);
  }

  const { data, error } = await query;

  if (error || !data) {
    // Fallback to in-memory
    return Array.from(inMemoryStore.quizAttempts.values())
      .filter((a) => a.user_id === userId && (quizId ? a.quiz_id === quizId : true))
      .map((a) => ({
        id: a.id,
        quizId: a.quiz_id,
        userId: a.user_id,
        score: a.score,
        answers: a.answers_json,
        timeTakenSeconds: a.time_taken_seconds,
        completedAt: a.completed_at,
      }));
  }

  return data.map((a) => ({
    id: a.id,
    quizId: a.quiz_id,
    userId: a.user_id,
    score: a.score,
    answers: a.answers_json,
    timeTakenSeconds: a.time_taken_seconds,
    completedAt: a.completed_at,
  }));
}

