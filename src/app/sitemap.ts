import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const lastMod = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();

  const publicPaths: {
    path: string;
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
    priority: number;
  }[] =
    [
      { path: "/", changeFrequency: "weekly", priority: 1 },
      { path: "/search", changeFrequency: "weekly", priority: 0.95 },
      { path: "/ai-studio", changeFrequency: "weekly", priority: 0.9 },
      { path: "/top-university", changeFrequency: "weekly", priority: 0.95 },
      { path: "/about", changeFrequency: "monthly", priority: 0.7 },
      { path: "/startup", changeFrequency: "monthly", priority: 0.85 },
      { path: "/startup/product", changeFrequency: "monthly", priority: 0.8 },
      { path: "/startup/company", changeFrequency: "monthly", priority: 0.75 },
      { path: "/startup/team", changeFrequency: "monthly", priority: 0.75 },
      { path: "/startup/contact", changeFrequency: "monthly", priority: 0.7 },
      { path: "/students", changeFrequency: "monthly", priority: 0.75 },
      { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
      { path: "/privacy", changeFrequency: "yearly", priority: 0.45 },
    ];

  return publicPaths.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path === "/" ? "" : path}`,
    lastModified: lastMod,
    changeFrequency,
    priority,
  }));
}
