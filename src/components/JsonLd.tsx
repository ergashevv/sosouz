function siteJsonLd(siteUrl: string) {
  const clean = siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${clean}/#organization`,
        name: "SOSO",
        url: clean,
        description:
          "Global university discovery and search — live higher-education listings, rankings context, and institutional research.",
      },
      {
        "@type": "WebSite",
        name: "SOSO",
        alternateName: "SOSO Global University Discovery",
        url: `${clean}/`,
        description:
          "Real-time global university search, country filters, and discovery tools for students and advisors.",
        publisher: { "@id": `${clean}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${clean}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export default function JsonLd({ siteUrl }: { siteUrl: string }) {
  const payload = siteJsonLd(siteUrl);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
