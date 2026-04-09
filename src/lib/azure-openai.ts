import "server-only";

export type AzureChatRole = "system" | "user" | "assistant";

export interface AzureChatMessage {
  role: AzureChatRole;
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | {
            type: "image_url";
            image_url: { url: string };
          }
      >;
}

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/+$/, "") || "";
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || "";
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || "";
const AZURE_OPENAI_DEPLOYMENT_CHAT = process.env.AZURE_OPENAI_DEPLOYMENT_CHAT || "";
const AZURE_OPENAI_DEPLOYMENT_REASONER = process.env.AZURE_OPENAI_DEPLOYMENT_REASONER || "";
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";
const AZURE_OPENAI_RETRY_MAX = Math.min(
  6,
  Math.max(1, Number(process.env.AZURE_OPENAI_RETRY_MAX || 3)),
);

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function buildDeploymentCandidates(): string[] {
  const fallbackFromEnv = (process.env.AZURE_OPENAI_FALLBACK_DEPLOYMENTS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set([AZURE_OPENAI_DEPLOYMENT, ...fallbackFromEnv].filter(Boolean)));
}

function uniqueNonEmpty(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map((value) => (value || "").trim()).filter(Boolean)));
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (!payload || typeof payload !== "object") {
    return `Azure OpenAI request failed with status ${status}.`;
  }
  const maybeError = (payload as { error?: unknown }).error;
  if (maybeError && typeof maybeError === "object") {
    const message = (maybeError as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }
  return `Azure OpenAI request failed with status ${status}.`;
}

export function isAzureOpenAiConfigured() {
  return Boolean(
    AZURE_OPENAI_ENDPOINT &&
      AZURE_OPENAI_API_KEY &&
      AZURE_OPENAI_DEPLOYMENT &&
      AZURE_OPENAI_API_VERSION,
  );
}

export function getAzureOpenAIDeploymentByPurpose(
  purpose: "chat_fast" | "reasoning" | "default" = "default",
) {
  if (purpose === "chat_fast") {
    return (AZURE_OPENAI_DEPLOYMENT_CHAT || AZURE_OPENAI_DEPLOYMENT || "").trim();
  }
  if (purpose === "reasoning") {
    return (
      AZURE_OPENAI_DEPLOYMENT_REASONER ||
      AZURE_OPENAI_DEPLOYMENT_CHAT ||
      AZURE_OPENAI_DEPLOYMENT ||
      ""
    ).trim();
  }
  return (AZURE_OPENAI_DEPLOYMENT || AZURE_OPENAI_DEPLOYMENT_CHAT || "").trim();
}

export async function generateAzureChatCompletionText(args: {
  messages: AzureChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json_object";
  deployment?: string;
  deploymentCandidates?: string[];
}) {
  if (!isAzureOpenAiConfigured()) {
    throw new Error("AI service is not configured.");
  }

  const deploymentCandidates = uniqueNonEmpty([
    args.deployment,
    ...(args.deploymentCandidates || []),
    ...buildDeploymentCandidates(),
  ]);
  if (deploymentCandidates.length === 0) {
    throw new Error("Azure OpenAI deployment is not configured.");
  }

  let lastError: unknown = null;

  for (const deployment of deploymentCandidates) {
    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${deployment}/chat/completions?api-version=${encodeURIComponent(
      AZURE_OPENAI_API_VERSION,
    )}`;

    for (let attempt = 1; attempt <= AZURE_OPENAI_RETRY_MAX; attempt += 1) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_OPENAI_API_KEY,
          },
          body: JSON.stringify({
            messages: args.messages,
            temperature: args.temperature ?? 0.3,
            max_tokens: args.maxTokens ?? 900,
            ...(args.responseFormat === "json_object"
              ? { response_format: { type: "json_object" as const } }
              : {}),
          }),
        });

        if (!response.ok) {
          let payload: unknown = null;
          try {
            payload = await response.json();
          } catch {
            payload = null;
          }
          const message = extractErrorMessage(payload, response.status);
          const err = new Error(message);
          (err as Error & { status?: number }).status = response.status;

          const shouldRetry = isRetryableStatus(response.status) && attempt < AZURE_OPENAI_RETRY_MAX;
          if (shouldRetry) {
            const backoff = Math.min(12_000, 900 * 2 ** (attempt - 1));
            await sleep(backoff + Math.floor(Math.random() * 500));
            continue;
          }

          // Deployment missing/misconfigured: try next fallback deployment if available.
          if ((response.status === 400 || response.status === 404) && deployment !== deploymentCandidates.at(-1)) {
            lastError = err;
            break;
          }

          throw err;
        }

        const payload = (await response.json()) as {
          choices?: Array<{ message?: { content?: string | null } }>;
        };
        const text = payload.choices?.[0]?.message?.content?.trim();
        if (!text) {
          throw new Error("Azure OpenAI returned empty response.");
        }
        return text;
      } catch (error) {
        lastError = error;
        const status = (error as { status?: unknown })?.status;
        const isRetryable =
          typeof status === "number"
            ? isRetryableStatus(status)
            : (error instanceof Error ? error.message : String(error))
                .toLowerCase()
                .includes("fetch failed");
        if (!isRetryable || attempt === AZURE_OPENAI_RETRY_MAX) {
          throw error;
        }
        const backoff = Math.min(12_000, 900 * 2 ** (attempt - 1));
        await sleep(backoff + Math.floor(Math.random() * 500));
      }
    }
  }

  throw (lastError || new Error("No Azure OpenAI deployment produced a response."));
}
