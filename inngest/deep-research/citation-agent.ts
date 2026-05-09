import { callOpenRouter } from "@/lib/openrouter";
import { extractJson } from "@/lib/json-utils";
import { getCitationAgentPrompt } from "./prompts";
import { updateSession } from "./utils";
import {
    AGENT_MODELS,
    type SectionFindings,
    type CitationEntry,
} from "./types";

interface CitationAgentResult {
    citations: Array<{
        index: number;
        url: string;
        title: string;
        snippet: string;
        domain: string;
    }>;
    url_to_index: Record<string, number>;
}

export interface CitationProcessingResult {
    citations: CitationEntry[];
    urlToIndex: Record<string, number>;
}

/**
 * Process all sources from section findings into a deduplicated citation index.
 */
export async function processCitations(
    sectionFindings: SectionFindings[],
    sessionId: string
): Promise<CitationProcessingResult> {
    console.log(`[DeepResearch][CitationAgent] Starting citation processing for ${sectionFindings.length} sections`);

    // Collect all sources across sections
    const allSources: Array<{ url: string; title: string; snippet: string; domain: string; fromSection: string }> = [];

    for (const section of sectionFindings) {
        for (const source of section.sources) {
            allSources.push({
                url: source.url,
                title: source.title,
                snippet: source.snippet,
                domain: source.domain || "",
                fromSection: section.section_id,
            });
        }
    }

    console.log(`[DeepResearch][CitationAgent] Collected ${allSources.length} total raw sources across all sections`);

    if (allSources.length === 0) {
        const emptyResult: CitationProcessingResult = { citations: [], urlToIndex: {} };
        await updateSession(sessionId, { citations: [] });
        return emptyResult;
    }

    // Format for the LLM
    const sourcesText = allSources.map((s, i) =>
        `[${i}] URL: ${s.url}\nTitle: ${s.title}\nSnippet: ${s.snippet}\nDomain: ${s.domain}\nFrom Section: ${s.fromSection}`
    ).join("\n---\n");

    const prompt = getCitationAgentPrompt(sourcesText);
    console.log(`[DeepResearch][CitationAgent] Citation prompt length: ${prompt.length} chars`);

    const result = await callOpenRouter({
        model: AGENT_MODELS.citationAgent,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 2048,
        response_format: { type: "json_object" },
    });

    console.log(`[DeepResearch][CitationAgent] Raw LLM response (first 200 chars):`, result.content?.substring(0, 200));
    console.log(`[DeepResearch][CitationAgent] Model: ${result.model}, Tokens:`, result.usage);

    const parsed = extractJson<CitationAgentResult>(result.content);

    if (!parsed || !parsed.citations) {
        console.warn(`[DeepResearch][CitationAgent] Failed to parse citations from LLM response. Using fallback dedup.`);
        // Fallback: create citation index manually by deduplicating URLs
        return buildFallbackCitations(allSources, sessionId);
    }

    const citations: CitationEntry[] = parsed.citations.map(c => ({
        index: c.index,
        url: c.url,
        title: c.title,
        snippet: c.snippet,
        domain: c.domain,
        favicon: `https://www.google.com/s2/favicons?domain=${c.domain}&sz=32`,
    }));

    const urlToIndex = parsed.url_to_index || {};

    await updateSession(sessionId, { citations });

    return { citations, urlToIndex };
}

/**
 * Fallback citation builder when LLM parsing fails.
 */
async function buildFallbackCitations(
    allSources: Array<{ url: string; title: string; snippet: string; domain: string }>,
    sessionId: string
): Promise<CitationProcessingResult> {
    const urlToIndex: Record<string, number> = {};
    const citations: CitationEntry[] = [];
    let index = 1;

    for (const source of allSources) {
        if (!source.url || urlToIndex[source.url] !== undefined) continue;

        urlToIndex[source.url] = index;
        citations.push({
            index,
            url: source.url,
            title: source.title,
            snippet: source.snippet,
            domain: source.domain,
            favicon: `https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`,
        });
        index++;
    }

    await updateSession(sessionId, { citations });
    return { citations, urlToIndex };
}
