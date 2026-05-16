import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { callOpenRouter, DEFAULT_MODEL } from "@/lib/openrouter";
import { getRecentHistory } from "@/services/chat-history";
import { extractJson } from "@/lib/json-utils";

/**
 * Plan API — Single LLM call that combines intent classification (triage)
 * and search query decomposition (query planning).
 *
 * Returns: { intent: "chat" | "search", queries: string[] }
 *
 * This replaces two separate sequential API calls (/api/triage + /api/query-planner)
 * with one, saving ~800-2000ms of latency.
 */
export async function POST(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { query, model, libId } = await req.json();

        if (!query || typeof query !== "string") {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 }
            );
        }

        let historyContext = "";
        if (libId) {
            const history = await getRecentHistory(libId, 5);
            if (history.length > 0) {
                historyContext = "\nConversation History:\n" + 
                    history.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join("\n");
            }
        }

        const planPrompt = `You are an intent classifier and search query planner. Given a user input, you must:

1. Classify the intent as either "chat" or "search":
   - "chat" — Simple conversational messages, greetings, small talk, thank yous, or messages that don't need any web search or external information. Examples: "hi", "hello", "how are you", "thanks", "good morning", "what's up", "bye", "tell me a joke".
   - "search" — Queries that require looking up information, facts, news, research, comparisons, explanations, or any topic that benefits from web search results. Examples: "what is quantum computing", "latest news about AI", "compare React vs Vue", "weather in Tokyo", "who won the 2024 election".

2. If the intent is "search", generate 1-5 optimized Google search queries:
   - For simple factual questions, generate just 1 query.
   - For complex or multi-faceted questions, generate 3-5 queries covering different angles.
   - Make queries specific — add relevant keywords, dates, or technical terms.
   - Avoid redundant queries that would return the same results.
   - Format queries as you would type them into Google — concise and keyword-focused.

3. If the intent is "chat", return an empty queries array.
${historyContext}

User input: "${query.replace(/"/g, '\\"')}"

Respond with ONLY a JSON object in this exact format:
{"intent": "chat", "queries": []}
or
{"intent": "search", "queries": ["query 1", "query 2", ...]}`;

        try {
            const result = await callOpenRouter({
                model: model || DEFAULT_MODEL,
                messages: [{ role: "user", content: planPrompt }],
                temperature: 0.2,
                max_tokens: 300,
                response_format: { type: "json_object" },
            });

            const parsed = extractJson<{ intent: string; queries: string[] }>(result.content);
            
            const intent = parsed?.intent === "chat" ? "chat" : "search";
            
            let queries: string[] = [];
            if (intent === "search") {
                queries = (parsed && Array.isArray(parsed.queries))
                    ? parsed.queries.filter((q: unknown) => typeof q === "string" && (q as string).trim()).slice(0, 5)
                    : [query];
                
                if (queries.length === 0) {
                    queries = [query];
                }
            }

            return NextResponse.json({ intent, queries });
        } catch (parseError) {
            console.warn("Failed to parse plan response:", parseError);
            // Default to search with original query as fallback
            return NextResponse.json({ intent: "search", queries: [query] });
        }
    } catch (error) {
        console.error("Plan API error:", error);
        // query is out of scope here — return search intent with empty queries
        // so the caller falls back to using the original query
        return NextResponse.json({ intent: "search", queries: [] });
    }
}
