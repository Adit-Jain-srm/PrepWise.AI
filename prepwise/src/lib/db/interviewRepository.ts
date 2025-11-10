import { CandidateProfile, InterviewSessionPlan, InterviewEvaluation } from "../types/interview";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabaseAdmin";

type CandidateRecord = {
  id: string;
  profile: CandidateProfile;
  created_at: string;
};

type InterviewSessionRecord = {
  session_id: string;
  candidate_id: string;
  plan: InterviewSessionPlan;
  status: "scheduled" | "in_progress" | "completed";
  created_at: string;
  updated_at: string;
};

type InterviewEvaluationRecord = {
  session_id: string;
  evaluation: InterviewEvaluation;
  generated_at: string;
};

const inMemoryStore = {
  candidates: new Map<string, CandidateRecord>(),
  sessions: new Map<string, InterviewSessionRecord>(),
  evaluations: new Map<string, InterviewEvaluationRecord>(),
};

export async function loadCandidateProfile(
  candidateId: string,
): Promise<CandidateProfile | null> {
  if (!isSupabaseConfigured()) {
    return inMemoryStore.candidates.get(candidateId)?.profile ?? null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("candidate_profiles")
    .select("profile_json")
    .eq("id", candidateId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.profile_json as CandidateProfile;
}

export async function saveCandidateProfile(
  candidateId: string,
  profile: CandidateProfile,
): Promise<void> {
  const record: CandidateRecord = {
    id: candidateId,
    profile,
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    inMemoryStore.candidates.set(candidateId, record);
    return;
  }

  const supabase = getSupabaseAdmin();

  await supabase.from("candidate_profiles").upsert(
    {
      id: candidateId,
      profile_json: profile,
    },
    { onConflict: "id" },
  );
}

export async function saveInterviewSessionPlan(
  plan: InterviewSessionPlan,
): Promise<void> {
  const record: InterviewSessionRecord = {
    session_id: plan.sessionId,
    candidate_id: plan.candidateId,
    plan,
    status: "scheduled",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    inMemoryStore.sessions.set(plan.sessionId, record);
    return;
  }

  const supabase = getSupabaseAdmin();

  await supabase.from("interview_sessions").upsert(
    {
      session_id: plan.sessionId,
      candidate_id: plan.candidateId,
      plan_json: plan,
      status: "scheduled",
    },
    { onConflict: "session_id" },
  );
}

export async function saveInterviewEvaluation(
  sessionId: string,
  evaluation: InterviewEvaluation,
): Promise<void> {
  const record: InterviewEvaluationRecord = {
    session_id: sessionId,
    evaluation,
    generated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    inMemoryStore.evaluations.set(sessionId, record);
    return;
  }

  const supabase = getSupabaseAdmin();

  await supabase.from("interview_evaluations").upsert(
    {
      session_id: sessionId,
      evaluation_json: evaluation,
    },
    { onConflict: "session_id" },
  );
}

export async function loadInterviewSessionPlan(
  sessionId: string,
): Promise<InterviewSessionPlan | null> {
  if (!isSupabaseConfigured()) {
    return inMemoryStore.sessions.get(sessionId)?.plan ?? null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("plan_json")
    .eq("session_id", sessionId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.plan_json as InterviewSessionPlan;
}

export async function loadInterviewEvaluation(
  sessionId: string,
): Promise<InterviewEvaluation | null> {
  if (!isSupabaseConfigured()) {
    return inMemoryStore.evaluations.get(sessionId)?.evaluation ?? null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("interview_evaluations")
    .select("evaluation_json")
    .eq("session_id", sessionId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.evaluation_json as InterviewEvaluation;
}
