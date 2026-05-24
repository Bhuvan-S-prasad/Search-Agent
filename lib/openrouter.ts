/**
 * OpenRouter API helper — centralizes all LLM calls through OpenRouter.
 * Supports multiple free models with a unified interface.
 */

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
}

/**
 * Free models available on OpenRouter (appended with :free suffix).
 * These can be used without credits during development.
 */
export const FREE_MODELS: OpenRouterModel[] = [
  {
    id: "google/gemini-2.0-flash-lite-001",
    name: "Gemini 2.0 Flash",
    description: "Google's fast, free flash model — great for quick tasks",
  },
  {
    id: "z-ai/glm-4.5-air:free",
    name: "GLM-4.5 Air",
    description: "Z-AI's advanced conversational model",
  },  
  {
    id: "deepseek/deepseek-chat-v3-0324:free",
    name: "DeepSeek V3",
    description: "DeepSeek's advanced conversational model",
  },
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    name: "NVIDIA Nemotron 3 Nano Omni",
    description:
      "NVIDIA's powerful and efficient model with strong reasoning capabilities.",
  },
  {
    id: "qwen/qwen3-next-80b-a3b-instruct:free",
    name: "Qwen 3",
    description: "Alibaba's powerful large multilingual model",
  },
];

export const DEFAULT_MODEL = FREE_MODELS[0].id;

/**
 * Get a model object by its ID. Falls back to default if not found.
 */
export function getModelById(modelId?: string): OpenRouterModel {
  if (!modelId) return FREE_MODELS[0];
  return FREE_MODELS.find((m) => m.id === modelId) || FREE_MODELS[0];
}

interface OpenRouterCallOptions {
  model?: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
  signal?: AbortSignal;
}

interface OpenRouterResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Make a call to the OpenRouter chat completions API.
 * Returns the text content from the first choice.
 *
 * @throws Error if the API key is missing or the request fails.
 */
export async function callOpenRouter(
  options: OpenRouterCallOptions,
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set in environment variables");
  }

  const model = options.model || DEFAULT_MODEL;

  const body: Record<string, unknown> = {
    model,
    messages: options.messages,
  };

  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }
  if (options.max_tokens !== undefined) {
    body.max_tokens = options.max_tokens;
  }
  if (options.response_format) {
    body.response_format = options.response_format;
  }

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      "X-Title": "NOMI Search Agent",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `OpenRouter API Error: ${response.status} - ${JSON.stringify(data)}`,
    );
  }

  const content = data?.choices?.[0]?.message?.content || "";

  return {
    content,
    model: data?.model || model,
    usage: data?.usage,
  };
}

/**
 * Make a streaming call to the OpenRouter chat completions API.
 * Returns the raw fetch Response with an SSE body stream.
 * The caller is responsible for reading and parsing the stream.
 *
 * @throws Error if the API key is missing or the request fails.
 */
export async function streamOpenRouter(
  options: OpenRouterCallOptions,
): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set in environment variables");
  }

  const model = options.model || DEFAULT_MODEL;

  const body: Record<string, unknown> = {
    model,
    messages: options.messages,
    stream: true,
  };

  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }
  if (options.max_tokens !== undefined) {
    body.max_tokens = options.max_tokens;
  }
  // Note: response_format is not used with streaming

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      "X-Title": "NOMI Search Agent",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: options.signal,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `OpenRouter API Error: ${response.status} - ${JSON.stringify(errorData)}`,
    );
  }

  return response;
}

/**
 * Query multiple OpenRouter models in parallel with the same messages.
 * Returns a Map of model ID → response. Models that fail are logged and omitted.
 *
 * This is the TypeScript equivalent of the Python `query_models_parallel`.
 */
export async function callOpenRouterParallel(
  models: readonly string[],
  messages: { role: string; content: string }[],
  options?: { temperature?: number; max_tokens?: number },
): Promise<Map<string, OpenRouterResponse>> {
  const results = await Promise.allSettled(
    models.map((model) =>
      callOpenRouter({
        model,
        messages,
        temperature: options?.temperature,
        max_tokens: options?.max_tokens,
      }).then((response) => ({ model, response })),
    ),
  );

  const responseMap = new Map<string, OpenRouterResponse>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      responseMap.set(result.value.model, result.value.response);
    } else {
      console.error(
        `[Council] Model query failed:`,
        result.reason?.message || result.reason,
      );
    }
  }

  return responseMap;
}
