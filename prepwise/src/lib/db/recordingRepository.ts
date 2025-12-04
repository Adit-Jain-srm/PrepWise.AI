import { getSupabaseAdmin, isSupabaseConfigured } from "./supabaseAdmin";
import { InterviewRecordingSummary } from "../types/user";
import { CandidateProfile, InterviewSessionPlan, InterviewEvaluation } from "../types/interview";

type RecordingRecord = {
  id: string;
  user_id: string;
  session_id: string;
  candidate_id: string;
  title?: string;
  profile_json?: CandidateProfile;
  plan_json?: InterviewSessionPlan;
  evaluation_json?: InterviewEvaluation;
  video_urls?: Record<string, string>;
  audio_urls?: Record<string, string>;
  essay_responses?: Record<string, string>;
  overall_score?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
};

const inMemoryStore = {
  recordings: new Map<string, RecordingRecord>(),
};

export async function saveRecording(
  userId: string,
  sessionId: string,
  candidateId: string,
  data: {
    title?: string;
    profile?: CandidateProfile;
    plan?: InterviewSessionPlan;
    evaluation?: InterviewEvaluation;
    videoUrls?: Record<string, string>;
    audioUrls?: Record<string, string>;
    essayResponses?: Record<string, string>;
    overallScore?: number;
  },
): Promise<string> {
  const recordingId = crypto.randomUUID();
  const now = new Date().toISOString();

  const record: RecordingRecord = {
    id: recordingId,
    user_id: userId,
    session_id: sessionId,
    candidate_id: candidateId,
    title: data.title,
    profile_json: data.profile,
    plan_json: data.plan,
    evaluation_json: data.evaluation,
    video_urls: data.videoUrls,
    audio_urls: data.audioUrls,
    essay_responses: data.essayResponses,
    overall_score: data.overallScore,
    completed_at: now,
    created_at: now,
    updated_at: now,
  };

  if (!isSupabaseConfigured()) {
    inMemoryStore.recordings.set(recordingId, record);
    return recordingId;
  }

  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase.from("interview_recordings").insert({
    id: recordingId,
    user_id: userId,
    session_id: sessionId,
    candidate_id: candidateId,
    title: data.title,
    profile_json: data.profile,
    plan_json: data.plan,
    evaluation_json: data.evaluation,
    video_urls: data.videoUrls,
    audio_urls: data.audioUrls,
    essay_responses: data.essayResponses,
    overall_score: data.overallScore,
    completed_at: now,
  });

  if (error) {
    console.error("Error saving recording to Supabase:", error);
    // Still return the recordingId even if Supabase insert fails
    // The in-memory store already has it
    throw new Error(`Failed to save recording to database: ${error.message}`);
  }

  return recordingId;
}

export async function getRecordings(
  userId: string,
  limit?: number,
): Promise<InterviewRecordingSummary[]> {
  if (!isSupabaseConfigured()) {
    const recordings = Array.from(inMemoryStore.recordings.values())
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const limited = limit ? recordings.slice(0, limit) : recordings;
    
    return limited.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      title: r.title,
      overallScore: r.overall_score,
      completedAt: r.completed_at,
      createdAt: r.created_at,
      questionCount: r.plan_json?.questions?.length,
    }));
  }

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("interview_recordings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((r) => ({
    id: r.id,
    sessionId: r.session_id,
    title: r.title,
    overallScore: r.overall_score,
    completedAt: r.completed_at,
    createdAt: r.created_at,
    questionCount: (r.plan_json as InterviewSessionPlan | null)?.questions?.length,
  }));
}

export async function getRecording(
  userId: string,
  sessionId: string,
): Promise<RecordingRecord | null> {
  if (!isSupabaseConfigured()) {
    const recording = Array.from(inMemoryStore.recordings.values()).find(
      (r) => r.user_id === userId && r.session_id === sessionId,
    );
    return recording ?? null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("interview_recordings")
    .select("*")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as RecordingRecord;
}

