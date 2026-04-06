export interface University {
  name: string;
  country: string;
  alpha_two_code: string;
  web_pages: string[];
  domains: string[];
  state_province: string | null;
}

function normalizeOrigin(origin: string): string {
  if (!origin) return "";
  return /^https?:\/\//i.test(origin) ? origin : `https://${origin}`;
}

function getApiOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL;
  if (configuredOrigin) {
    return normalizeOrigin(configuredOrigin);
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://127.0.0.1:3000";
}

function getSearchEndpoint(): URL {
  return new URL("/api/hipo/search", getApiOrigin());
}

export const fetchUniversities = async (country: string, query?: string): Promise<University[]> => {
  const url = getSearchEndpoint();
  url.searchParams.set("country", country);
  if (query) {
    url.searchParams.set("name", query);
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch universities");
  }

  return response.json();
};

export const fetchUniversityByName = async (name: string): Promise<University | null> => {
  const url = getSearchEndpoint();
  url.searchParams.set("name", name);

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const data: University[] = await response.json();
  // Find exact match if multiple partial matches
  return data.find((u) => u.name === name) || data[0] || null;
};

export const getLogoUrl = (domain: string) => {
  return `https://logo.clearbit.com/${domain}?size=800`;
};

export const getFallbackLogoUrl = (domain: string) => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
};
