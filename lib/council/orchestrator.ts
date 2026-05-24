/**
 * Council of NOMI — 3-Stage Orchestration Engine
 *
 * TypeScript port of the Python council.py.
 * Runs three stages:
 *   1. Collect individual responses from all council models
 *   2. Each model ranks the anonymized responses
 *   3. Chairman synthesizes the final answer
 */

import { callOpenRouter, callOpenRouterParallel } from "@/lib/openrouter";
import { COUNCIL_MODELS, CHAIRMAN_MODEL } from "./config";
import type {
  CouncilStage1Result,
  CouncilStage2Result,
  CouncilStage3Result,
  AggregateRanking,
  LabelToModelMap,
} from "./types";

// ── Stage 1: Collect Individual Responses ───────────────────

/**
 * Query all council models in parallel with the user's question.
 * Returns only successful responses (failed models are filtered out).
 */
export async function stage1CollectResponses(
  userQuery: string,
): Promise<CouncilStage1Result[]> {
  const messages = [{ role: "user", content: userQuery }];

  const responses = await callOpenRouterParallel(COUNCIL_MODELS, messages);

  const results: CouncilStage1Result[] = [];

  for (const [model, response] of responses) {
    if (response.content) {
      results.push({
        model,
        response: response.content,
      });
    }
  }

  return results;
}

// ── Stage 2: Peer Rankings ──────────────────────────────────

/**
 * Each council model evaluates and ranks the anonymized responses.
 * Returns the rankings and the label→model mapping.
 */
export async function stage2CollectRankings(
  userQuery: string,
  stage1Results: CouncilStage1Result[],
): Promise<{
  rankings: CouncilStage2Result[];
  labelToModel: LabelToModelMap;
}> {
  // Create anonymized labels: Response A, Response B, ...
  const labels = stage1Results.map((_, i) => String.fromCharCode(65 + i));

  // Map labels back to model names
  const labelToModel: LabelToModelMap = {};
  labels.forEach((label, i) => {
    labelToModel[`Response ${label}`] = stage1Results[i].model;
  });

  // Build the anonymized responses text
  const responsesText = labels
    .map(
      (label, i) =>
        `Response ${label}:\n${stage1Results[i].response}`,
    )
    .join("\n\n");

  const rankingPrompt = `You are evaluating different responses to the following question:

Question: ${userQuery}

Here are the responses from different models (anonymized):

${responsesText}

Your task:
1. First, evaluate each response individually. For each response, explain what it does well and what it does poorly.
2. Then, at the very end of your response, provide a final ranking.

IMPORTANT: Your final ranking MUST be formatted EXACTLY as follows:
- Start with the line "FINAL RANKING:" (all caps, with colon)
- Then list the responses from best to worst as a numbered list
- Each line should be: number, period, space, then ONLY the response label (e.g., "1. Response A")
- Do not add any other text or explanations in the ranking section

Example of the correct format for your ENTIRE response:

Response A provides good detail on X but misses Y...
Response B is accurate but lacks depth on Z...
Response C offers the most comprehensive answer...

FINAL RANKING:
1. Response C
2. Response A
3. Response B

Now provide your evaluation and ranking:`;

  const messages = [{ role: "user", content: rankingPrompt }];

  const responses = await callOpenRouterParallel(COUNCIL_MODELS, messages);

  const rankings: CouncilStage2Result[] = [];

  for (const [model, response] of responses) {
    if (response.content) {
      rankings.push({
        model,
        ranking: response.content,
        parsed_ranking: parseRankingFromText(response.content),
      });
    }
  }

  return { rankings, labelToModel };
}

// ── Stage 3: Chairman Synthesis ─────────────────────────────

/**
 * The chairman model synthesizes a final answer based on
 * all individual responses and peer rankings.
 */
export async function stage3SynthesizeFinal(
  userQuery: string,
  stage1Results: CouncilStage1Result[],
  stage2Results: CouncilStage2Result[],
): Promise<CouncilStage3Result> {
  // Build comprehensive context
  const stage1Text = stage1Results
    .map((r) => `Model: ${r.model}\nResponse: ${r.response}`)
    .join("\n\n");

  const stage2Text = stage2Results
    .map((r) => `Model: ${r.model}\nRanking: ${r.ranking}`)
    .join("\n\n");

  const chairmanPrompt = `You are the Chairman of an LLM Council. Multiple AI models have provided responses to a user's question, and then ranked each other's responses.

Original Question: ${userQuery}

STAGE 1 - Individual Responses:
${stage1Text}

STAGE 2 - Peer Rankings:
${stage2Text}

Your task as Chairman is to synthesize all of this information into a single, comprehensive, accurate answer to the user's original question. Consider:
- The individual responses and their insights
- The peer rankings and what they reveal about response quality
- Any patterns of agreement or disagreement

Provide a clear, well-reasoned final answer that represents the council's collective wisdom:`;

  const messages = [{ role: "user", content: chairmanPrompt }];

  try {
    const response = await callOpenRouter({
      model: CHAIRMAN_MODEL,
      messages,
    });

    return {
      model: CHAIRMAN_MODEL,
      response: response.content || "Error: Unable to generate final synthesis.",
    };
  } catch (error) {
    console.error("[Council] Chairman synthesis failed:", error);
    return {
      model: CHAIRMAN_MODEL,
      response: "Error: Unable to generate final synthesis. The chairman model encountered an issue.",
    };
  }
}

