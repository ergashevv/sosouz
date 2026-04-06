import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const LOGO_FETCH_TIMEOUT_MS = 6000;
const LOGO_MAX_BYTES = 1_000_000; // 1 MB

type LogoRow = {
  id: string;
  domain: string;
  mime_type: string;
  image_data: Uint8Array | Buffer;
};

function normalizeDomain(rawDomain: string): string {
  const trimmed = rawDomain.trim().toLowerCase();
  if (!trimmed) return "";

  const noProtocol = trimmed.replace(/^https?:\/\//, "");
  const hostOnly = noProtocol.split("/")[0]?.split("?")[0] || "";
  return hostOnly.replace(/^www\./, "");
}

function isValidLogoMimeType(value: string | null): boolean {
  if (!value) return false;
  return /^image\/(png|jpeg|jpg|webp|gif|svg\+xml|x-icon|vnd\.microsoft\.icon)$/i.test(value);
}

function placeholderSvg(letter: string): string {
  const safe = letter.replace(/[^A-Z0-9?]/gi, "").slice(0, 1) || "?";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-label="University logo placeholder"><rect width="256" height="256" rx="32" fill="#f3f4f6"/><text x="50%" y="54%" text-anchor="middle" fill="#6b7280" font-family="Inter, Arial, sans-serif" font-size="110" font-weight="700">${safe}</text></svg>`;
}

function makePlaceholderResponse(letter: string): Response {
  return new Response(placeholderSvg(letter), {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

function toBuffer(bytes: Uint8Array | Buffer): Buffer {
  return Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
}

function isKnownPrismaDbShapeError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "P2021" || code === "P2022";
}

let tableEnsured = false;

async function ensureLogoTable(): Promise<void> {
  if (tableEnsured) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UniversityLogo" (
      "id" TEXT PRIMARY KEY,
      "domain" TEXT NOT NULL UNIQUE,
      "mime_type" TEXT NOT NULL,
      "image_data" BYTEA NOT NULL,
      "source_url" TEXT,
      "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  tableEnsured = true;
}

async function readCachedLogo(domain: string): Promise<LogoRow | null> {
  try {
    const rows = await prisma.$queryRaw<LogoRow[]>`
      SELECT "id", "domain", "mime_type", "image_data"
      FROM "UniversityLogo"
      WHERE "domain" = ${domain}
      LIMIT 1
    `;
    return rows[0] || null;
  } catch (error) {
    if (isKnownPrismaDbShapeError(error)) {
      await ensureLogoTable();
      return null;
    }
    throw error;
  }
}

async function storeLogo(
  domain: string,
  sourceUrl: string,
  mimeType: string,
  imageData: Buffer,
): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO "UniversityLogo" (
        "id",
        "domain",
        "mime_type",
        "image_data",
        "source_url",
        "fetched_at",
        "created_at",
        "updated_at"
      )
      VALUES (
        ${crypto.randomUUID()},
        ${domain},
        ${mimeType},
        ${imageData},
        ${sourceUrl},
        NOW(),
        NOW(),
        NOW()
      )
      ON CONFLICT ("domain")
      DO UPDATE SET
        "mime_type" = EXCLUDED."mime_type",
        "image_data" = EXCLUDED."image_data",
        "source_url" = EXCLUDED."source_url",
        "fetched_at" = NOW(),
        "updated_at" = NOW()
    `;
  } catch (error) {
    if (isKnownPrismaDbShapeError(error)) {
      await ensureLogoTable();
      return;
    }
    throw error;
  }
}

async function fetchLogoFromSource(url: string): Promise<{ mimeType: string; buffer: Buffer } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOGO_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: "image/*" },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type");
    if (!isValidLogoMimeType(contentType)) return null;

    const body = Buffer.from(await response.arrayBuffer());
    if (!body.length || body.length > LOGO_MAX_BYTES) return null;

    return { mimeType: contentType || "image/png", buffer: body };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function sourceCandidates(domain: string): string[] {
  return [
    `https://logo.clearbit.com/${domain}?size=512`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];
}

function logoResponse(mimeType: string, bytes: Uint8Array | Buffer): Response {
  const body = toBuffer(bytes);
  return new Response(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=2592000, immutable",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ domain: string }> },
) {
  const { domain: rawDomain } = await params;
  const domain = normalizeDomain(rawDomain || "");
  const letter = (domain[0] || "?").toUpperCase();

  if (!domain || domain === "unknown") {
    return makePlaceholderResponse(letter);
  }

  const cached = await readCachedLogo(domain);
  if (cached && cached.image_data?.length) {
    return logoResponse(cached.mime_type, cached.image_data);
  }

  for (const sourceUrl of sourceCandidates(domain)) {
    const remote = await fetchLogoFromSource(sourceUrl);
    if (!remote) continue;

    await storeLogo(domain, sourceUrl, remote.mimeType, remote.buffer);
    return logoResponse(remote.mimeType, remote.buffer);
  }

  return makePlaceholderResponse(letter);
}
