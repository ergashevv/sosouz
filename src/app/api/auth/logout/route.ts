import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, getSessionTokenFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = getSessionTokenFromRequest(request);
  if (token) {
    await prisma.userSession.deleteMany({ where: { token } });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
