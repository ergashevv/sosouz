import { NextResponse } from "next/server";
import { performResearch } from "@/lib/research";

export async function POST(req: Request) {
  try {
    const { university, country, domain } = await req.json();

    if (!university) {
      return NextResponse.json({ error: "University name is required" }, { status: 400 });
    }

    const result = await performResearch(university, country, domain);
    
    if (!result) {
      return NextResponse.json({ error: "Research failed" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Research Route Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
