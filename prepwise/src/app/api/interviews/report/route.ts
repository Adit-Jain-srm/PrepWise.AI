import { NextRequest, NextResponse } from "next/server";
import path from "path";
import {
  loadCandidateProfile,
  loadInterviewEvaluation,
  loadInterviewSessionPlan,
} from "@/lib/db/interviewRepository";
import { InterviewEvaluation, CandidateProfile } from "@/lib/types/interview";

// Import PDFKit using require() to ensure proper font file resolution in Next.js serverless
// PDFKit needs to access font files from node_modules, and require() ensures correct path resolution
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const PDFDocument = require("pdfkit");

// Helper function to get PDFKit font path
// PDFKit needs to access font files from node_modules
function getPDFKitFontPath(): string | null {
  try {
    // Resolve PDFKit's main file
    const pdfkitPath = require.resolve("pdfkit");
    const pdfkitDir = path.dirname(pdfkitPath);
    // Font files are in js/data directory relative to PDFKit's main file
    const fontPath = path.join(pdfkitDir, "js", "data");
    return fontPath;
  } catch (error) {
    console.warn("Could not resolve PDFKit font path:", error);
    return null;
  }
}

type ReportRequestBody = {
  sessionId: string;
  candidateId: string;
  evaluation?: InterviewEvaluation;
  profile?: CandidateProfile; // Optional: send profile from frontend for Profile Insights
};

export const dynamic = "force-dynamic";

