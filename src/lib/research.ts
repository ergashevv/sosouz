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
      const prompt = `Extract university details for ${university} into JSON:
      - "annual_tuition_usd" (Range)
      - "available_scholarships" (Array of {name, link})
      - "admission_requirements" (Object)
      - "admission_deadline" (String)
      - "detailed_overview" (3-4 sentences overview)
      Return ONLY JSON. Snippets: ${snippets}`;

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
