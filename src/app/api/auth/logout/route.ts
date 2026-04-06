import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, getSessionTokenFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

type UserSessionRepository = {
  deleteMany: (args: unknown) => Promise<unknown>;
};

const userSessionRepo = (prisma as unknown as { userSession: UserSessionRepository }).userSession;

export async function POST(request: Request) {
  const token = getSessionTokenFromRequest(request);
  if (token) {
    await userSessionRepo.deleteMany({ where: { token } });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
