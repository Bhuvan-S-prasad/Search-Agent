/**
 * Council of NOMI — Configuration
 *
 * Defines which models serve on the council and which is the chairman.
 * Display metadata is used by the frontend model cards.
 */

// ── Council Members (4 models that deliberate) ──────────────

export const COUNCIL_MODELS = [
  "google/gemini-2.0-flash-lite-001",
  "z-ai/glm-4.5-air:free",
  "openai/gpt-oss-120b:free",
  "arcee-ai/trinity-large-thinking:free",
] as const;

// ── Chairman (synthesizes the final verdict) ────────────────

export const CHAIRMAN_MODEL =
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

// ── Display Metadata ────────────────────────────────────────

export interface ModelDisplayInfo {
  id: string;
  name: string;
  shortName: string;
  accentColor: string;   // Tailwind-compatible color token
  bgColor: string;       // Background tint
  borderColor: string;   // Border accent
  emoji: string;         // Quick visual identifier
}

export const MODEL_DISPLAY_INFO: Record<string, ModelDisplayInfo> = {
  "google/gemini-2.0-flash-lite-001": {
    id: "google/gemini-2.0-flash-lite-001",
    name: "Gemini 2.0 Flash",
    shortName: "Gemini",
    accentColor: "text-blue-500",
    bgColor: "bg-blue-500/8",
    borderColor: "border-blue-500/20",
    emoji: "✦",
  },
  "z-ai/glm-4.5-air:free": {
    id: "z-ai/glm-4.5-air:free",
    name: "GLM-4.5 Air",
    shortName: "GLM",
    accentColor: "text-emerald-500",
    bgColor: "bg-emerald-500/8",
    borderColor: "border-emerald-500/20",
    emoji: "◆",
  },
  "openai/gpt-oss-120b:free": {
    id: "openai/gpt-oss-120b:free",
    name: "GPT-OSS 120B",
    shortName: "GPT-OSS",
    accentColor: "text-violet-500",
    bgColor: "bg-violet-500/8",
    borderColor: "border-violet-500/20",
    emoji: "◈",
  },
  "arcee-ai/trinity-large-thinking:free": {
    id: "arcee-ai/trinity-large-thinking:free",
    name: "Arcee Trinity Large",
    shortName: "Arcee",
    accentColor: "text-sky-500",
    bgColor: "bg-sky-500/8",
    borderColor: "border-sky-500/20",
    emoji: "▲",
  },
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    name: "NVIDIA Nemotron",
    shortName: "Nemotron",
    accentColor: "text-rose-500",
    bgColor: "bg-rose-500/8",
    borderColor: "border-rose-500/20",
    emoji: "⬢",
  },
};

/**
 * Get display info for a model, with a sensible fallback.
 */
export function getModelDisplayInfo(modelId: string): ModelDisplayInfo {
  return (
    MODEL_DISPLAY_INFO[modelId] ?? {
      id: modelId,
      name: modelId.split("/").pop()?.replace(/:.*$/, "") ?? modelId,
      shortName: modelId.split("/").pop()?.replace(/:.*$/, "") ?? "Model",
      accentColor: "text-slate-500",
      bgColor: "bg-slate-500/8",
      borderColor: "border-slate-500/20",
      emoji: "●",
    }
  );
}
