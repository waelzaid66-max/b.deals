import OpenAI from "openai";

/**
 * Resolve the OpenAI configuration.
 *
 * Order of preference:
 *  1. Replit OpenAI AI integration (AI_INTEGRATIONS_OPENAI_BASE_URL + AI_INTEGRATIONS_OPENAI_API_KEY)
 *  2. A standard OpenAI API key (OPENAI_API_KEY) against the default OpenAI endpoint.
 *
 * The check is performed lazily (on first use) rather than at import time so the
 * server can boot even when AI is not configured; only the AI features fail,
 * with a clear error, instead of crashing the whole process.
 */
function resolveOpenAIConfig(): { apiKey: string; baseURL?: string } {
  // An explicitly-provided OPENAI_API_KEY takes precedence. It is a deliberate
  // operator choice and talks directly to api.openai.com, so it works even when
  // Replit's managed AI sidecar (AI_INTEGRATIONS_*) is present but not yet
  // activated by the platform. Remove OPENAI_API_KEY to fall back to managed AI.
  const ownApiKey = process.env.OPENAI_API_KEY;
  if (ownApiKey) {
    return { apiKey: ownApiKey };
  }

  const integrationBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const integrationApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (integrationBaseUrl && integrationApiKey) {
    return { apiKey: integrationApiKey, baseURL: integrationBaseUrl };
  }

  throw new Error(
    "OpenAI is not configured. Set OPENAI_API_KEY, or provision the Replit OpenAI AI integration " +
      "(which sets AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY).",
  );
}

/**
 * The default chat model, chosen to match whichever backend {@link resolveOpenAIConfig}
 * will use — so the assistant works out of the box with nothing but a key:
 *
 *  - A direct `OPENAI_API_KEY` talks to api.openai.com, where the Replit-managed
 *    catalog name (`gpt-5.4`) does NOT exist. Default to a model that always does.
 *  - Otherwise the Replit managed AI integration is active; use its catalog default.
 *
 * An explicit `OPENAI_MODEL` always overrides this at the call site, so operators
 * can pin any model their account actually has without a code change.
 */
export function defaultChatModel(): string {
  if (process.env.OPENAI_API_KEY) return "gpt-4o-mini";
  return "gpt-5.4";
}

let cached: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!cached) {
    const cfg = resolveOpenAIConfig();
    cached = new OpenAI({
      apiKey: cfg.apiKey,
      ...(cfg.baseURL ? { baseURL: cfg.baseURL } : {}),
    });
  }
  return cached;
}

/**
 * A lazily-initialised OpenAI client. Accessing any property constructs the real
 * client on first use, so importing this module never throws.
 */
export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    const client = getOpenAIClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
