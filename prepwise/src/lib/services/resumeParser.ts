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
  full_name: z.string().nullish(),
  current_role: z.string().nullish(),
  total_experience_years: z.number().nullish(),
  keywords: z.array(z.string()).default([]),
  summary_bullets: z.array(z.string()).default([]),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        field_of_study: z.string().nullish(),
        start_date: z.string().nullish(),
        end_date: z.string().nullish(),
        achievements: z.array(z.string()).nullish(),
      }),
    )
    .default([]),
  experience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        start_date: z.string().nullish(),
        end_date: z.string().nullish(),
        responsibilities: z.array(z.string()).nullish(),
        achievements: z.array(z.string()).nullish(),
        leadership_highlights: z.array(z.string()).nullish(),
      }),
    )
    .default([]),
  leadership: z
    .array(
      z.object({
        organization: z.string(),
        role: z.string(),
        impact: z.string(),
        metrics: z.array(z.string()).nullish(),
      }),
    )
    .default([]),
  extracurriculars: z.array(z.string()).nullish(),
  achievements: z.array(z.string()).nullish(),
});

type ResumeLLMResponse = z.infer<typeof resumeSchema>;

function mapProfile(data: ResumeLLMResponse): CandidateProfile {
  const education: ResumeEducationEntry[] = data.education.map((item) => ({
    institution: item.institution,
    degree: item.degree,
    fieldOfStudy: item.field_of_study ?? undefined,
    startDate: item.start_date ?? undefined,
    endDate: item.end_date ?? undefined,
    achievements: item.achievements ?? undefined,
  }));

  const experience: ResumeExperienceEntry[] = data.experience.map((item) => ({
    company: item.company,
    title: item.title,
    startDate: item.start_date ?? undefined,
    endDate: item.end_date ?? undefined,
    responsibilities: item.responsibilities ?? undefined,
    achievements: item.achievements ?? undefined,
    leadershipHighlights: item.leadership_highlights ?? undefined,
  }));

  const leadership: ResumeLeadershipEntry[] = data.leadership.map((item) => ({
    organization: item.organization,
    role: item.role,
    impact: item.impact,
    metrics: item.metrics ?? undefined,
  }));

  return {
    fullName: data.full_name ?? undefined,
    currentRole: data.current_role ?? undefined,
    totalExperienceYears: data.total_experience_years ?? undefined,
    keywords: data.keywords,
    summaryBullets: data.summary_bullets,
    education,
    experience,
    leadership,
    extracurriculars: data.extracurriculars ?? undefined,
    achievements: data.achievements ?? undefined,
  };
}

