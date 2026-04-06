import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "soso_session";
const SESSION_TTL_DAYS = 30;

export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  phoneE164: string;
  phoneCountry: string;
}

export function sanitizeName(value: unknown, max = 60): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

export function normalizeCountryCode(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
}

export function validatePassword(value: unknown): { ok: boolean; error?: string } {
  if (typeof value !== "string" || value.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (value.length > 128) {
    return { ok: false, error: "Password is too long." };
  }
  return { ok: true };
}

export function validatePhoneNumberByCountry(countryCode: string, rawPhone: unknown) {
  if (typeof rawPhone !== "string") {
    return { ok: false as const, error: "Phone number is required." };
  }
  const cleaned = rawPhone.trim();
  if (!cleaned) {
    return { ok: false as const, error: "Phone number is required." };
  }

  try {
    const parsed = parsePhoneNumberFromString(cleaned, countryCode as CountryCode);
    if (!parsed || !parsed.isValid()) {
      return {
        ok: false as const,
        error: "Invalid phone number format for selected country.",
      };
    }
    if (parsed.country && parsed.country !== countryCode) {
      return {
        ok: false as const,
        error: "Phone number does not match selected country.",
      };
    }
    return {
      ok: true as const,
      phoneE164: parsed.number,
      phoneNational: parsed.formatNational(),
    };
  } catch {
    return { ok: false as const, error: "Invalid phone number." };
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

  await prisma.userSession.create({
    data: {
      user_id: userId,
      token,
      expires_at: expiresAt,
    },
  });

  return token;
}

export function setSessionCookie(response: NextResponse, token: string) {
  const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60;
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionTokenFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function getSessionUserByToken(token: string | null): Promise<SessionUser | null> {
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expires_at <= new Date()) {
    await prisma.userSession.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }

  return {
    id: session.user.id,
    firstName: session.user.first_name,
    lastName: session.user.last_name,
    phoneE164: session.user.phone_e164,
    phoneCountry: session.user.phone_country,
  };
}

export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  const token = await getSessionTokenFromCookies();
  return await getSessionUserByToken(token);
}
