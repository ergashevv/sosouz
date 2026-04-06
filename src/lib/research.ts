import { prisma } from "./prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CACHE_TTL_DAYS = 14;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

interface ResearchSource {
  title: string;
  link: string;
  snippet: string;
}

export interface ResearchOutput {
  annual_tuition_usd: string;
  available_scholarships: { name: string; link: string }[];
  programs: string[];
  admission_requirements: Record<string, string>;
  admission_deadline: string;
  detailed_overview: string;
  confidence_score: number;
}

function isFresh(lastUpdated: Date, ttlDays = CACHE_TTL_DAYS) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - ttlDays);
  return lastUpdated > threshold;
}

function computeNextRefresh(ttlDays = CACHE_TTL_DAYS) {
  const next = new Date();
  next.setDate(next.getDate() + ttlDays);
  return next;
}

function hasMinimumDetails(
  details: Awaited<ReturnType<typeof prisma.universityDetails.findUnique>>,
) {
  return Boolean(
    details?.detailed_overview &&
      details?.tuition_fees &&
      details?.admission_deadline &&
      details?.scholarships &&
      details?.programs,
  );
}

function buildSourceLinks(rawResults: unknown): ResearchSource[] {
  const results = Array.isArray(rawResults) ? rawResults : [];
  const unique = new Set<string>();
  const sources: ResearchSource[] = [];

  for (const item of results) {
    if (sources.length >= 8) break;
    if (!item || typeof item !== "object") continue;

    const candidate = item as { title?: unknown; link?: unknown; snippet?: unknown };
    const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
    const link = typeof candidate.link === "string" ? candidate.link.trim() : "";
    const snippet = typeof candidate.snippet === "string" ? candidate.snippet.trim() : "";
    if (!link || unique.has(link)) continue;

    unique.add(link);
    sources.push({
      title: title || "Untitled source",
      link,
      snippet: snippet || "No snippet provided.",
    });
  }

  return sources;
}

function extractJsonObject(input: string) {
  const cleaned = input.replace(/```json|```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return cleaned;
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function normalizeResearchOutput(
  raw: unknown,
  university: string,
  fallbackDomain?: string,
): ResearchOutput {
  const safeRaw = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const rawScholarships = Array.isArray(safeRaw.available_scholarships)
    ? safeRaw.available_scholarships
    : [];
  const scholarships = rawScholarships
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      const link = typeof record.link === "string" ? record.link.trim() : "";
      if (!name) return null;

      return {
        name,
        link: link || `https://${fallbackDomain || "google.com"}`,
      };
    })
    .filter((item): item is { name: string; link: string } => Boolean(item));

  const rawPrograms = Array.isArray(safeRaw.programs) ? safeRaw.programs : [];
  const programs = rawPrograms
    .map((program) => (typeof program === "string" ? program.trim() : ""))
    .filter(Boolean)
    .slice(0, 12);

  const requirementsRaw =
    safeRaw.admission_requirements && typeof safeRaw.admission_requirements === "object"
      ? (safeRaw.admission_requirements as Record<string, unknown>)
      : {};
  const admissionRequirements = Object.entries(requirementsRaw).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (!key) return acc;
      const normalizedValue =
        typeof value === "string"
          ? value
          : typeof value === "number" || typeof value === "boolean"
            ? String(value)
            : "";

      if (normalizedValue.trim()) {
        acc[key] = normalizedValue.trim();
      }

      return acc;
    },
    {},
  );

  const confidenceScore =
    typeof safeRaw.confidence_score === "number" && Number.isFinite(safeRaw.confidence_score)
      ? Math.max(0, Math.min(1, safeRaw.confidence_score))
      : 0.6;

  return {
    annual_tuition_usd:
      typeof safeRaw.annual_tuition_usd === "string" && safeRaw.annual_tuition_usd.trim()
        ? safeRaw.annual_tuition_usd.trim()
        : "$15,000 - $35,000 (Estimate)",
    available_scholarships:
      scholarships.length > 0
        ? scholarships
        : [{ name: "International Excellence Award", link: `https://${fallbackDomain || "google.com"}` }],
    programs: programs.length > 0 ? programs : ["Information not specified by official sources"],
    admission_requirements:
      Object.keys(admissionRequirements).length > 0
        ? admissionRequirements
        : { IELTS: "6.5+", GPA: "3.0+" },
    admission_deadline:
      typeof safeRaw.admission_deadline === "string" && safeRaw.admission_deadline.trim()
        ? safeRaw.admission_deadline.trim()
        : "Rolling Admissions",
    detailed_overview:
      typeof safeRaw.detailed_overview === "string" && safeRaw.detailed_overview.trim()
        ? safeRaw.detailed_overview.trim()
        : `${university} offers world-class education with a focus on student success and global leadership.`,
    confidence_score: confidenceScore,
  };
}

