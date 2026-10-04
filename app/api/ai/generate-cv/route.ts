import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { profession, educationLevel, section, context } = await req.json();

    if (!profession) {
      return NextResponse.json({ success: false, error: "Profession is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "AI API Key is not configured on the server" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash for rapid, lightweight API calls.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt = "";
    const eduStr = educationLevel ? `Education level: ${educationLevel}` : "Standard Professional level";

    if (section === "summary") {
      prompt = `You are a professional resume writer specializing in the Kenyan employment market. Generate a high-impact, professional resume summary (exactly 3 to 4 sentences, single paragraph, no bullet points) for a candidate with:
- Target Profession: ${profession}
- ${eduStr}
${context ? `- Additional Context: ${context}` : ""}

Focus on achievements, core strengths, and value they bring. Emphasize professionalism, matching formats seen in top Kenyan public and private sector CVs (referencing statutory compliance, public service frameworks, or relevant local targets like KRA iTax, ICPAK member guidelines, or PFM laws if finance-related). Write in implicit first-person style (e.g. "Results-oriented professional..."). Do NOT output any markdown wrappers, asterisks, title headers, or intro/outro chat text. Output ONLY the summary paragraph.`;
    } else if (section === "experience") {
      prompt = `You are a professional resume writer specializing in the Kenyan market. Generate 3 to 4 strong, action-oriented resume accomplishment bullet points for:
- Job Title: ${profession}
- ${eduStr}
${context ? `- Company/Employer: ${context}` : ""}

Rules for bullets:
1. Start each bullet point with a strong action verb (e.g., "Spearheaded", "Optimized", "Reconciled", "Coordinated").
2. Include realistic professional achievements. Where relevant to the Kenyan market, reference typical local benchmarks, organizations, or compliance obligations (e.g. iTax portal filing, KRA statutory deductions like PAYE/NHIF/NSSF/Housing Levy, ICPAK regulations, or county-level coordination like Red Cross disaster response, local media logs, or CSAT targets).
3. Integrate measurable results where appropriate (e.g. "% increase in efficiency", "KSh 1M in cost savings", "reduced processing time by 40%").
4. Output each bullet on a new line. Do NOT prefix the lines with bullet characters (like •, -, or *).
5. Do NOT include markdown bold formatting or headers. Output ONLY the plain text lines.`;
    } else if (section === "skills") {
      prompt = `You are a professional resume writer specializing in the Kenyan market. Generate a single comma-separated list of 6 to 8 key skills (technical, functional, or soft skills) for:
- Target Profession: ${profession}
- ${eduStr}
${context ? `- Skill Area/Category: ${context}` : ""}

Include local regulatory frameworks or systems where relevant (e.g., "KRA iTax Portal, PFM Act Compliance, Ledger Reconciliation" for finance, or standard tools). Output ONLY the comma-separated list of skills. Do not use bullet points, numbered lists, markdown bolding, or intro/outro conversational text.`;
    } else {
      return NextResponse.json({ success: false, error: "Invalid section specified" }, { status: 400 });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    return NextResponse.json({
      success: true,
      text: text
    });

  } catch (error: any) {
    console.error("[CV AI Generator Route Error]:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "An unexpected error occurred during AI generation"
    }, { status: 500 });
  }
}
