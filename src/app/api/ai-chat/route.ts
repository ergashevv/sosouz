import { NextResponse } from "next/server";
import { generateAdvisorReply, toUserFacingAiError } from "@/lib/ai-chat";
import { getCurrentSessionUserFromRequest } from "@/lib/auth";

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
    nationalRank?: number;
    worldRank?: number;
    rankingSourceUrl?: string | null;
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
    .map((item): { role: "user" | "assistant"; content: string } => {
      const role: "user" | "assistant" = item?.role === "assistant" ? "assistant" : "user";
      const content = typeof item?.content === "string" ? item.content.trim() : "";
      return { role, content };
    })
    .filter((item) => item.content.length > 0)
    .slice(-20);
}

export async function POST(request: Request) {
  const user = await getCurrentSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required for chat." }, { status: 401 });
  }

  let language: "uz" | "ru" | "en" = "uz";
  try {
    const payload = (await request.json()) as AiChatPayload;
    const messages = sanitizeMessages(payload.messages);
    if (messages.length === 0) {
      return NextResponse.json({ error: "At least one message is required." }, { status: 400 });
    }

    language = coerceLanguage(payload.language);
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
    const errorStatus =
      typeof (error as { status?: unknown })?.status === "number"
        ? (error as { status: number }).status
        : typeof (error as { statusCode?: unknown })?.statusCode === "number"
          ? (error as { statusCode: number }).statusCode
          : null;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[ai-chat] AI request failed", {
      status: errorStatus,
      message: errorMessage,
    });
    const userFacing = toUserFacingAiError(error, language);
    return NextResponse.json({ error: userFacing.message }, { status: userFacing.status });
  }
}