export async function extractTextFromResume(file: File | Blob): Promise<string> {
  try {
    console.log(`Extracting text from file: type=${file.type}, size=${file.size} bytes`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const mimeType = file.type.toLowerCase();
    console.log(`File MIME type: ${mimeType}`);

    if (mimeType.includes("pdf")) {
      console.log("Parsing PDF file...");
      try {
        // pdf-parse v2 uses a class-based API
        // Import the PDFParse class
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const pdfParseModule = require("pdf-parse") as any;
        
        // pdf-parse v2 exports PDFParse as a named export
        // Handle both CommonJS require and potential webpack wrapping
        let PDFParseClass: any;
        
        if (pdfParseModule.PDFParse && typeof pdfParseModule.PDFParse === "function") {
          // Named export
          PDFParseClass = pdfParseModule.PDFParse;
        } else if (pdfParseModule.default?.PDFParse && typeof pdfParseModule.default.PDFParse === "function") {
          // Wrapped in default
          PDFParseClass = pdfParseModule.default.PDFParse;
        } else if (typeof pdfParseModule === "function") {
          // Direct export (unlikely in v2, but handle it)
          PDFParseClass = pdfParseModule;
        } else {
          throw new Error(
            `Cannot find PDFParse class in pdf-parse module. Module type: ${typeof pdfParseModule}, ` +
            `keys: ${Object.keys(pdfParseModule || {}).slice(0, 10).join(", ")}`
          );
        }
        
        console.log("Instantiating PDFParse with buffer...");
        // pdf-parse v2: Create an instance with the buffer
        // The constructor accepts { data: Buffer } or { buffer: Buffer }
        const parser = new PDFParseClass({ data: buffer });
        
        try {
          console.log("Extracting text from PDF...");
          // Call getText() method to extract text
          const result = await parser.getText();
          
          console.log(`PDF parsed successfully, extracted ${result.text.length} characters`);
          return result.text;
        } finally {
          // Clean up resources
          await parser.destroy();
        }
      } catch (pdfError) {
        console.error("Error parsing PDF:", pdfError);
        throw new Error(`Failed to parse PDF file: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
      }
    }

    if (mimeType.includes("word") || mimeType.includes("docx") || mimeType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
      console.log("Parsing DOCX file...");
      try {
        const result = await mammoth.extractRawText({ buffer });
        console.log(`DOCX parsed successfully, extracted ${result.value.length} characters`);
        return result.value;
      } catch (docxError) {
        console.error("Error parsing DOCX:", docxError);
        throw new Error(`Failed to parse DOCX file: ${docxError instanceof Error ? docxError.message : String(docxError)}`);
      }
    }

    console.log("Treating as plain text file");
    return buffer.toString("utf-8");
  } catch (error) {
    console.error("Error in extractTextFromResume:", error);
    if (error instanceof Error) {
      throw new Error(`File extraction failed: ${error.message}`);
    }
    throw error;
  }
}

export async function parseCandidateProfileFromText(resumeText: string): Promise<CandidateProfile> {
  try {
    console.log("Getting Azure OpenAI client...");
    const client = getAzureOpenAIClient();
    const deployment = getOpenAIDeployment();
    console.log(`Using deployment: ${deployment}`);

    // Truncate resume text if too long (Azure OpenAI has token limits)
    const maxResumeLength = 15000; // Approximate character limit
    const truncatedText = resumeText.length > maxResumeLength 
      ? resumeText.substring(0, maxResumeLength) + "... [truncated]"
      : resumeText;

    console.log(`Resume text length: ${resumeText.length} characters (truncated to ${truncatedText.length})`);

    console.log("Calling Azure OpenAI API...");
    
    // Use JSON mode (json_object) which is more widely supported than JSON schema
    // This matches the Python example approach and works with 2025-01-01-preview
    const jsonSchemaPrompt = `You must return a valid JSON object with this exact structure. Do not include any markdown, code blocks, or explanations - only the raw JSON:

{
  "full_name": "string or null",
  "current_role": "string or null",
  "total_experience_years": number or null,
  "keywords": ["string"],
  "summary_bullets": ["string"],
  "education": [{
    "institution": "string",
    "degree": "string",
    "field_of_study": "string or null",
    "start_date": "string or null",
    "end_date": "string or null",
    "achievements": ["string"] or null
  }],
  "experience": [{
    "company": "string",
    "title": "string",
    "start_date": "string or null",
    "end_date": "string or null",
    "responsibilities": ["string"] or null,
    "achievements": ["string"] or null,
    "leadership_highlights": ["string"] or null
  }],
  "leadership": [{
    "organization": "string",
    "role": "string",
    "impact": "string",
    "metrics": ["string"] or null
  }],
  "extracurriculars": ["string"] or null,
  "achievements": ["string"] or null
}

Important: Return ONLY valid JSON. No markdown formatting, no code blocks, no explanations.`;

    console.log("Calling Azure OpenAI with JSON mode...");
    const response = await client.chat.completions.create({
      model: deployment,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an elite MBA admissions coach. Build a structured JSON summary of the candidate's resume focusing on leadership, impact, and differentiators. " + jsonSchemaPrompt,
        },
        {
          role: "user",
          content: `Resume:\n"""${truncatedText.trim()}"""`,
        },
      ],
    });
    
    console.log("Azure OpenAI API call completed");

    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.error("Azure OpenAI returned empty response");
      throw new Error("Azure OpenAI returned an empty response for resume parsing.");
    }

    console.log("Parsing Azure OpenAI response...");
    console.log("Response content length:", content.length);
    console.log("Response content preview:", content.substring(0, 200));
    
    // Clean the content - remove markdown code blocks if present
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.replace(/^```json\s*/i, "").replace(/\s*```\s*$/, "");
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/^```\s*/, "").replace(/\s*```\s*$/, "");
    }
    cleanedContent = cleanedContent.trim();
    
    let parsedJson: ResumeLLMResponse;
    try {
      parsedJson = JSON.parse(cleanedContent) as ResumeLLMResponse;
      console.log("JSON parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      console.error("Raw response content (first 1000 chars):", content.substring(0, 1000));
      console.error("Cleaned content (first 1000 chars):", cleanedContent.substring(0, 1000));
      throw new Error(`Failed to parse Azure OpenAI JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}. Response preview: ${content.substring(0, 200)}`);
    }

    const parsed = resumeSchema.safeParse(parsedJson);

    if (!parsed.success) {
      console.error("Schema validation failed:", parsed.error);
      throw new Error(`Failed to parse resume JSON: ${parsed.error.message}`);
    }

    console.log("Resume profile parsed successfully");
    return mapProfile(parsed.data);
  } catch (error) {
    console.error("Error in parseCandidateProfileFromText:", error);
    if (error instanceof Error) {
      // Re-throw with more context
      throw new Error(`Resume parsing failed: ${error.message}`);
    }
    throw error;
  }
}

export async function parseCandidateProfile(file: File | Blob): Promise<CandidateProfile> {
  const resumeText = await extractTextFromResume(file);
  return parseCandidateProfileFromText(resumeText);
}

