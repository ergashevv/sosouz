import { prisma } from "./prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Prisma } from "@prisma/client";

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export interface ResearchOutput {
  annual_tuition_usd: string;
  available_scholarships: { name: string; link: string }[];
  admission_requirements: Record<string, string>;
  admission_deadline: string;
  detailed_overview: string;
}

export async function performResearch(university: string, country?: string, domain?: string) {
  try {
    // Step A: Cache Check (fresh data)
    const cachedDetails = await prisma.universityDetails.findUnique({
      where: { university_name: university },
    });

    if (cachedDetails) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (cachedDetails.last_updated > thirtyDaysAgo && (cachedDetails as any).detailed_overview) {
        return cachedDetails;
      }
    }

    // Step B: External Research (Serper)
    const query = `Official tuition fees and international scholarships for ${university} ${country || ""} 2026`;
    const serperResponse = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query }),
    });

    if (!serperResponse.ok) throw new Error("Search provider error");
    const serperData = await serperResponse.json();
    const searchResults = serperData.organic || [];

    // Process with Gemini/Fallback
    let structuredData: ResearchOutput;
    try {
      const snippets = searchResults.slice(0, 5).map((r: any) => `${r.title}: ${r.snippet}`).join("\n\n");
      const prompt = `You are a professional educational consultant and leading academic researcher with extensive internal knowledge about global universities. I need official, highly detailed, and accurate academic data about ${university} (Location: ${country || 'unknown'}, Domain: ${domain || 'unknown'}). 

Combine your vast internal database with the following recent search snippets to construct a rich, authoritative academic profile.

Requirements for the output:
1. "annual_tuition_usd": Specific average tuition fee ranges for international students. Do not say "varies". Give an official estimate in USD (e.g., "$25,000 - $40,000/year").
2. "available_scholarships": List 2-4 known official scholarships for international students at this university (e.g., "Global Excellence Scholarship") and their official links (if link unknown, provide the domain).
3. "admission_requirements": An object describing concrete requirements (e.g., {"IELTS": "Overall 6.5 minimum", "GPA": "Minimum 3.0/4.0", "Documents": "Statement of Purpose, 2 LORs"}).
4. "admission_deadline": Provide specific application months or periods (e.g., "Fall: January 15, Spring: September 1"). If rolling, say so.
5. "detailed_overview": A rich, highly professional 4-5 sentence summary. Mention specific global rankings, major facilities, strong faculties, major achievements, and why international students choose this university specifically. Make it sound like a premium official directory overview.

Return ONLY a valid JSON object matching the keys: annual_tuition_usd, available_scholarships, admission_requirements, admission_deadline, detailed_overview. Do not wrap it in markdown.

Recent Search Snippets for extra context:
${snippets}`;

      const aiResult = await model.generateContent(prompt);
      const text = aiResult.response.text();
      structuredData = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch (e) {
      // Fallback
      structuredData = {
        annual_tuition_usd: "$15,000 - $35,000 (Estimate)",
        available_scholarships: [{ name: "International Excellence Award", link: `https://${domain || "google.com"}` }],
        admission_requirements: { "IELTS": "6.5+", "GPA": "3.0+" },
        admission_deadline: "Rolling Admissions",
        detailed_overview: `${university} offers world-class education with a focus on student success and global leadership.`
      };
    }

    // Step C: Save and Return
    return await prisma.universityDetails.upsert({
      where: { university_name: university },
      update: {
        tuition_fees: structuredData.annual_tuition_usd,
        scholarships: structuredData.available_scholarships as any,
        admission_requirements: structuredData.admission_requirements as any,
        admission_deadline: structuredData.admission_deadline,
        detailed_overview: structuredData.detailed_overview,
        domain: domain || null,
        country: country || null,
        last_updated: new Date(),
      } as any,
      create: {
        university_name: university,
        tuition_fees: structuredData.annual_tuition_usd,
        scholarships: structuredData.available_scholarships as any,
        admission_requirements: structuredData.admission_requirements as any,
        admission_deadline: structuredData.admission_deadline,
        detailed_overview: structuredData.detailed_overview,
        domain: domain || null,
        country: country || null,
      } as any,
    });
  } catch (error) {
    console.error("Research logic error:", error);
    return null;
  }
}