// Type for PDFDocument instance  
// Using any to avoid type issues with require() and PDFKit's dynamic nature
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderProfileInsights(pdf: any, profile: CandidateProfile | null) {
  if (!profile) {
    return;
  }

  try {
    pdf.fontSize(16).fillColor("#111827").text("Profile Insights", { underline: true });
    pdf.moveDown(0.5);

    // Headline information
    const headlineParts: string[] = [];
    if (profile.fullName) {
      headlineParts.push(profile.fullName);
    }
    if (profile.currentRole) {
      headlineParts.push(profile.currentRole);
    }
    if (profile.totalExperienceYears !== undefined) {
      headlineParts.push(`${profile.totalExperienceYears}+ years experience`);
    }

    if (headlineParts.length > 0) {
      pdf.fontSize(13).fillColor("#0284c7").text(headlineParts.join(" • "), { indent: 12 });
      pdf.moveDown(0.5);
    }

    // Key Takeaways (Summary Bullets)
    if (profile.summaryBullets && Array.isArray(profile.summaryBullets) && profile.summaryBullets.length > 0) {
      pdf.fontSize(12).fillColor("#111827").text("Key Takeaways", { underline: true });
      pdf.moveDown(0.25);
      profile.summaryBullets.slice(0, 6).forEach((bullet) => {
        if (typeof bullet === "string") {
          pdf.fillColor("#4b5563").fontSize(10).text(`• ${bullet}`, { indent: 12 });
        }
      });
      pdf.moveDown(0.5);
    }

    // Keywords
    if (profile.keywords && Array.isArray(profile.keywords) && profile.keywords.length > 0) {
      pdf.fontSize(12).fillColor("#111827").text("Keywords", { underline: true });
      pdf.moveDown(0.25);
      const keywordsText = profile.keywords.slice(0, 12).join(", ");
      pdf.fillColor("#4b5563").fontSize(10).text(keywordsText, { indent: 12 });
      pdf.moveDown(0.5);
    }

    // Experience Highlights
    if (profile.experience && Array.isArray(profile.experience) && profile.experience.length > 0) {
      pdf.fontSize(12).fillColor("#111827").text("Experience Highlights", { underline: true });
      pdf.moveDown(0.25);
      profile.experience.slice(0, 3).forEach((exp) => {
        pdf.fillColor("#1d4ed8").fontSize(11).text(`${exp.title} @ ${exp.company}`, { indent: 12 });
        
        if (exp.leadershipHighlights && Array.isArray(exp.leadershipHighlights) && exp.leadershipHighlights.length > 0) {
          exp.leadershipHighlights.slice(0, 2).forEach((highlight) => {
            if (typeof highlight === "string") {
              pdf.fillColor("#4b5563").fontSize(9).text(`  - ${highlight}`, { indent: 20 });
            }
          });
        } else if (exp.achievements && Array.isArray(exp.achievements) && exp.achievements.length > 0) {
          exp.achievements.slice(0, 2).forEach((achievement) => {
            if (typeof achievement === "string") {
              pdf.fillColor("#4b5563").fontSize(9).text(`  - ${achievement}`, { indent: 20 });
            }
          });
        }
        pdf.moveDown(0.25);
      });
      pdf.moveDown(0.5);
    }

    // Education
    if (profile.education && Array.isArray(profile.education) && profile.education.length > 0) {
      pdf.fontSize(12).fillColor("#111827").text("Education", { underline: true });
      pdf.moveDown(0.25);
      profile.education.slice(0, 3).forEach((edu) => {
        const educationText = [
          edu.degree,
          edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : null,
          `@ ${edu.institution}`,
        ].filter(Boolean).join(" ");
        pdf.fillColor("#4b5563").fontSize(10).text(`• ${educationText}`, { indent: 12 });
      });
      pdf.moveDown(0.5);
    }

    // Leadership
    if (profile.leadership && Array.isArray(profile.leadership) && profile.leadership.length > 0) {
      pdf.fontSize(12).fillColor("#111827").text("Leadership", { underline: true });
      pdf.moveDown(0.25);
      profile.leadership.slice(0, 3).forEach((lead) => {
        pdf.fillColor("#4b5563").fontSize(10).text(`• ${lead.role} @ ${lead.organization}`, { indent: 12 });
        if (lead.impact) {
          pdf.fillColor("#4b5563").fontSize(9).text(`  Impact: ${lead.impact}`, { indent: 20 });
        }
      });
      pdf.moveDown(0.5);
    }

    // Extracurriculars
    if (profile.extracurriculars && Array.isArray(profile.extracurriculars) && profile.extracurriculars.length > 0) {
      pdf.fontSize(12).fillColor("#111827").text("Extracurriculars", { underline: true });
      pdf.moveDown(0.25);
      profile.extracurriculars.slice(0, 5).forEach((extra) => {
        if (typeof extra === "string") {
          pdf.fillColor("#4b5563").fontSize(10).text(`• ${extra}`, { indent: 12 });
        }
      });
      pdf.moveDown(0.5);
    }

    // Achievements
    if (profile.achievements && Array.isArray(profile.achievements) && profile.achievements.length > 0) {
      pdf.fontSize(12).fillColor("#111827").text("Achievements", { underline: true });
      pdf.moveDown(0.25);
      profile.achievements.slice(0, 5).forEach((achievement) => {
        if (typeof achievement === "string") {
          pdf.fillColor("#4b5563").fontSize(10).text(`• ${achievement}`, { indent: 12 });
        }
      });
      pdf.moveDown(0.5);
    }

    // Essays (if provided during upload)
    if (profile.essays && Array.isArray(profile.essays) && profile.essays.length > 0) {
      pdf.fontSize(12).fillColor("#111827").text("Essay Signals", { underline: true });
      pdf.moveDown(0.25);
      profile.essays.forEach((essay) => {
        if (essay.prompt) {
          pdf.fillColor("#7c3aed").fontSize(11).text(`Prompt: ${essay.prompt}`, { indent: 12 });
        }
        if (essay.content) {
          const essayPreview = essay.content.substring(0, 200) + (essay.content.length > 200 ? "..." : "");
          pdf.fillColor("#4b5563").fontSize(9).text(essayPreview, { indent: 20 });
        }
        pdf.moveDown(0.25);
      });
      pdf.moveDown(0.5);
    }

    pdf.moveDown();
  } catch (profileError) {
    console.error("Error rendering profile insights in PDF:", profileError);
    // Continue even if profile rendering fails
  }
}

