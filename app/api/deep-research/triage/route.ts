import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { callOpenRouter } from "@/lib/openrouter";
import { extractJson } from "@/lib/json-utils";

/**
 * Deep Research Triage API — Classifies user intent as "chat" or "research"
 * when the DeepSearch mode is selected in the input box.
 *
 * Unlike the search triage (/api/plan), this is classification-only because
 * the deep research orchestrator handles its own query planning internally.
 */

const TRIAGE_MODEL = "google/gemini-2.0-flash-lite-001";

export async function POST(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { query } = await req.json();

        if (!query || typeof query !== "string" || !query.trim()) {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 }
            );
        }

        const triagePrompt = `You are an intent classifier for a deep research system. This system performs comprehensive multi-agent research — searching multiple sources, analyzing findings, and producing detailed research reports (2000-6000 words).

Given a user input, classify it into one of two categories:

1. "chat" — Messages that do NOT warrant a full deep research investigation:
   - Greetings and small talk: "hi", "hello", "how are you", "thanks", "bye"
   - Simple factual questions that can be answered in a sentence: "what year was Python created?", "who is the CEO of Google?"
   - Casual conversation: "tell me a joke", "what's up", "good morning"
   - Vague or empty prompts: "test", "asdf", "hmm", "okay"
   - Simple commands or requests: "help", "what can you do?"

2. "research" — Queries that genuinely benefit from deep, multi-source research:
   - Complex topics requiring analysis: "explain how transformer architecture works and its evolution"
   - Comparative analysis: "compare React vs Vue vs Angular for enterprise applications in 2025"
   - Current events or trends: "latest developments in quantum computing"
   - Multi-faceted questions: "what are the economic, social, and environmental impacts of AI"
   - In-depth explainers: "how does CRISPR gene editing work and what are its applications"
   - Research-worthy topics: "state of renewable energy adoption globally"

User input: "${query.replace(/"/g, '\\"')}"

Respond with ONLY a JSON object in this exact format, nothing else:
{"intent": "chat"} or {"intent": "research"}`;

        try {
            const result = await callOpenRouter({
                model: TRIAGE_MODEL,
                messages: [{ role: "user", content: triagePrompt }],
                temperature: 0.1,
                max_tokens: 50,
                response_format: { type: "json_object" },
            });

            const parsed = extractJson<{ intent: string }>(result.content);
            const intent = parsed?.intent === "chat" ? "chat" : "research";
            return NextResponse.json({ intent });
        } catch (parseError) {
            console.warn("Failed to parse deep research triage response:", parseError);
            // Default to research — safer to over-research than miss a query
            return NextResponse.json({ intent: "research" });
        }
    } catch (error) {
        console.error("Deep research triage API error:", error);
        return NextResponse.json({ intent: "research" });
    }
}
