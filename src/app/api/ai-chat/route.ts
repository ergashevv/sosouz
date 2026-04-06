import { NextResponse } from "next/server";
import { generateAdvisorReply } from "@/lib/ai-chat";
import { getCurrentSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

interface AiChatPayload {
  language?: "uz" | "ru" | "en";
  recommendationCountry?: string;
  screenshotDataUrl?: string;
  messages?: Array<{ role?: "user" | "assistant"; content?: string }>;
  context?: {
    name?: string;
    country?: string;
    domain?: string;
    officialWebsite?: string | null;
    programs?: string[];
    links?: Array<{ title: string; url: string }>;
  };
}

function coerceLanguage(value: unknown): "uz" | "ru" | "en" {
  if (value === "uz" || value === "ru" || value === "en") return value;
  return "uz";
}

function sanitizeMessages(
  rawMessages: AiChatPayload["messages"],
): Array<{ role: "user" | "assistant"; content: string }> {
  if (!Array.isArray(rawMessages)) return [];

  return rawMessages
    .map((item) => {
      const role = item?.role === "assistant" ? "assistant" : "user";
      const content = typeof item?.content === "string" ? item.content.trim() : "";
      return { role, content };
    })
    .filter((item) => item.content.length > 0)
    .slice(-20);
}

export async function POST(request: Request) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required for chat." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as AiChatPayload;
    const messages = sanitizeMessages(payload.messages);
    if (messages.length === 0) {
      return NextResponse.json({ error: "At least one message is required." }, { status: 400 });
    }

    const language = coerceLanguage(payload.language);
    const recommendationCountry =
      typeof payload.recommendationCountry === "string" && payload.recommendationCountry.trim()
        ? payload.recommendationCountry.trim()
        : payload.context?.country || "United Kingdom";

    const reply = await generateAdvisorReply({
      language,
      recommendationCountry,
      messages,
      screenshotDataUrl: payload.screenshotDataUrl,
      context: payload.context,
    });

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "AI chat failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1800;
const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ContextLink {
  title: string;
  url: string;
}

interface UniversityContext {
  name: string;
  country: string;
  domain: string;
  officialWebsite: string | null;
  programs: string[];
  links: ContextLink[];
}

interface ChatPayload {
  language?: "uz" | "ru" | "en";
  recommendationCountry?: string;
  screenshotDataUrl?: string;
  messages?: ChatMessage[];
  context?: UniversityContext;
}

interface PlatformUniversity {
  name: string;
  country: string;
  website: string | null;
}

function isChatRole(value: unknown): value is ChatRole {
  return value === "user" || value === "assistant";
}

function sanitizeMessages(rawMessages: unknown): ChatMessage[] {
  if (!Array.isArray(rawMessages)) return [];

  return rawMessages
    .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object"))
    .map((entry) => ({
      role: isChatRole(entry.role) ? entry.role : "user",
      content: typeof entry.content === "string" ? entry.content.trim().slice(0, MAX_MESSAGE_LENGTH) : "",
    }))
    .filter((entry) => entry.content.length > 0)
    .slice(-MAX_MESSAGES);
}

function sanitizeLanguage(value: unknown): "uz" | "ru" | "en" {
  if (value === "uz" || value === "ru" || value === "en") return value;
  return "uz";
}

function sanitizeContext(rawContext: unknown): UniversityContext | null {
  if (!rawContext || typeof rawContext !== "object") return null;
  const context = rawContext as Record<string, unknown>;
  const name = typeof context.name === "string" ? context.name.trim() : "";
  const country = typeof context.country === "string" ? context.country.trim() : "";
  const domain = typeof context.domain === "string" ? context.domain.trim() : "";
  if (!name || !country) return null;

  const officialWebsite =
    typeof context.officialWebsite === "string" && context.officialWebsite.trim()
      ? context.officialWebsite.trim()
      : null;

  const programs = Array.isArray(context.programs)
    ? context.programs
        .filter((program): program is string => typeof program === "string")
        .map((program) => program.trim())
        .filter(Boolean)
        .slice(0, 12)
    : [];

  const links = Array.isArray(context.links)
    ? context.links
        .filter((link): link is Record<string, unknown> => Boolean(link && typeof link === "object"))
        .map((link) => ({
          title: typeof link.title === "string" ? link.title.trim() : "",
          url: typeof link.url === "string" ? link.url.trim() : "",
        }))
        .filter((link) => link.title && link.url)
        .slice(0, 8)
    : [];

  return {
    name,
    country,
    domain: domain || "unknown",
    officialWebsite,
    programs,
    links,
  };
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;

  const mimeType = match[1];
  const base64 = match[2];
  const byteLength = Buffer.byteLength(base64, "base64");
  if (byteLength > MAX_SCREENSHOT_BYTES) return null;

  return { mimeType, base64 };
}

async function fetchPlatformUniversities(country: string): Promise<PlatformUniversity[]> {
  const target = country.trim();
  if (!target) return [];

  const url = new URL("http://universities.hipolabs.com/search");
  url.searchParams.set("country", target);

  const response = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!response.ok) {
    return [];
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) return [];

  return payload
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => {
      const name = typeof item.name === "string" ? item.name.trim() : "";
      const countryName = typeof item.country === "string" ? item.country.trim() : target;
      const webPages = Array.isArray(item.web_pages) ? item.web_pages : [];
      const websiteCandidate = webPages.find((entry): entry is string => typeof entry === "string");
      return {
        name,
        country: countryName,
        website: websiteCandidate || null,
      };
    })
    .filter((uni) => uni.name.length > 0)
    .slice(0, 60);
}

