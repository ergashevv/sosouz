/**
 * Smoke test: Azure OpenAI chat completions (same endpoint shape as src/lib/azure-openai.ts).
 * Run: node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/test-azure-openai.ts
 */
function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(`Missing required env: ${name}`);
  }
  return v;
}

async function main() {
  const endpoint = requireEnv("AZURE_OPENAI_ENDPOINT").replace(/\/+$/, "");
  const apiKey = requireEnv("AZURE_OPENAI_API_KEY");
  const deployment = requireEnv("AZURE_OPENAI_DEPLOYMENT");
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION?.trim() || "2024-10-21";

  const url = `${endpoint}/openai/deployments/${encodeURIComponent(
    deployment,
  )}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: 'Respond with JSON only: {"ok": true, "service": "azure-openai"}',
        },
      ],
      temperature: 0,
      max_tokens: 80,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Azure OpenAI HTTP ${response.status}: ${errText.slice(0, 500)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Azure OpenAI returned empty content.");
  }

  console.log("Azure OpenAI response:", text);
  console.log("OK — Azure OpenAI chat completions responded successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
