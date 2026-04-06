import { NextResponse } from "next/server";
import {
  getSessionTokenFromRequest,
  getSessionUserByToken,
  refreshSession,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = getSessionTokenFromRequest(request);
  const user = await getSessionUserByToken(token);
  if (!user) {
    return NextResponse.json(
      { authenticated: false },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  const response = NextResponse.json(
    {
      authenticated: true,
      user,
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );

  if (token) {
    await refreshSession(token);
  }

  return response;
}