function buildConversationLog(messages: ChatMessage[]) {
  return messages
    .map((message) => {
      const roleLabel = message.role === "assistant" ? "AI" : "User";
      return `${roleLabel}: ${message.content}`;
    })
    .join("\n");
}

function buildSystemPrompt(args: {
  language: "uz" | "ru" | "en";
  context: UniversityContext | null;
  recommendationCountry: string;
  platformUniversities: PlatformUniversity[];
}) {
  const { language, context, recommendationCountry, platformUniversities } = args;

  const contextBlock = context
    ? JSON.stringify(
        {
          focused_university: {
            name: context.name,
            country: context.country,
            domain: context.domain,
            official_website: context.officialWebsite,
            top_programs: context.programs,
          },
          platform_links: context.links,
        },
        null,
        2,
      )
    : "null";

  const universityList = platformUniversities.map((uni, index) => ({
    index: index + 1,
    name: uni.name,
    country: uni.country,
    website: uni.website,
  }));

  return `You are SOSO AI Student Advisor.
Language: ${language.toUpperCase()}.

Main job:
- Help student choose university/program.
- Explain admissions and registration steps in practical, clickable order.
- If screenshot is provided, explain what to click next and what to verify.
- Keep answer concise and action-oriented.

Hard rules:
1) For university recommendations, ONLY use universities from PLATFORM_UNIVERSITIES below.
2) If the user asks universities outside the list, clearly say you can only recommend from platform data and ask for another country/filter.
3) Prioritize links from PLATFORM_LINKS and focused university official website when sharing where to click/read.
4) Never invent deadlines, fees, or scholarship facts. If missing, say unknown and suggest official link check.
5) End each answer with a short "Next steps" checklist (2-5 items).

Context from current page:
${contextBlock}

Recommendation country:
${recommendationCountry}

PLATFORM_UNIVERSITIES:
${JSON.stringify(universityList, null, 2)}
`;
}

function extractTextFromGemini(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const candidate = value as { text?: () => string };
  if (typeof candidate.text === "function") {
    return candidate.text().trim();
  }
  return "";
}

export async function POST(request: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "AI service is not configured. Please set GEMINI_API_KEY." },
        { status: 500 },
      );
    }

    const payload = (await request.json()) as ChatPayload;
    const messages = sanitizeMessages(payload.messages);
    if (messages.length === 0) {
      return NextResponse.json({ error: "At least one message is required." }, { status: 400 });
    }

    const language = sanitizeLanguage(payload.language);
    const context = sanitizeContext(payload.context);
    const recommendationCountryRaw =
      typeof payload.recommendationCountry === "string" ? payload.recommendationCountry.trim() : "";
    const recommendationCountry = recommendationCountryRaw || context?.country || "United Kingdom";

    const platformUniversities = await fetchPlatformUniversities(recommendationCountry);
    const systemPrompt = buildSystemPrompt({
      language,
      context,
      recommendationCountry,
      platformUniversities,
    });
    const conversationLog = buildConversationLog(messages);
    const screenshot =
      typeof payload.screenshotDataUrl === "string" ? parseDataUrl(payload.screenshotDataUrl) : null;

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const parts: Array<
      | { text: string }
      | {
          inlineData: {
            mimeType: string;
            data: string;
          };
        }
    > = [
      {
        text: `${systemPrompt}\nConversation:\n${conversationLog}`,
      },
    ];

    if (screenshot) {
      parts.push({
        text: "A screenshot from the university website is attached. Use it to guide the user step-by-step.",
      });
      parts.push({
        inlineData: {
          mimeType: screenshot.mimeType,
          data: screenshot.base64,
        },
      });
    }

    const response = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 900,
      },
    });

    const text = extractTextFromGemini(response.response) || "Kechirasiz, hozir javob bera olmadim.";
    return NextResponse.json({ reply: text });
  } catch (error: unknown) {
    console.error("AI chat route error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
