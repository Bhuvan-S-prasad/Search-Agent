import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ──────────────────────────────────────────────────────────────
//  Upstash Redis client (HTTP-based, works in Edge / Serverless)
// ──────────────────────────────────────────────────────────────
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ──────────────────────────────────────────────────────────────
//  Rate Limiter Tiers — Sliding Window algorithm
// ──────────────────────────────────────────────────────────────

/**
 * STRICT — 10 requests per 60 seconds
 * For expensive endpoints: LLM generation, deep-research start,
 * council start/run.
 */
export const strictLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "ratelimit:strict",
});

/**
 * STANDARD — 20 requests per 60 seconds
 * For external API calls and DB-write endpoints: Google Search,
 * GNews, plan, triage, query-planner, search/chat, search/create,
 * search/record, deep-research/triage, deep-research/followup.
 */
export const standardLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  analytics: true,
  prefix: "ratelimit:standard",
});

/**
 * RELAXED — 40 requests per 60 seconds
 * For read-only / polling endpoints: weather, market, status
 * checks, user sync/history, inngest status, council status/triage.
 */
export const relaxedLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(40, "60 s"),
  analytics: true,
  prefix: "ratelimit:relaxed",
});

// ──────────────────────────────────────────────────────────────
//  Path → Tier mapping
// ──────────────────────────────────────────────────────────────

/** Endpoints that trigger expensive LLM calls / long-running workflows */
const STRICT_PATHS = [
  "/api/llm-model",
  "/api/deep-research/start",
  "/api/council/start",
  "/api/council/run",
];

/** Endpoints that call external APIs or perform DB writes */
const STANDARD_PATHS = [
  "/api/google-search-api",
  "/api/gnews-api",
  "/api/plan",
  "/api/triage",
  "/api/query-planner",
  "/api/search/chat",
  "/api/search/create",
  "/api/search/record",
  "/api/deep-research/triage",
  "/api/deep-research/followup",
];

// Everything else under /api (except /api/inngest) falls into RELAXED.

/**
 * Resolves the appropriate rate limiter for a given API path.
 * Returns `null` for paths that should NOT be rate-limited (e.g. /api/inngest).
 */
export function getLimiterForPath(pathname: string) {
  // Inngest webhook — server-to-server, never rate-limit
  if (pathname === "/api/inngest") {
    return null;
  }

  if (STRICT_PATHS.includes(pathname)) {
    return strictLimiter;
  }

  if (STANDARD_PATHS.includes(pathname)) {
    return standardLimiter;
  }

  // Default: relaxed tier for all other /api/* routes
  return relaxedLimiter;
}
