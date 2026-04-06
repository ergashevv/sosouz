import "server-only";

import { Buffer } from "buffer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

export type AdvisorRole = "user" | "assistant";

export interface AdvisorMessage {
  role: AdvisorRole;
  content: string;
}

export interface AdvisorLink {
  title: string;
  url: string;
}

export interface AdvisorContext {
  name?: string;
  country?: string;
  domain?: string;
  officialWebsite?: string | null;
  programs?: string[];
  links?: AdvisorLink[];
}

interface PlatformUniversity {
  name: string;
  country: string;
  website: string | null;
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
  if (!response.ok) return [];

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) return [];

  return payload
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => {
      const name = typeof item.name === "string" ? item.name.trim() : "";
      const webPages = Array.isArray(item.web_pages) ? item.web_pages : [];
      const website = webPages.find((entry): entry is string => typeof entry === "string") || null;
      return {
        name,
        country: typeof item.country === "string" ? item.country : target,
        website,
      };
    })
    .filter((item) => item.name)
    .slice(0, 80);
}

function buildConversationLog(messages: AdvisorMessage[]) {
  return messages
    .map((message) => `${message.role === "assistant" ? "AI" : "User"}: ${message.content}`)
    .join("\n");
}

function buildSystemPrompt(
  language: "uz" | "ru" | "en",
  recommendationCountry: string,
  platformUniversities: PlatformUniversity[],
  context?: AdvisorContext,
) {
  const contextBlock = JSON.stringify(
    {
      focused_university: context?.name
        ? {
            name: context.name,
            country: context.country || recommendationCountry,
            domain: context.domain || "unknown",
            official_website: context.officialWebsite || null,
            top_programs: context.programs || [],
          }
        : null,
      platform_links: context?.links || [],
    },
    null,
    2,
  );

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
- Explain admissions and registration steps in practical order.
- If screenshot is provided, explain what to click next step-by-step.
- Keep answer concise, practical, and easy to follow.

Hard rules:
1) For university recommendations, ONLY use universities from PLATFORM_UNIVERSITIES.
2) If user asks universities outside the list, clearly say you can only recommend from platform data.
3) Prefer official links and provided platform links.
4) Never invent fees, deadlines, or scholarship facts.
5) End every answer with "Next steps" checklist (2-5 bullets).

Current context:
${contextBlock}

Recommendation country:
${recommendationCountry}

PLATFORM_UNIVERSITIES:
${JSON.stringify(universityList, null, 2)}
`;
}

export async function generateAdvisorReply(args: {
  language: "uz" | "ru" | "en";
  recommendationCountry: string;
  messages: AdvisorMessage[];
  screenshotDataUrl?: string;
  context?: AdvisorContext;
}) {
  if (!GEMINI_API_KEY) {
    throw new Error("AI service is not configured.");
  }
  if (args.messages.length === 0) {
    throw new Error("Conversation is empty.");
  }

  const platformUniversities = await fetchPlatformUniversities(args.recommendationCountry);
  const systemPrompt = buildSystemPrompt(
    args.language,
    args.recommendationCountry,
    platformUniversities,
    args.context,
  );
  const conversationLog = buildConversationLog(args.messages.slice(-20));
  const screenshot =
    typeof args.screenshotDataUrl === "string" ? parseDataUrl(args.screenshotDataUrl) : null;

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const parts: Array<
    | { text: string }
    | {
        inlineData: {
          mimeType: string;
          data: string;
        };
      }
  > = [{ text: `${systemPrompt}\nConversation:\n${conversationLog}` }];

  if (screenshot) {
    parts.push({
      text: "Screenshot is attached. Explain where to click and why.",
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

  const text = response.response.text().trim();
  if (!text) {
    throw new Error("AI returned empty response.");
  }
  return text;
}
