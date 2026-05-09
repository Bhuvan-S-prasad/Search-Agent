import { callOpenRouter } from "@/lib/openrouter";
import { extractJson } from "@/lib/json-utils";
import { getSubAgentAnalysisPrompt } from "./prompts";
import {
    AGENT_MODELS,
    type SectionPlan,
    type SectionFindings,
    type SourceReference,
} from "./types";

interface SearchResultItem {
    title?: string;
    snippet?: string;
    displayLink?: string;
    link?: string;
    pagemap?: {
        cse_image?: Array<{ src?: string }>;
        cse_thumbnail?: Array<{ src?: string }>;
    };
}

interface AnalysisResult {
    section_id: string;
    section_heading: string;
    key_findings: string[];
    detailed_content: string;
    sources_used: number[];
}

/**
 * Executes Google Search queries by calling the internal API directly.
 */
async function executeSearch(queries: string[]): Promise<SearchResultItem[]> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    console.log(`[DeepResearch][SubAgent] Executing search with ${queries.length} queries:`);
    queries.forEach((q, i) => console.log(`[DeepResearch][SubAgent]   Query ${i+1}: "${q}"`));

    try {
        const response = await fetch(`${baseUrl}/api/google-search-api`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ searchInputs: queries }),
        });

        if (!response.ok) {
            console.error(`[DeepResearch][SubAgent] Search API error: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        const items = data.items || [];
        console.log(`[DeepResearch][SubAgent] Search returned ${items.length} results`);
        items.forEach((item: SearchResultItem, i: number) => {
            console.log(`[DeepResearch][SubAgent]   [${i}] ${item.title} — ${item.link}`);
        });
        return items;
    } catch (error) {
        console.error(`[DeepResearch][SubAgent] Failed to execute search:`, error);
        return [];
    }
}

/**
 * Research a single section: search the web, then analyze results with LLM.
 */
export async function researchSection(
    section: SectionPlan,
    sessionId: string
): Promise<SectionFindings> {
    console.log(`[DeepResearch][SubAgent] ── Researching section: "${section.heading}" (${section.id})`);

    // Step 1: Execute search queries for this section
    const searchResults = await executeSearch(section.search_queries);

    // Format search results for the LLM
    const formattedResults = searchResults.map((item, index) => (
        `[${index}] ${item.title || "Untitled"}
URL: ${item.link || ""}
Snippet: ${item.snippet || "No description"}
Domain: ${item.displayLink || ""}`
    )).join("\n---\n");

    // Step 2: Analyze results with LLM
    const prompt = getSubAgentAnalysisPrompt(
        section.heading,
        section.description,
        formattedResults || "No search results were found for this section."
    );

    const result = await callOpenRouter({
        model: AGENT_MODELS.subAgent,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: "json_object" },
    });

    console.log(`[DeepResearch][SubAgent] LLM response for "${section.heading}" (first 300 chars):`, result.content?.substring(0, 300));
    console.log(`[DeepResearch][SubAgent] Model: ${result.model}, Tokens:`, result.usage);

    const analysis = extractJson<AnalysisResult>(result.content);

    if (!analysis) {
        console.warn(`[DeepResearch][SubAgent] Failed to parse analysis for "${section.heading}". Raw:`, result.content?.substring(0, 200));
    } else {
        console.log(`[DeepResearch][SubAgent] Parsed analysis for "${section.heading}":`)
        console.log(`[DeepResearch][SubAgent]   Key findings: ${analysis.key_findings?.length || 0}`);
        console.log(`[DeepResearch][SubAgent]   Content length: ${analysis.detailed_content?.length || 0} chars`);
        console.log(`[DeepResearch][SubAgent]   Sources used indices: [${analysis.sources_used?.join(', ') || 'none'}]`);
    }

    // Build source references from the search results that were actually used
    const sources: SourceReference[] = [];
    const usedIndices = analysis?.sources_used || [];

    for (const idx of usedIndices) {
        const item = searchResults[idx];
        if (item) {
            sources.push({
                url: item.link || "",
                title: item.title || "Untitled",
                snippet: item.snippet || "",
                domain: item.displayLink || "",
                favicon: item.pagemap?.cse_thumbnail?.[0]?.src ||
                    `https://www.google.com/s2/favicons?domain=${item.displayLink}&sz=32`,
            });
        }
    }

    // Also add any sources that weren't in sources_used but have URLs
    // (some LLMs may not perfectly track indices)
    if (sources.length === 0 && searchResults.length > 0) {
        for (const item of searchResults.slice(0, 5)) {
            sources.push({
                url: item.link || "",
                title: item.title || "Untitled",
                snippet: item.snippet || "",
                domain: item.displayLink || "",
                favicon: `https://www.google.com/s2/favicons?domain=${item.displayLink}&sz=32`,
            });
        }
    }

    console.log(`[DeepResearch][SubAgent] Final sources for "${section.heading}": ${sources.length} references`);

    return {
        section_id: section.id,
        section_heading: section.heading,
        key_findings: analysis?.key_findings || [],
        detailed_content: analysis?.detailed_content || "",
        sources,
    };
}
