import { NextRequest, NextResponse } from "next/server";

/**
 * Triage API — Classifies user intent as "chat" or "search"
 * Uses Gemini 2.0 Flash for fast, cheap classification
 */
export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();

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

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: triagePrompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 50,
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        if (!response.ok) {
            console.error("Gemini API error:", response.status, response.statusText);
            // Default to search on API failure — safer fallback
            return NextResponse.json({ intent: "search" });
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        try {
            const parsed = JSON.parse(text);
            const intent = parsed.intent === "chat" ? "chat" : "search";
            return NextResponse.json({ intent });
        } catch {
            // If parsing fails, default to search
            console.warn("Failed to parse triage response:", text);
            return NextResponse.json({ intent: "search" });
        }
    } catch (error) {
        console.error("Triage API error:", error);
        return NextResponse.json({ intent: "search" });
    }
}
