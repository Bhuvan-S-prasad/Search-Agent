import type { DeepResearchSession } from "./types";

/**
 * Compress a full research report into a lightweight context summary
 * for use in follow-up triage and chat responses.
 *
 * Strategy: Extract structured metadata instead of the full 2K-6K word report.
 * Keeps context under ~800 tokens while preserving enough info for the LLM
 * to understand what was already covered.
 */
export function compressReportForContext(session: DeepResearchSession): string {
    const parts: string[] = [];

    // 1. Original query
    parts.push(`Original Research Query: "${session.query}"`);

    // 2. Report title from plan
    if (session.report_plan) {
        parts.push(`Report Title: "${session.report_plan.title}"`);
    }

    // 3. Section headings and key findings
    if (session.report_plan?.sections && session.section_findings?.length > 0) {
        parts.push("\nReport Sections and Key Findings:");

        for (const section of session.report_plan.sections) {
            const findings = session.section_findings.find(
                (f) => f.section_id === section.id
            );

            if (findings && findings.key_findings.length > 0) {
                // Take first 2 findings per section to keep it compact
                const topFindings = findings.key_findings
                    .slice(0, 2)
                    .map((f) => `  - ${f}`)
                    .join("\n");
                parts.push(`\n## ${section.heading}\n${topFindings}`);
            } else {
                parts.push(`\n## ${section.heading}\n  (no findings recorded)`);
            }
        }
    } else if (session.report_plan?.sections) {
        // Plan exists but no findings yet
        parts.push("\nPlanned Sections:");
        for (const section of session.report_plan.sections) {
            parts.push(`- ${section.heading}`);
        }
    }

    // 4. Citation count
    if (session.citations?.length > 0) {
        parts.push(`\nTotal Sources Cited: ${session.citations.length}`);
    }

    // 5. Status
    parts.push(`\nResearch Status: ${session.status}`);

    return parts.join("\n");
}
