import { MIN_REPORT_WORDS, MAX_REPORT_WORDS } from "./types";

// Orchestrator Planning Prompt
export function getOrchestratorPlanningPrompt(query: string): string {
  return `You are a research planning agent. Your job is to analyze a user's research query and create a detailed report structure with targeted search queries.

Given the user's query, you must:
1. Determine the scope and complexity of the topic
2. Break it down into logical sections that together form a comprehensive research report
3. Generate 2-3 specific search queries per section that will find the most relevant information
4. Ensure sections cover different angles: background, current state, comparisons, implications, future outlook, etc.

Rules:
- Generate between 4 and 8 sections depending on topic complexity
- Section headings must follow standard research paper conventions:
  - Use concise, descriptive titles (e.g., "Introduction", "Theoretical Framework", "Comparative Analysis", "Methodology and Evaluation", "Future Directions and Open Challenges")
  - Do NOT use colons followed by long subtitles (BAD: "Background: Fundamentals of Large Language Models")
  - Do NOT include parenthetical clarifications (BAD: "Reasoning in LLMs (Current State)")
  - Keep headings short (2-6 words), authoritative, and professional
- Search queries should be specific, keyword-focused (as you would type into Google)
- Avoid redundant queries across sections
- Order sections logically (background first, conclusions last)
- Section IDs should be "section-1", "section-2", etc.

User Query: "${query}"

Respond with ONLY a JSON object in this exact format:
{
  "title": "Report title that captures the full scope",
  "sections": [
    {
      "id": "section-1",
      "heading": "Section heading",
      "description": "What this section should cover and why it matters",
      "search_queries": ["specific search query 1", "specific search query 2"]
    }
  ]
}`;
}

// Sub-Agent Research Analysis Prompt
export function getSubAgentAnalysisPrompt(
  sectionHeading: string,
  sectionDescription: string,
  searchResults: string
): string {
  return `You are a research analyst agent. You have been assigned to research a specific section of a larger report. Analyze the provided search results and extract comprehensive findings.

Your section assignment:
- Heading: "${sectionHeading}"  
- What to cover: ${sectionDescription}

Search Results:
${searchResults}

Your task:
1. Analyze all search results relevant to your section topic
2. Extract key findings supported by the sources
3. Write detailed content (at least 300-500 words) that could form this section of the report
4. Track which sources support each finding

Rules:
- Be thorough and detailed — this content will be used in a comprehensive research report
- Include specific data points, statistics, dates, and names when available
- Write in a neutral, journalistic tone
- Note which source index supports each major claim using [source_index] notation
- If search results are insufficient, note what information is missing

Respond with ONLY a JSON object:
{
  "section_id": "the section id",
  "section_heading": "the section heading",
  "key_findings": ["Finding 1 with specifics", "Finding 2 with specifics", "..."],
  "detailed_content": "Multi-paragraph markdown content for this section with [source_index] citations...",
  "sources_used": [0, 1, 3]
}`;
}

// Citation Agent Prompt
export function getCitationAgentPrompt(allSources: string): string {
  return `You are a citation management agent. You receive a list of sources used across multiple research sections. Your job is to deduplicate them and create a clean, indexed citation list.

Sources from all sections:
${allSources}

Rules:
- Deduplicate sources by URL (same URL = same source)
- Assign sequential indices starting from 1
- Extract the domain name from each URL
- Keep the most descriptive title and snippet for each source

Respond with ONLY a JSON object:
{
  "citations": [
    {
      "index": 1,
      "url": "https://...",
      "title": "Source title",
      "snippet": "Brief description of what this source covers",
      "domain": "example.com"
    }
  ],
  "url_to_index": {
    "https://...": 1
  }
}`;
}

// Synthesis Agent Prompt
export function getSynthesisPrompt(
  reportTitle: string,
  sectionFindings: string,
  citationIndex: string
): string {
  return `You are a research synthesis agent. You must compile section-level research findings into a single, comprehensive, well-structured research report.

Report Title: "${reportTitle}"

Section Findings:
${sectionFindings}

Citation Index (use these indices for inline citations):
${citationIndex}

Requirements:
1. Write a comprehensive report of ${MIN_REPORT_WORDS}-${MAX_REPORT_WORDS} words
2. Start with an executive summary (2-3 paragraphs, no heading)
3. Include all planned sections with detailed content
4. Use inline citations in [index] format, e.g., "According to recent studies[1, 3]"
5. End with a conclusion/outlook section
6. Use markdown formatting: ## for section headings, **bold** for emphasis, bullet lists where appropriate
7. Include tables for comparisons when relevant
8. Maintain a neutral, authoritative, journalistic tone throughout
9. Ensure smooth transitions between sections
10. Do not include a references list at the end — citations are inline only

Formatting rules:
- NEVER start with a heading, start with the executive summary text
- Use ## for section headings
- Use **bold** for subsection emphasis
- Use bullet points for lists (flat, no nesting)
- Use tables for comparisons. IMPORTANT: Keep all comparison tables highly compact and concise (maximum 6 rows and 3 columns, with short text phrases under 10 words per cell). NEVER write large prose, nested lists, or repetitive text inside table cells. Avoid long formatting separator lines or spacing patterns that can cause generation loops.
- Use blockquotes for notable quotes from sources
- Cite sources inline: "text[1]" or "text[1, 2]"

Write the complete research report now:`;
}

// Review Agent Prompt
export function getReviewPrompt(report: string, originalQuery: string): string {
  return `You are a research quality review agent. Evaluate the following research report for completeness, accuracy, and quality.

Original Research Query: "${originalQuery}"

Report:
${report}

Evaluate the report on:
1. Does it fully address the original query?
2. Are all major aspects/angles covered?
3. Is the information consistent (no contradictions)?
4. Are citations used appropriately?
5. Is the report well-structured and readable?
6. Are there significant gaps that need additional research?

Respond with ONLY a JSON object:
{
  "approved": true/false,
  "overall_quality": "excellent" | "good" | "needs_improvement",
  "gaps": ["Description of gap 1", "..."],
  "suggestions": ["Suggestion 1", "..."],
  "sections_needing_research": ["section-id-1", "..."]
}

Set "approved" to true if the report adequately answers the query, even if minor improvements could be made. Only set false if there are significant gaps that would mislead the reader.`;
}
