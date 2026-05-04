import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter, DEFAULT_MODEL } from "@/lib/openrouter";

/**
 * Triage API — Classifies user intent as "chat" or "search"
 * Uses OpenRouter for fast, cheap classification
 */
export async function POST(req: NextRequest) {
    try {
        const { query, model } = await req.json();

        if (!query || typeof query !== "string") {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 }
            );
        }

        const triagePrompt = `You are an intent classifier. Given a user input, classify it into one of two categories:

1. "chat" — Simple conversational messages, greetings, small talk, thank yous, or messages that don't need any web search or external information. Examples: "hi", "hello", "how are you", "thanks", "good morning", "what's up", "bye", "tell me a joke".

2. "search" — Queries that require looking up information, facts, news, research, comparisons, explanations, or any topic that benefits from web search results. Examples: "what is quantum computing", "latest news about AI", "compare React vs Vue", "weather in Tokyo", "who won the 2024 election".

User input: "${query.replace(/"/g, '\\"')}"

Respond with ONLY a JSON object in this exact format, nothing else:
{"intent": "chat"} or {"intent": "search"}`;

        try {
            const result = await callOpenRouter({
                model: model || DEFAULT_MODEL,
                messages: [{ role: "user", content: triagePrompt }],
                temperature: 0.1,
                max_tokens: 50,
                response_format: { type: "json_object" },
            });

            const parsed = JSON.parse(result.content);
            const intent = parsed.intent === "chat" ? "chat" : "search";
            return NextResponse.json({ intent });
        } catch (parseError) {
            console.warn("Failed to parse triage response:", parseError);
            return NextResponse.json({ intent: "search" });
        }
    } catch (error) {
        console.error("Triage API error:", error);
        return NextResponse.json({ intent: "search" });
    }
}
