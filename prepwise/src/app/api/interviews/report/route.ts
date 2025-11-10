import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import {
  loadCandidateProfile,
  loadInterviewEvaluation,
  loadInterviewSessionPlan,
} from "@/lib/db/interviewRepository";
import { InterviewEvaluation } from "@/lib/types/interview";

type ReportRequestBody = {
  sessionId: string;
  candidateId: string;
  evaluation?: InterviewEvaluation;
};

export const dynamic = "force-dynamic";

function renderEvaluation(pdf: PDFDocument, evaluation: InterviewEvaluation) {
  pdf.fontSize(14).text("Overall Score", { underline: true });
  pdf.moveDown(0.5);
  pdf.fontSize(18).fillColor("#0284c7").text(`${evaluation.overallScore.toFixed(2)} / 10`);
  pdf.moveDown();

  pdf.fontSize(14).fillColor("#111827").text("Rubric Breakdown", { underline: true });
  pdf.moveDown(0.5);
  Object.entries(evaluation.rubricScores).forEach(([dimension, score]) => {
    pdf.fontSize(12).text(`${dimension}: ${score.toFixed(2)}/10`);
  });
  pdf.moveDown();

  pdf.fontSize(14).text("Question Insights", { underline: true });
  pdf.moveDown(0.5);
  evaluation.responses.forEach((response, index) => {
    pdf
      .fontSize(12)
      .fillColor("#0284c7")
      .text(`Q${index + 1} • Score ${(
        Object.values(response.scores).reduce((sum, value) => sum + value, 0) /
        Math.max(Object.keys(response.scores).length, 1)
      ).toFixed(2)}/10`);
    pdf.moveDown(0.25);
    pdf.fillColor("#111827").fontSize(11).text("Strengths:");
    response.strengths.forEach((strength) => {
      pdf.text(`• ${strength}`, { indent: 12 });
    });
    pdf.moveDown(0.25);
    pdf.fontSize(11).text("Opportunities:");
    response.improvements.forEach((improvement) => {
      pdf.text(`• ${improvement}`, { indent: 12 });
    });
    pdf.moveDown();
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ReportRequestBody;

  if (!body.sessionId || !body.candidateId) {
    return NextResponse.json({ error: "sessionId and candidateId are required." }, { status: 400 });
  }

  const evaluation = body.evaluation ?? (await loadInterviewEvaluation(body.sessionId));
  const profile = await loadCandidateProfile(body.candidateId);
  const plan = await loadInterviewSessionPlan(body.sessionId);

  if (!evaluation) {
    return NextResponse.json(
      { error: "Evaluation not found. Run the interview evaluation first." },
      { status: 404 },
    );
  }

  const pdf = new PDFDocument({ margin: 50 });
  const buffers: Buffer[] = [];

  pdf.on("data", (chunk) => buffers.push(chunk));

  const candidateName = profile?.fullName ?? "Candidate";

  pdf.fontSize(22).fillColor("#111827").text("PrepWise.AI Mock Interview Report");
  pdf.moveDown(1.5);

  pdf.fontSize(14).fillColor("#0284c7").text(candidateName, { continued: false });
  pdf.moveDown(0.25);
  pdf.fillColor("#4b5563").fontSize(11).text(`Session ID: ${body.sessionId}`);
  if (plan) {
    pdf.fontSize(11).text(`Question Set: ${plan.questions.length} prompts`);
  }
  pdf.moveDown();

  if (profile?.summaryBullets?.length) {
    pdf.fontSize(12).fillColor("#111827").text("Resume Highlights", { underline: true });
    pdf.moveDown(0.5);
    profile.summaryBullets.slice(0, 5).forEach((bullet) => {
      pdf.text(`• ${bullet}`, { indent: 12 });
    });
    pdf.moveDown();
  }

  renderEvaluation(pdf, evaluation);

  pdf.end();

  await new Promise<void>((resolve) => pdf.on("end", resolve));

  const pdfBuffer = Buffer.concat(buffers);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length.toString(),
      "Content-Disposition": `attachment; filename="prepwise-report-${body.sessionId}.pdf"`,
    },
  });
}
