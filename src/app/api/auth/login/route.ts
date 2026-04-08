import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  normalizeCountryCode,
  validatePhoneNumberByCountry,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

interface LoginPayload {
  countryCode?: string;
  phoneNumber?: string;
  password?: string;
}

type AuthUserRecord = {
  id: string;
  first_name: string;
  last_name: string;
  auth_provider: string;
  has_password: boolean;
  phone_e164: string;
  password_hash: string;
};

type UserAuthRepository = {
  findUnique: (args: unknown) => Promise<AuthUserRecord | null>;
};

const userRepo = (prisma as unknown as { user: UserAuthRepository }).user;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LoginPayload;
    const countryCode = normalizeCountryCode(payload.countryCode);
    const password = typeof payload.password === "string" ? payload.password : "";

    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const phoneValidation = validatePhoneNumberByCountry(countryCode, payload.phoneNumber);
    if (!phoneValidation.ok) {
      return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
    }

    const user = await userRepo.findUnique({
      where: { phone_e164: phoneValidation.phoneE164 },
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }
    if (!user.has_password) {
      return NextResponse.json(
        { error: "This account uses Google sign-in. Continue with Google to access it." },
        { status: 400 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    const token = await createSession(user.id);
    return NextResponse.json({
      ok: true,
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneE164: user.phone_e164,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
