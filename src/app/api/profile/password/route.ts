import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  getSessionTokenFromCookies,
  hashPassword,
  setSessionCookie,
  validatePassword,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

interface PasswordResetPayload {
  currentPassword?: unknown;
  newPassword?: unknown;
}

export async function POST(request: Request) {
  try {
    const token = await getSessionTokenFromCookies();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const session = await prisma.userSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expires_at <= new Date()) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = (await request.json()) as PasswordResetPayload;
    const currentPassword = typeof payload.currentPassword === "string" ? payload.currentPassword : "";
    const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";

    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required." }, { status: 400 });
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.ok) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    const validCurrentPassword = await verifyPassword(currentPassword, session.user.password_hash);
    if (!validCurrentPassword) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    const samePassword = await verifyPassword(newPassword, session.user.password_hash);
    if (samePassword) {
      return NextResponse.json({ error: "New password must be different from the old password." }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user_id },
        data: { password_hash: passwordHash },
      });
      await tx.userSession.deleteMany({
        where: { user_id: session.user_id },
      });
    });

    const nextToken = await createSession(session.user_id);
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, nextToken);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Password reset failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
