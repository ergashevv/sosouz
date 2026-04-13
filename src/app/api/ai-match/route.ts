import { NextResponse } from "next/server";
import { generateAiShortlistMatch } from "@/lib/ai-shortlist";
import { toUserFacingAiError } from "@/lib/ai-chat";
import { getCurrentSessionUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

function coerceLanguage(value: unknown): "uz" | "ru" | "en" {
  if (value === "uz" || value === "ru" || value === "en") return value;
  return "uz";
}

export async function POST(request: Request) {
  const user = await getCurrentSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let language: "uz" | "ru" | "en" = "uz";
  try {
    const payload = (await request.json()) as {
      language?: unknown;
      country?: unknown;
      goals?: unknown;
      studyField?: unknown;
      budgetTier?: unknown;
    };

    language = coerceLanguage(payload.language);
    const country = typeof payload.country === "string" ? payload.country.trim() : "";
    const goals = typeof payload.goals === "string" ? payload.goals.trim() : "";
    const studyField = typeof payload.studyField === "string" ? payload.studyField.trim() : "";
    const rawTier = payload.budgetTier;
    const budgetTier =
      rawTier === "low" || rawTier === "mid" || rawTier === "high" ? rawTier : "unspecified";

    if (goals.length < 8) {
      return NextResponse.json(
        { error: "Please describe your goals in at least a few words." },
        { status: 400 },
      );
    }

    const result = await generateAiShortlistMatch({
      language,
      country,
      goals,
      studyField: studyField || undefined,
      budgetTier,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[ai-match] failed", { message: errorMessage });
    const userFacing = toUserFacingAiError(error, language);
    return NextResponse.json({ error: userFacing.message }, { status: userFacing.status });
  }
}
