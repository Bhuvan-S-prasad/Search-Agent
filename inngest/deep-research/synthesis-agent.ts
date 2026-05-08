import { callOpenRouter } from "@/lib/openrouter";
import { getSynthesisPrompt } from "./prompts";
import { updateSession } from "./utils";
import {
    AGENT_MODELS,
    type ReportPlan,
    type SectionFindings,
} from "./types";
import type { CitationProcessingResult } from "./citation-agent";

/**
 * Synthesize all section findings into a comprehensive research report.
 */
export async function synthesizeReport(
    reportPlan: ReportPlan,
    sectionFindings: SectionFindings[],
    citationResult: CitationProcessingResult,
    sessionId: string
): Promise<string> {
    // Format section findings for the synthesis prompt
    const findingsText = sectionFindings.map(section => {
        const findings = section.key_findings.length > 0
            ? section.key_findings.map((f, i) => `  ${i + 1}. ${f}`).join("\n")
            : "  No specific findings";

        return `## ${section.section_heading} (${section.section_id})
Key Findings:
${findings}

Detailed Content:
${section.detailed_content}

Sources Used: ${section.sources.map(s => s.url).join(", ")}`;
    }).join("\n\n---\n\n");

    // Format citation index
    const citationText = citationResult.citations.map(c =>
        `[${c.index}] ${c.title} — ${c.url} (${c.domain})`
    ).join("\n");

    const prompt = getSynthesisPrompt(
        reportPlan.title,
        findingsText,
        citationText
    );

    const result = await callOpenRouter({
        model: AGENT_MODELS.synthesisAgent,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 8192,
    });

    const report = result.content || "";

    // Save intermediate result
    await updateSession(sessionId, { final_report: report });

    return report;
}