export async function performResearch(
  university: string,
  country?: string,
  domain?: string,
  lang = "en",
) {
  const cachedDetails = await prisma.universityDetails.findUnique({
    where: { university_name: university },
  });

  if (cachedDetails && isFresh(cachedDetails.last_updated) && hasMinimumDetails(cachedDetails)) {
    return cachedDetails;
  }

  if (!SERPER_API_KEY || !GEMINI_API_KEY) {
    if (cachedDetails) return cachedDetails;
    console.error("Missing SERPER_API_KEY or GEMINI_API_KEY.");
    return null;
  }

  try {
    const siteConstraint = domain && domain !== "unknown" ? ` site:${domain}` : "";
    const query =
      `Official tuition fees, scholarships, study programs, admission requirements, and deadlines ` +
      `for ${university} ${country || ""} 2026${siteConstraint}`;

    const serperResponse = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 10 }),
    });

    if (!serperResponse.ok) {
      throw new Error("Search provider error");
    }

    const serperData: unknown = await serperResponse.json();
    const searchResults =
      serperData && typeof serperData === "object" && Array.isArray((serperData as { organic?: unknown }).organic)
        ? (serperData as { organic: unknown[] }).organic
        : [];
    const sources = buildSourceLinks(searchResults);
    const snippetBlock = sources
      .slice(0, 6)
      .map((source, index) => `${index + 1}. ${source.title}\nURL: ${source.link}\nSnippet: ${source.snippet}`)
      .join("\n\n");

    const prompt = `You are a senior education analyst. Build a concise but complete university profile.

University: ${university}
Country: ${country || "unknown"}
Official domain: ${domain || "unknown"}
Target language for descriptive text: ${lang.toUpperCase()}

Use the provided sources first. If data is missing, make conservative estimates and label uncertainty through confidence_score.

Return ONLY valid JSON with this exact schema:
{
  "annual_tuition_usd": "string",
  "available_scholarships": [{ "name": "string", "link": "string" }],
  "programs": ["string"],
  "admission_requirements": { "requirement": "value" },
  "admission_deadline": "string",
  "detailed_overview": "string",
  "confidence_score": 0.0
}

Constraints:
- detailed_overview must be 4-5 sentences in ${lang.toUpperCase()}.
- Include 4-8 programs.
- Include 2-5 scholarships if available.
- confidence_score must be between 0 and 1.
- Do not use markdown.

Sources:
${snippetBlock || "No external snippets available."}`;

    const aiResult = await model.generateContent(prompt);
    const text = aiResult.response.text();
    const parsed = JSON.parse(extractJsonObject(text));
    const structuredData = normalizeResearchOutput(parsed, university, domain);

    return await prisma.universityDetails.upsert({
      where: { university_name: university },
      update: {
        tuition_fees: structuredData.annual_tuition_usd,
        scholarships: structuredData.available_scholarships,
        programs: structuredData.programs,
        admission_requirements: structuredData.admission_requirements,
        admission_deadline: structuredData.admission_deadline,
        detailed_overview: structuredData.detailed_overview,
        source_links: sources.map((source) => source.link),
        data_confidence: structuredData.confidence_score,
        refresh_status: "fresh",
        next_refresh_at: computeNextRefresh(),
        domain: domain || null,
        country: country || null,
      },
      create: {
        university_name: university,
        tuition_fees: structuredData.annual_tuition_usd,
        scholarships: structuredData.available_scholarships,
        programs: structuredData.programs,
        admission_requirements: structuredData.admission_requirements,
        admission_deadline: structuredData.admission_deadline,
        detailed_overview: structuredData.detailed_overview,
        source_links: sources.map((source) => source.link),
        data_confidence: structuredData.confidence_score,
        refresh_status: "fresh",
        next_refresh_at: computeNextRefresh(),
        domain: domain || null,
        country: country || null,
      },
    });
  } catch (error) {
    console.error("Research logic error:", error);
    if (cachedDetails) {
      return await prisma.universityDetails.update({
        where: { university_name: university },
        data: { refresh_status: "stale" },
      });
    }
    return null;
  }
}
