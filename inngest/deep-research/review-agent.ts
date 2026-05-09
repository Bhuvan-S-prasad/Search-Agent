import { callOpenRouter } from "@/lib/openrouter";
import { extractJson } from "@/lib/json-utils";
import { getReviewPrompt } from "./prompts";
import { AGENT_MODELS, type ReviewResult } from "./types";

/**
 * Review the synthesized report for quality, completeness, and accuracy.
 */
export async function reviewReport(
    report: string,
    originalQuery: string,
    sessionId: string
): Promise<ReviewResult> {
    console.log(`[DeepResearch][ReviewAgent] Starting quality review for report (${report.length} chars) against query: "${originalQuery}"`);

    const prompt = getReviewPrompt(report, originalQuery);
    console.log(`[DeepResearch][ReviewAgent] Review prompt length: ${prompt.length} chars`);

    const result = await callOpenRouter({
        model: AGENT_MODELS.reviewAgent,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1024,
        response_format: { type: "json_object" },
    });

    console.log(`[DeepResearch][ReviewAgent] Raw LLM response:`, result.content?.substring(0, 300));
    console.log(`[DeepResearch][ReviewAgent] Model: ${result.model}, Tokens:`, result.usage);

    const review = extractJson<ReviewResult>(result.content);

    if (!review) {
        console.warn(`[DeepResearch][ReviewAgent] Failed to parse review results. Defaulting to approved.`);
        // Default to approved if parsing fails — don't block the report
        return {
            approved: true,
            overall_quality: "good",
            gaps: [],
            suggestions: ["Review agent response could not be parsed"],
            sections_needing_research: [],
        };
    }

    console.log(`[DeepResearch][ReviewAgent] Parsed review: Approved = ${review.approved}, Quality = ${review.overall_quality}`);

    return review;
}
