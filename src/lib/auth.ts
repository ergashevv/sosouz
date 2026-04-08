import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "soso_session";
const SESSION_TTL_DAYS = 30;
export const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  avatarUrl: string | null;
  authProvider: string;
  hasPassword: boolean;
  phoneE164: string;
  phoneCountry: string;
}

type UserSessionClient = {
  findUnique: (args: unknown) => Promise<UserSessionRecord | null>;
  create: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
};

type UserSessionRecord = {
  id: string;
  expires_at: Date;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    avatar_url: string | null;
    auth_provider: string;
    has_password: boolean;
    phone_e164: string;
    phone_country: string;
  };
};

const userSessionClient = (prisma as unknown as { userSession: UserSessionClient }).userSession;

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
  const expiresAt = getNextSessionExpiry();

  await userSessionClient.create({
    data: {
      user_id: userId,
      token,
      expires_at: expiresAt,
    },
  });

  return token;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    expires: getNextSessionExpiry(),
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

export function getSessionTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const [scheme, token] = authHeader.split(" ");
    if (scheme?.toLowerCase() === "bearer" && token) {
      return token.trim();
    }
  }

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const entries = cookieHeader.split(";").map((chunk) => chunk.trim());
  for (const entry of entries) {
    if (!entry.startsWith(`${SESSION_COOKIE_NAME}=`)) continue;
    const value = entry.slice(`${SESSION_COOKIE_NAME}=`.length);
    if (!value) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}

export async function getSessionUserByToken(token: string | null): Promise<SessionUser | null> {
  if (!token) return null;

  const session = await userSessionClient.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expires_at <= new Date()) {
    await userSessionClient.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }

  return {
    id: session.user.id,
    firstName: session.user.first_name,
    lastName: session.user.last_name,
    email: session.user.email,
    avatarUrl: session.user.avatar_url,
    authProvider: session.user.auth_provider,
    hasPassword: session.user.has_password,
    phoneE164: session.user.phone_e164,
    phoneCountry: session.user.phone_country,
  };
}

export async function refreshSession(token: string): Promise<boolean> {
  try {
    await userSessionClient.update({
      where: { token },
      data: { expires_at: getNextSessionExpiry() },
    });
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  const token = await getSessionTokenFromCookies();
  return await getSessionUserByToken(token);
}

export async function getCurrentSessionUserFromRequest(request: Request): Promise<SessionUser | null> {
  const token = getSessionTokenFromRequest(request);
  return await getSessionUserByToken(token);
}

function getNextSessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return expiresAt;
}