// Type for PDFDocument instance  
// Using any to avoid type issues with require() and PDFKit's dynamic nature
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderEvaluation(pdf: any, evaluation: InterviewEvaluation) {
  try {
    pdf.fontSize(16).fillColor("#111827").text("Overall Performance", { underline: true });
    pdf.moveDown(0.5);
    
    // Validate overallScore
    const overallScore = typeof evaluation.overallScore === "number" && !isNaN(evaluation.overallScore)
      ? evaluation.overallScore
      : 0;
    pdf.fontSize(20).fillColor("#0284c7").text(`Overall Score: ${overallScore.toFixed(2)} / 10`);
    pdf.moveDown();

    pdf.fontSize(14).fillColor("#111827").text("Rubric Breakdown", { underline: true });
    pdf.moveDown(0.5);
    
    // Validate rubricScores
    const rubricScores = evaluation.rubricScores && typeof evaluation.rubricScores === "object"
      ? evaluation.rubricScores
      : {};
    
    if (Object.keys(rubricScores).length === 0) {
      pdf.fillColor("#4b5563").fontSize(12).text("No rubric scores available", { indent: 12 });
    } else {
      Object.entries(rubricScores).forEach(([dimension, score]) => {
        const numericScore = typeof score === "number" && !isNaN(score) ? score : 0;
        const scoreColor = numericScore >= 8 ? "#059669" : numericScore >= 6 ? "#d97706" : "#dc2626";
        pdf.fillColor(scoreColor).fontSize(12).text(`${dimension}: ${numericScore.toFixed(2)} / 10`, { indent: 12 });
      });
    }
    pdf.moveDown();

    pdf.fontSize(14).fillColor("#111827").text("Question-Wise Analysis", { underline: true });
    pdf.moveDown(0.5);
    
    // Validate responses array
    const responses = Array.isArray(evaluation.responses) ? evaluation.responses : [];
    
    if (responses.length === 0) {
      pdf.fillColor("#4b5563").fontSize(12).text("No responses available", { indent: 12 });
    } else {
      responses.forEach((response, index) => {
        // Validate scores
        const scores = response.scores && typeof response.scores === "object" ? response.scores : {};
        const scoreValues = Object.values(scores).filter((s) => typeof s === "number" && !isNaN(s)) as number[];
        const avgScore = scoreValues.length > 0
          ? scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length
          : 0;
        
        pdf.fontSize(13).fillColor("#1d4ed8").text(`Question ${index + 1}`, { underline: true });
        pdf.moveDown(0.25);
        pdf.fillColor("#4b5563").fontSize(11).text(`Average Score: ${avgScore.toFixed(2)} / 10`);
        pdf.moveDown(0.5);
        
        if (response.transcript && typeof response.transcript === "string" && response.transcript !== "[No audio recorded]" && response.transcript !== "[No transcript available]") {
          pdf.fillColor("#111827").fontSize(11).text("Transcript:", { underline: true });
          const transcriptText = response.transcript.substring(0, 400) + (response.transcript.length > 400 ? "..." : "");
          pdf.fillColor("#4b5563").fontSize(10).text(transcriptText, { indent: 12 });
          pdf.moveDown(0.5);
        }
        
        if (response.toneAnalysis && typeof response.toneAnalysis === "string") {
          pdf.fillColor("#7c3aed").fontSize(11).text("Tone Analysis:", { underline: true });
          pdf.fillColor("#4b5563").fontSize(10).text(response.toneAnalysis, { indent: 12 });
          pdf.moveDown(0.5);
        }
        
        if (response.communicationClarity && typeof response.communicationClarity === "string") {
          pdf.fillColor("#7c3aed").fontSize(11).text("Communication Clarity:", { underline: true });
          pdf.fillColor("#4b5563").fontSize(10).text(response.communicationClarity, { indent: 12 });
          pdf.moveDown(0.5);
        }
        
        if (response.confidenceAnalysis && typeof response.confidenceAnalysis === "string") {
          pdf.fillColor("#7c3aed").fontSize(11).text("Confidence Analysis:", { underline: true });
          pdf.fillColor("#4b5563").fontSize(10).text(response.confidenceAnalysis, { indent: 12 });
          pdf.moveDown(0.5);
        }
        
        if (response.nonVerbalAnalysis && typeof response.nonVerbalAnalysis === "string") {
          pdf.fillColor("#7c3aed").fontSize(11).text("Non-Verbal Analysis:", { underline: true });
          pdf.fillColor("#4b5563").fontSize(10).text(response.nonVerbalAnalysis, { indent: 12 });
          pdf.moveDown(0.5);
        }
        
        if (Array.isArray(response.strengths) && response.strengths.length > 0) {
          pdf.fillColor("#059669").fontSize(11).text("Strengths:", { underline: true });
          response.strengths.forEach((strength) => {
            if (typeof strength === "string") {
              pdf.fillColor("#4b5563").fontSize(10).text(`• ${strength}`, { indent: 12 });
            }
          });
          pdf.moveDown(0.5);
        }
        
        if (Array.isArray(response.improvements) && response.improvements.length > 0) {
          pdf.fillColor("#dc2626").fontSize(11).text("Areas for Improvement:", { underline: true });
          response.improvements.forEach((improvement) => {
            if (typeof improvement === "string") {
              pdf.fillColor("#4b5563").fontSize(10).text(`• ${improvement}`, { indent: 12 });
            }
          });
          pdf.moveDown();
        }
        
          pdf.moveDown(0.5);
        });
      }
      
      // Render essay evaluations if present
      if (evaluation.essayEvaluations && Array.isArray(evaluation.essayEvaluations) && evaluation.essayEvaluations.length > 0) {
        pdf.moveDown();
        pdf.fontSize(14).fillColor("#111827").text("Written Essay Analysis", { underline: true });
        pdf.moveDown(0.5);
        
        evaluation.essayEvaluations.forEach((essayEval, index) => {
          // Validate scores
          const scores = essayEval.scores && typeof essayEval.scores === "object" ? essayEval.scores : {};
          const scoreValues = Object.values(scores).filter((s) => typeof s === "number" && !isNaN(s)) as number[];
          const avgScore = scoreValues.length > 0
            ? scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length
            : 0;
          
          pdf.fontSize(13).fillColor("#d97706").text(`Essay ${index + 1}`, { underline: true });
          pdf.moveDown(0.25);
          pdf.fillColor("#4b5563").fontSize(11).text(`Word Count: ${essayEval.wordCount} words | Average Score: ${avgScore.toFixed(2)} / 10`);
          pdf.moveDown(0.5);
          
          if (essayEval.prompt && typeof essayEval.prompt === "string") {
            pdf.fillColor("#111827").fontSize(11).text("Prompt:", { underline: true });
            pdf.fillColor("#4b5563").fontSize(10).text(essayEval.prompt, { indent: 12 });
            pdf.moveDown(0.5);
          }
          
          if (essayEval.writingClarity && typeof essayEval.writingClarity === "string") {
            pdf.fillColor("#7c3aed").fontSize(11).text("Writing Clarity:", { underline: true });
            pdf.fillColor("#4b5563").fontSize(10).text(essayEval.writingClarity, { indent: 12 });
            pdf.moveDown(0.5);
          }
          
          if (essayEval.structureAnalysis && typeof essayEval.structureAnalysis === "string") {
            pdf.fillColor("#7c3aed").fontSize(11).text("Structure Analysis:", { underline: true });
            pdf.fillColor("#4b5563").fontSize(10).text(essayEval.structureAnalysis, { indent: 12 });
            pdf.moveDown(0.5);
          }
          
          if (essayEval.depthAnalysis && typeof essayEval.depthAnalysis === "string") {
            pdf.fillColor("#7c3aed").fontSize(11).text("Depth Analysis:", { underline: true });
            pdf.fillColor("#4b5563").fontSize(10).text(essayEval.depthAnalysis, { indent: 12 });
            pdf.moveDown(0.5);
          }
          
          if (essayEval.content && typeof essayEval.content === "string") {
            pdf.fillColor("#111827").fontSize(11).text("Essay Preview:", { underline: true });
            const essayPreview = essayEval.content.substring(0, 400) + (essayEval.content.length > 400 ? "..." : "");
            pdf.fillColor("#4b5563").fontSize(10).text(essayPreview, { indent: 12 });
            pdf.moveDown(0.5);
          }
          
          if (Array.isArray(essayEval.strengths) && essayEval.strengths.length > 0) {
            pdf.fillColor("#059669").fontSize(11).text("Strengths:", { underline: true });
            essayEval.strengths.forEach((strength) => {
              if (typeof strength === "string") {
                pdf.fillColor("#4b5563").fontSize(10).text(`• ${strength}`, { indent: 12 });
              }
            });
            pdf.moveDown(0.5);
          }
          
          if (Array.isArray(essayEval.improvements) && essayEval.improvements.length > 0) {
            pdf.fillColor("#dc2626").fontSize(11).text("Areas for Improvement:", { underline: true });
            essayEval.improvements.forEach((improvement) => {
              if (typeof improvement === "string") {
                pdf.fillColor("#4b5563").fontSize(10).text(`• ${improvement}`, { indent: 12 });
              }
            });
            pdf.moveDown();
          }
          
          pdf.moveDown(0.5);
        });
      }
    } catch (renderError) {
      console.error("Error rendering evaluation in PDF:", renderError);
      pdf.fillColor("#dc2626").fontSize(12).text("Error rendering evaluation data", { indent: 12 });
      throw renderError;
    }
  }

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReportRequestBody;

    if (!body.sessionId || !body.candidateId) {
      return NextResponse.json({ error: "sessionId and candidateId are required." }, { status: 400 });
    }

    // Prefer evaluation from request body (more reliable), fallback to loading from store
    let evaluation = body.evaluation ?? null;
    if (!evaluation) {
      console.log(`Loading evaluation from store for sessionId: ${body.sessionId}`);
      evaluation = await loadInterviewEvaluation(body.sessionId);
    } else {
      console.log("Using evaluation from request body");
    }

    if (!evaluation) {
      console.error(`Evaluation not found for sessionId: ${body.sessionId}`);
      return NextResponse.json(
        { error: "Evaluation not found. Please complete the interview evaluation first." },
        { status: 404 },
      );
    }

    // Validate evaluation structure
    if (!evaluation.responses || !Array.isArray(evaluation.responses) || evaluation.responses.length === 0) {
      console.error(`Invalid evaluation structure for sessionId: ${body.sessionId}`);
      return NextResponse.json(
        { error: "Invalid evaluation data: no responses found." },
        { status: 400 },
      );
    }

    // Prefer profile from request body (more reliable), fallback to loading from store
    let profile: CandidateProfile | null = body.profile ?? null;
    let plan = null;
    
    // Load from store if not provided in request
    if (!profile) {
      try {
        profile = await loadCandidateProfile(body.candidateId);
        console.log("Loaded profile from store");
      } catch (profileError) {
        console.warn(`Failed to load profile for candidateId: ${body.candidateId}`, profileError);
        // Continue without profile - report will use "Candidate" as name
      }
    } else {
      console.log("Using profile from request body");
    }

    try {
      plan = await loadInterviewSessionPlan(body.sessionId);
    } catch (planError) {
      console.warn(`Failed to load plan for sessionId: ${body.sessionId}`, planError);
      // Continue without plan - report will work without question count
    }

    // Create PDF document
    // PDFKit will use built-in fonts (Helvetica) which should be available
    // The font files are included in the pdfkit package in node_modules
    const pdf = new PDFDocument({ 
      margin: 50,
      // Ensure PDFKit uses its default font path from node_modules
      autoFirstPage: true,
    });
    const buffers: Buffer[] = [];

    pdf.on("data", (chunk: Buffer) => buffers.push(chunk));
    
    // Handle PDF errors gracefully
    pdf.on("error", (error: Error) => {
      console.error("PDF generation error:", error);
    });

    const candidateName = profile?.fullName ?? "Candidate";

    try {
      pdf.fontSize(22).fillColor("#111827").text("PrepWise.AI Mock Interview Report");
      pdf.moveDown(1.5);

      pdf.fontSize(14).fillColor("#0284c7").text(candidateName, { continued: false });
      pdf.moveDown(0.25);
      pdf.fillColor("#4b5563").fontSize(11).text(`Session ID: ${body.sessionId}`);
      if (plan?.questions?.length) {
        pdf.fontSize(11).text(`Question Set: ${plan.questions.length} prompts`);
      }
      pdf.moveDown();

      // Render Profile Insights section
      renderProfileInsights(pdf, profile);

      // Render Evaluation section
      renderEvaluation(pdf, evaluation);

      pdf.end();

      // Wait for PDF to finish generating
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (buffers.length === 0) {
            reject(new Error("PDF generation timed out after 30 seconds"));
          }
        }, 30000); // 30 second timeout

        pdf.on("end", () => {
          clearTimeout(timeout);
          console.log("PDF generation completed successfully");
          resolve();
        });

        pdf.on("error", (pdfError: Error) => {
          clearTimeout(timeout);
          console.error("PDF generation error in promise:", pdfError);
          reject(pdfError);
        });
      });
    } catch (pdfError) {
      console.error("Error during PDF content generation:", pdfError);
      throw new Error(`PDF content generation failed: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
    }

    const pdfBuffer = Buffer.concat(buffers);

    if (pdfBuffer.length === 0) {
      console.error("PDF buffer is empty");
      return NextResponse.json(
        { error: "Failed to generate PDF: empty buffer" },
        { status: 500 },
      );
    }

    console.log(`PDF generated successfully: ${pdfBuffer.length} bytes for sessionId: ${body.sessionId}`);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": pdfBuffer.length.toString(),
        "Content-Disposition": `attachment; filename="prepwise-report-${body.sessionId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate PDF report:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `PDF generation failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}