// ── Ranking Parser ──────────────────────────────────────────

/**
 * Parse the FINAL RANKING section from a model's evaluation text.
 * Extracts the ordered list of response labels.
 */
export function parseRankingFromText(rankingText: string): string[] {
  // Look for "FINAL RANKING:" section
  if (rankingText.includes("FINAL RANKING:")) {
    const parts = rankingText.split("FINAL RANKING:");
    if (parts.length >= 2) {
      const rankingSection = parts[1];

      // Try numbered list format: "1. Response A"
      const numberedMatches = rankingSection.match(
        /\d+\.\s*Response [A-Z]/g,
      );
      if (numberedMatches) {
        return numberedMatches.map((m) => {
          const match = m.match(/Response [A-Z]/);
          return match ? match[0] : "";
        }).filter(Boolean);
      }

      // Fallback: extract all "Response X" patterns
      const matches = rankingSection.match(/Response [A-Z]/g);
      if (matches) return matches;
    }
  }

  // Last resort: any "Response X" patterns in the full text
  const fallbackMatches = rankingText.match(/Response [A-Z]/g);
  return fallbackMatches || [];
}

// ── Aggregate Rankings Calculator ───────────────────────────

/**
 * Calculate average rankings across all models.
 * Lower average rank = better model.
 */
export function calculateAggregateRankings(
  stage2Results: CouncilStage2Result[],
  labelToModel: LabelToModelMap,
): AggregateRanking[] {
  const modelPositions: Record<string, number[]> = {};

  for (const ranking of stage2Results) {
    const parsedRanking = parseRankingFromText(ranking.ranking);

    parsedRanking.forEach((label, index) => {
      const position = index + 1;
      if (label in labelToModel) {
        const modelName = labelToModel[label];
        if (!modelPositions[modelName]) {
          modelPositions[modelName] = [];
        }
        modelPositions[modelName].push(position);
      }
    });
  }

  const aggregate: AggregateRanking[] = [];

  for (const [model, positions] of Object.entries(modelPositions)) {
    if (positions.length > 0) {
      const avgRank = positions.reduce((a, b) => a + b, 0) / positions.length;
      aggregate.push({
        model,
        average_rank: Math.round(avgRank * 100) / 100,
        rankings_count: positions.length,
      });
    }
  }

  // Sort by average rank (lower is better)
  aggregate.sort((a, b) => a.average_rank - b.average_rank);

  return aggregate;
}

// ── Full Council Pipeline ───────────────────────────────────

/**
 * Run the complete 3-stage council process.
 * Returns all stage results and metadata.
 */
export async function runFullCouncil(userQuery: string): Promise<{
  stage1Results: CouncilStage1Result[];
  stage2Results: CouncilStage2Result[];
  stage3Result: CouncilStage3Result;
  labelToModel: LabelToModelMap;
  aggregateRankings: AggregateRanking[];
}> {
  // Stage 1: Collect individual responses
  const stage1Results = await stage1CollectResponses(userQuery);

  if (stage1Results.length === 0) {
    return {
      stage1Results: [],
      stage2Results: [],
      stage3Result: {
        model: "error",
        response: "All models failed to respond. Please try again.",
      },
      labelToModel: {},
      aggregateRankings: [],
    };
  }

  // Stage 2: Collect rankings
  const { rankings: stage2Results, labelToModel } =
    await stage2CollectRankings(userQuery, stage1Results);

  // Calculate aggregate rankings
  const aggregateRankings = calculateAggregateRankings(
    stage2Results,
    labelToModel,
  );

  // Stage 3: Synthesize final answer
  const stage3Result = await stage3SynthesizeFinal(
    userQuery,
    stage1Results,
    stage2Results,
  );

  return {
    stage1Results,
    stage2Results,
    stage3Result,
    labelToModel,
    aggregateRankings,
  };
}
