import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { z } from "zod";
import { getAzureOpenAIClient, getOpenAIDeployment } from "../azure/openai";
import {
  CandidateProfile,
  ResumeEducationEntry,
  ResumeExperienceEntry,
  ResumeLeadershipEntry,
} from "../types/interview";

const resumeSchema = z.object({
  full_name: z.string().optional(),
  current_role: z.string().optional(),
  total_experience_years: z.number().optional(),
  keywords: z.array(z.string()).default([]),
  summary_bullets: z.array(z.string()).default([]),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        field_of_study: z.string().optional(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        achievements: z.array(z.string()).optional(),
      }),
    )
    .default([]),
  experience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        responsibilities: z.array(z.string()).optional(),
        achievements: z.array(z.string()).optional(),
        leadership_highlights: z.array(z.string()).optional(),
      }),
    )
    .default([]),
  leadership: z
    .array(
      z.object({
        organization: z.string(),
        role: z.string(),
        impact: z.string(),
        metrics: z.array(z.string()).optional(),
      }),
    )
    .default([]),
  extracurriculars: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
});

type ResumeLLMResponse = z.infer<typeof resumeSchema>;

function mapProfile(data: ResumeLLMResponse): CandidateProfile {
  const education: ResumeEducationEntry[] = data.education.map((item) => ({
    institution: item.institution,
    degree: item.degree,
    fieldOfStudy: item.field_of_study,
    startDate: item.start_date,
    endDate: item.end_date,
    achievements: item.achievements,
  }));

  const experience: ResumeExperienceEntry[] = data.experience.map((item) => ({
    company: item.company,
    title: item.title,
    startDate: item.start_date,
    endDate: item.end_date,
    responsibilities: item.responsibilities,
    achievements: item.achievements,
    leadershipHighlights: item.leadership_highlights,
  }));

  const leadership: ResumeLeadershipEntry[] = data.leadership.map((item) => ({
    organization: item.organization,
    role: item.role,
    impact: item.impact,
    metrics: item.metrics,
  }));

  return {
    fullName: data.full_name,
    currentRole: data.current_role,
    totalExperienceYears: data.total_experience_years,
    keywords: data.keywords,
    summaryBullets: data.summary_bullets,
    education,
    experience,
    leadership,
    extracurriculars: data.extracurriculars,
    achievements: data.achievements,
  };
}

export async function extractTextFromResume(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const mimeType = file.type.toLowerCase();

  if (mimeType.includes("pdf")) {
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (mimeType.includes("word") || mimeType.includes("docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return buffer.toString("utf-8");
}

export async function parseCandidateProfileFromText(resumeText: string): Promise<CandidateProfile> {
  const client = getAzureOpenAIClient();
  const deployment = getOpenAIDeployment();

  const response = await client.chat.completions.create({
    model: deployment,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "mba_resume_profile",
        schema: {
          type: "object",
          properties: {
            full_name: { type: "string" },
            current_role: { type: "string" },
            total_experience_years: { type: "number" },
            keywords: { type: "array", items: { type: "string" } },
            summary_bullets: { type: "array", items: { type: "string" } },
            education: {
              type: "array",
              items: {
                type: "object",
                required: ["institution", "degree"],
                properties: {
                  institution: { type: "string" },
                  degree: { type: "string" },
                  field_of_study: { type: "string" },
                  start_date: { type: "string" },
                  end_date: { type: "string" },
                  achievements: { type: "array", items: { type: "string" } },
                },
              },
            },
            experience: {
              type: "array",
              items: {
                type: "object",
                required: ["company", "title"],
                properties: {
                  company: { type: "string" },
                  title: { type: "string" },
                  start_date: { type: "string" },
                  end_date: { type: "string" },
                  responsibilities: { type: "array", items: { type: "string" } },
                  achievements: { type: "array", items: { type: "string" } },
                  leadership_highlights: { type: "array", items: { type: "string" } },
                },
              },
            },
            leadership: {
              type: "array",
              items: {
                type: "object",
                required: ["organization", "role", "impact"],
                properties: {
                  organization: { type: "string" },
                  role: { type: "string" },
                  impact: { type: "string" },
                  metrics: { type: "array", items: { type: "string" } },
                },
              },
            },
            extracurriculars: { type: "array", items: { type: "string" } },
            achievements: { type: "array", items: { type: "string" } },
          },
          required: ["keywords", "summary_bullets", "education", "experience", "leadership"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "system",
        content:
          "You are an elite MBA admissions coach. Build a structured JSON summary of the candidate's resume focusing on leadership, impact, and differentiators.",
      },
      {
        role: "user",
        content: `Resume:\n"""${resumeText.trim()}"""`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Azure OpenAI returned an empty response for resume parsing.");
  }

  const parsedJson = JSON.parse(content) as ResumeLLMResponse;
  const parsed = resumeSchema.safeParse(parsedJson);

  if (!parsed.success) {
    throw new Error(`Failed to parse resume JSON: ${parsed.error.message}`);
  }

  return mapProfile(parsed.data);
}

export async function parseCandidateProfile(file: File | Blob): Promise<CandidateProfile> {
  const resumeText = await extractTextFromResume(file);
  return parseCandidateProfileFromText(resumeText);
}

