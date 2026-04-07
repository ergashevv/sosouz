import { NextResponse } from "next/server";
import { hasMonthlySnapshots, syncMonthlyRankings } from "@/lib/rankings";

export const runtime = "nodejs";

function parseYear(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return new Date().getUTCFullYear();
  const year = Math.trunc(value);
  if (year < 2000 || year > 2100) return new Date().getUTCFullYear();
  return year;
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  const xCronSecret = request.headers.get("x-cron-secret");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const fromQuery = new URL(request.url).searchParams.get("secret") || "";

  return bearerToken === secret || xCronSecret === secret || fromQuery === secret;
}

async function handleSync(request: Request, body?: { year?: number; force?: boolean }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const year = parseYear(body?.year);
  const force = Boolean(body?.force);

  if (!force) {
    const hasCurrent = await hasMonthlySnapshots(year);
    if (hasCurrent) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "Current month snapshot already exists.",
      });
    }
  }

  const result = await syncMonthlyRankings(year);
  return NextResponse.json({ ok: true, skipped: false, result });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { year?: number; force?: boolean };
    return await handleSync(request, payload);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearValue = searchParams.get("year");
    const forceValue = searchParams.get("force");

    const body = {
      year: yearValue ? Number(yearValue) : undefined,
      force: forceValue === "1" || forceValue === "true",
    };
    return await handleSync(request, body);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
