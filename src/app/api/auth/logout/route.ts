import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, getSessionTokenFromCookies } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const token = await getSessionTokenFromCookies();
  if (token) {
    await prisma.userSession.deleteMany({ where: { token } });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
