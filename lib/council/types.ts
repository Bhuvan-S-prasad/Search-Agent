/**
 * Council of NOMI — Type Definitions
 *
 * Mirrors the Python council data structures, adapted for TypeScript + Supabase.
 */

// ── Session Status ──────────────────────────────────────────

export type CouncilStatus =
  | "collecting"   // Stage 1: gathering individual responses
  | "running"      // Claimed status / running
  | "ranking"      // Stage 2: peer review / ranking
  | "synthesizing" // Stage 3: chairman synthesis
  | "completed"
  | "failed";

// ── Stage 1: Individual Model Responses ─────────────────────

export interface CouncilStage1Result {
  model: string;
  response: string;
}

// ── Stage 2: Peer Rankings ──────────────────────────────────

export interface CouncilStage2Result {
  model: string;
  ranking: string;         // Full evaluation text
  parsed_ranking: string[]; // Ordered list: ["Response A", "Response C", ...]
}

// ── Stage 3: Chairman Synthesis ─────────────────────────────

export interface CouncilStage3Result {
  model: string;
  response: string;
}

// ── Aggregate Rankings ──────────────────────────────────────

export interface AggregateRanking {
  model: string;
  average_rank: number;
  rankings_count: number;
}

// ── Label Mapping (anonymous → model) ───────────────────────

export type LabelToModelMap = Record<string, string>;

// ── SSE Event Types ─────────────────────────────────────────

export type CouncilSSEEventType =
  | "stage_start"
  | "model_response"
  | "stage_complete"
  | "rankings_ready"
  | "synthesis_chunk"
  | "council_complete"
  | "error";

export interface CouncilSSEEvent {
  stage: 1 | 2 | 3;
  type: CouncilSSEEventType;
  model?: string;
  content?: string;
  data?: unknown;
}

// ── Full Session Record (Supabase Row) ──────────────────────

export interface CouncilSession {
  id: string;
  user_email: string;
  user_id: string | null;
  query: string;
  status: CouncilStatus;
  stage1_results: CouncilStage1Result[];
  stage2_results: CouncilStage2Result[];
  stage3_result: CouncilStage3Result | null;
  aggregate_rankings: AggregateRanking[];
  label_to_model: LabelToModelMap;
  created_at: string;
  updated_at: string;
}
