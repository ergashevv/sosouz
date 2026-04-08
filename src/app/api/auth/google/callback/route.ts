import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

const GOOGLE_STATE_COOKIE = "soso_google_oauth_state";
const FALLBACK_PHONE_COUNTRY = "US";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
};

type AuthUserRecord = {
  id: string;
  google_sub?: string | null;
};

type UserRepo = {
  findFirst: (args: unknown) => Promise<AuthUserRecord | null>;
  create: (args: unknown) => Promise<AuthUserRecord>;
  update: (args: unknown) => Promise<AuthUserRecord>;
};

const userRepo = (prisma as unknown as { user: UserRepo }).user;

function coerceRelativePath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/chat";
  }
  return value;
}

function clearGoogleStateCookie(response: NextResponse) {
  response.cookies.set(GOOGLE_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google/callback",
    maxAge: 0,
  });
}

function safeName(value: string | undefined, fallback: string): string {
  const trimmed = typeof value === "string" ? value.trim().slice(0, 60) : "";
  return trimmed || fallback;
}

function splitFullName(value: string | undefined): { firstName: string; lastName: string } {
  if (typeof value !== "string") return { firstName: "Google", lastName: "User" };
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Google", lastName: "User" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "User" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ").slice(0, 60) };
}

function syntheticPhoneFromGoogleSub(sub: string): string {
  const hashHex = createHash("sha256").update(sub).digest("hex");
  // Keep this ES2019-compatible (no BigInt literal), while staying deterministic.
  const sampleHex = hashHex.slice(0, 13);
  const numeric = Number.parseInt(sampleHex, 16);
  const raw = Number.isFinite(numeric) ? numeric % 10_000_000_000 : 0;
  const tenDigits = raw.toString().padStart(10, "0");
  return `+1${tenDigits}`;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get(GOOGLE_STATE_COOKIE)?.value || null;

  if (!code || !state || !storedState || state !== storedState) {
    const response = NextResponse.redirect(new URL("/login?error=google_state_mismatch", requestUrl.origin));
    clearGoogleStateCookie(response);
    return response;
  }

  const parsedState = (() => {
    try {
      const raw = Buffer.from(storedState, "base64url").toString("utf8");
      const data = JSON.parse(raw) as { next?: string };
      return { next: coerceRelativePath(data.next) };
    } catch {
      return { next: "/chat" };
    }
  })();

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const response = NextResponse.redirect(new URL("/login?error=google_not_configured", requestUrl.origin));
    clearGoogleStateCookie(response);
    return response;
  }

  const redirectUri = new URL("/api/auth/google/callback", requestUrl.origin).toString();

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  const tokenJson = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenResponse.ok || !tokenJson.access_token) {
    const response = NextResponse.redirect(new URL("/login?error=google_token_failed", requestUrl.origin));
    clearGoogleStateCookie(response);
    return response;
  }

  const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    cache: "no-store",
  });
  const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;

  if (!userInfoResponse.ok || !userInfo.sub) {
    const response = NextResponse.redirect(new URL("/login?error=google_profile_failed", requestUrl.origin));
    clearGoogleStateCookie(response);
    return response;
  }

  const fallbackName = splitFullName(userInfo.name);
  const firstName = safeName(userInfo.given_name, fallbackName.firstName);
  const lastName = safeName(userInfo.family_name, fallbackName.lastName);
  const email = typeof userInfo.email === "string" ? userInfo.email.trim().toLowerCase() : null;

  let user = await userRepo.findFirst({
    where: {
      OR: [{ google_sub: userInfo.sub }, ...(email ? [{ email }] : [])],
    },
    select: { id: true, google_sub: true },
  });

  if (!user) {
    const syntheticPassword = await bcrypt.hash(randomUUID(), 10);
    user = await userRepo.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        google_sub: userInfo.sub,
        phone_country: FALLBACK_PHONE_COUNTRY,
        phone_e164: syntheticPhoneFromGoogleSub(userInfo.sub),
        password_hash: syntheticPassword,
      },
      select: { id: true, google_sub: true },
    });
  } else if (!user.google_sub) {
    user = await userRepo.update({
      where: { id: user.id },
      data: { google_sub: userInfo.sub, email: email ?? undefined },
      select: { id: true, google_sub: true },
    });
  }

  const token = await createSession(user.id);
  const redirectDestination = new URL("/auth/google/callback", requestUrl.origin);
  redirectDestination.searchParams.set("token", token);
  redirectDestination.searchParams.set("next", parsedState.next);

  const response = NextResponse.redirect(redirectDestination);
  clearGoogleStateCookie(response);
  return response;
}
