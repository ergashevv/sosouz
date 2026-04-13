import { NextResponse } from "next/server";
import { getHipoSearchResultsCached } from "@/lib/hipo-search";

export const runtime = "nodejs";

function sanitizeParam(value: string | null, max = 120) {
  if (!value) return "";
  return value.trim().slice(0, max);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = sanitizeParam(searchParams.get("country"));
    const name = sanitizeParam(searchParams.get("name"));

    if (!country && !name) {
      return NextResponse.json(
        { error: "Specify at least a country or a university name." },
        { status: 400 },
      );
    }

    const { data, source } = await getHipoSearchResultsCached({ country, name });

    const res = NextResponse.json(data, { status: 200 });
    res.headers.set("X-Hipo-Source", source);
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "University provider request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
