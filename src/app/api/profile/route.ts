import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getCurrentSessionUserFromRequest,
  normalizeCountryCode,
  sanitizeName,
  validatePhoneNumberByCountry,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

interface ProfilePatchPayload {
  firstName?: unknown;
  lastName?: unknown;
  countryCode?: unknown;
  phoneNumber?: unknown;
}

interface ProfileDeletePayload {
  password?: unknown;
}

export async function GET(request: Request) {
  const user = await getCurrentSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = (await request.json()) as ProfilePatchPayload;
    const firstNameProvided = payload.firstName !== undefined;
    const lastNameProvided = payload.lastName !== undefined;
    const countryProvided = payload.countryCode !== undefined;
    const phoneProvided = payload.phoneNumber !== undefined;

    if (!firstNameProvided && !lastNameProvided && !countryProvided && !phoneProvided) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const nextFirstName = firstNameProvided ? sanitizeName(payload.firstName) : user.firstName;
    const nextLastName = lastNameProvided ? sanitizeName(payload.lastName) : user.lastName;
    if (!nextFirstName || !nextLastName) {
      return NextResponse.json({ error: "First name and last name are required." }, { status: 400 });
    }

    const nextCountryCode = countryProvided ? normalizeCountryCode(payload.countryCode) : user.phoneCountry;
    const nextPhoneRaw = phoneProvided ? payload.phoneNumber : user.phoneE164;
    const phoneValidation = validatePhoneNumberByCountry(nextCountryCode, nextPhoneRaw);
    if (!phoneValidation.ok) {
      return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
    }

    const unchanged =
      nextFirstName === user.firstName &&
      nextLastName === user.lastName &&
      nextCountryCode === user.phoneCountry &&
      phoneValidation.phoneE164 === user.phoneE164;

    if (unchanged) {
      return NextResponse.json({
        ok: true,
        user,
      });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        first_name: nextFirstName,
        last_name: nextLastName,
        phone_country: nextCountryCode,
        phone_e164: phoneValidation.phoneE164,
      },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        firstName: updated.first_name,
        lastName: updated.last_name,
        phoneE164: updated.phone_e164,
        phoneCountry: updated.phone_country,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "This phone number is already in use." }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Failed to update profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = (await request.json()) as ProfileDeletePayload;
    const password = typeof payload.password === "string" ? payload.password : "";
    if (!password) {
      return NextResponse.json({ error: "Password is required to delete account." }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, password_hash: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const passwordValid = await verifyPassword(password, dbUser.password_hash);
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    await prisma.user.delete({ where: { id: dbUser.id } });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
