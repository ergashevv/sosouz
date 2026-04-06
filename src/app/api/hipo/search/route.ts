import { NextResponse } from "next/server";

const HIPO_BASE_URL = "http://universities.hipolabs.com/search";

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

    const upstreamUrl = new URL(HIPO_BASE_URL);
    if (country) upstreamUrl.searchParams.set("country", country);
    if (name) upstreamUrl.searchParams.set("name", name);

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: "University provider request failed." },
        { status: upstreamResponse.status },
      );
    }

    const data: unknown = await upstreamResponse.json();
    if (!Array.isArray(data)) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "University provider request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
