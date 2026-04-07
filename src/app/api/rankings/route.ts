import { NextResponse } from "next/server";
import { getRankingSnapshot } from "@/lib/rankings";

export const runtime = "nodejs";

function toDataset(value: string | null): "world-top-100" | "south-korea-top-10" {
  if (value === "south-korea-top-10") return "south-korea-top-10";
  return "world-top-100";
}

function toYear(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  const year = Math.trunc(parsed);
  if (year < 2000 || year > 2100) return undefined;
  return year;
}

function toMonthSnapshot(value: string | null) {
  if (!value) return undefined;
  return /^\d{4}-\d{2}$/.test(value) ? value : undefined;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dataset = toDataset(searchParams.get("dataset"));
    const year = toYear(searchParams.get("year"));
    const monthSnapshot = toMonthSnapshot(searchParams.get("month"));

    const snapshot = await getRankingSnapshot({
      dataset,
      year,
      monthSnapshot,
    });

    if (!snapshot) {
      return NextResponse.json(
        {
          error: "Ranking snapshot not found.",
          hint: "Run /api/rankings/sync first.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(snapshot);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to read rankings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
