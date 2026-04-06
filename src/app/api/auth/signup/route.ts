import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  hashPassword,
  normalizeCountryCode,
  sanitizeName,
  validatePassword,
  validatePhoneNumberByCountry,
} from "@/lib/auth";

export const runtime = "nodejs";

interface SignupPayload {
  firstName?: string;
  lastName?: string;
  countryCode?: string;
  phoneNumber?: string;
  password?: string;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SignupPayload;
    const firstName = sanitizeName(payload.firstName);
    const lastName = sanitizeName(payload.lastName);
    const countryCode = normalizeCountryCode(payload.countryCode);

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First name and last name are required." }, { status: 400 });
    }

    const passwordCheck = validatePassword(payload.password);
    if (!passwordCheck.ok) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    const phoneValidation = validatePhoneNumberByCountry(countryCode, payload.phoneNumber);
    if (!phoneValidation.ok) {
      return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
    }

    const passwordHash = await hashPassword(payload.password as string);
    const userModel = prisma as unknown as {
      user: {
        create: (args: {
          data: {
            first_name: string;
            last_name: string;
            phone_country: string;
            phone_e164: string;
            password_hash: string;
          };
        }) => Promise<{
          id: string;
          first_name: string;
          last_name: string;
          phone_e164: string;
        }>;
      };
    };
    const createdUser = await userModel.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        phone_country: countryCode,
        phone_e164: phoneValidation.phoneE164,
        password_hash: passwordHash,
      },
    });

    const token = await createSession(createdUser.id);
    return NextResponse.json({
      ok: true,
      token,
      user: {
        id: createdUser.id,
        firstName: createdUser.first_name,
        lastName: createdUser.last_name,
        phoneE164: createdUser.phone_e164,
      },
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "This phone number is already registered." }, { status: 409 });
    }

    const message = error instanceof Error ? error.message : "Signup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
