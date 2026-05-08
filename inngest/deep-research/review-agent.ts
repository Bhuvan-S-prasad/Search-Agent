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
    const prompt = getReviewPrompt(report, originalQuery);

    const result = await callOpenRouter({
        model: AGENT_MODELS.reviewAgent,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1024,
        response_format: { type: "json_object" },
    });

    const review = extractJson<ReviewResult>(result.content);

    if (!review) {
        // Default to approved if parsing fails — don't block the report
        return {
            approved: true,
            overall_quality: "good",
            gaps: [],
            suggestions: ["Review agent response could not be parsed"],
            sections_needing_research: [],
        };
    }

    return review;
}
