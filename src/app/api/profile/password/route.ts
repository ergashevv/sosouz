import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  getSessionTokenFromRequest,
  hashPassword,
  validatePassword,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

interface PasswordResetPayload {
  currentPassword?: unknown;
  newPassword?: unknown;
}

type SessionRecord = {
  user_id: string;
  expires_at: Date;
  user: {
    password_hash: string;
    has_password: boolean;
  };
};

type UserSessionRepository = {
  findUnique: (args: unknown) => Promise<SessionRecord | null>;
  deleteMany: (args: unknown) => Promise<unknown>;
};

type UserRepository = {
  update: (args: unknown) => Promise<unknown>;
};

type TransactionClient = {
  user: UserRepository;
  userSession: UserSessionRepository;
};

const userSessionRepo = (prisma as unknown as { userSession: UserSessionRepository }).userSession;

export async function POST(request: Request) {
  try {
    const token = getSessionTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const session = await userSessionRepo.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expires_at <= new Date()) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = (await request.json()) as PasswordResetPayload;
    const currentPassword = typeof payload.currentPassword === "string" ? payload.currentPassword : "";
    const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.ok) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    if (session.user.has_password && !currentPassword) {
      return NextResponse.json({ error: "Current password is required." }, { status: 400 });
    }

    if (currentPassword) {
      const validCurrentPassword = await verifyPassword(currentPassword, session.user.password_hash);
      if (!validCurrentPassword) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
      }
    }

    const samePassword = await verifyPassword(newPassword, session.user.password_hash);
    if (samePassword) {
      return NextResponse.json({ error: "New password must be different from the old password." }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.$transaction(async (tx) => {
      const typedTx = tx as unknown as TransactionClient;
      await typedTx.user.update({
        where: { id: session.user_id },
        data: {
          password_hash: passwordHash,
          has_password: true,
        },
      });
      await typedTx.userSession.deleteMany({
        where: { user_id: session.user_id },
      });
    });

    const nextToken = await createSession(session.user_id);
    return NextResponse.json({ ok: true, token: nextToken });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Password reset failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
