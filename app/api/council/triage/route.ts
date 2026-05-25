import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { callOpenRouter } from "@/lib/openrouter";
import { extractJson } from "@/lib/json-utils";

/**
 * Council of NOMI Triage API — Classifies user intent as "chat" or "deliberation"
 * when the Council mode is selected in the input box.
 *
 * This prevents triggering expensive multi-model deliberations on simple chat queries.
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

        const triagePrompt = `You are an intent classifier for a collaborative LLM council system called the Council of NOMI. This system runs four diverse LLM models in parallel to debate and rankings-evaluate a topic, followed by a chairman model synthesizing the final consensus.

Given a user input, classify it into one of two categories:

1. "chat" — Messages that do NOT warrant a full multi-model deliberation:
   - Greetings and small talk: "hi", "hello", "how are you", "thanks", "bye"
   - Simple factual questions that can be answered in a single sentence: "what year was Python created?", "who is the CEO of Google?"
   - Casual conversation: "tell me a joke", "what's up", "good morning"
   - Vague or empty prompts: "test", "asdf", "hmm", "okay"
   - Simple commands or requests: "help", "what can you do?"

2. "deliberation" — Complex, open-ended, analytical, philosophical, architectural, or multi-perspective questions that genuinely benefit from multiple diverse models debating and seeking a consensus:
   - Philosophical / open-ended questions: "is artificial consciousness possible?", "what is the meaning of life?"
   - Technical / architectural design debates: "should we use microservices or monolithic architecture for a fintech startup?", "compare SQL vs NoSQL for a highly scalable logging system"
   - Analytical comparisons: "analyze the pros and cons of remote work vs hybrid work", "compare React and Svelte"
   - Multi-perspective debates: "what are the ethical implications of genetic engineering?"
   - In-depth explainers with trade-offs: "what is the best approach to handle state management in a massive Next.js project?"

User input: "${query.replace(/"/g, '\\"')}"

Respond with ONLY a JSON object in this exact format, nothing else:
{"intent": "chat"} or {"intent": "deliberation"}`;

        try {
            const result = await callOpenRouter({
                model: TRIAGE_MODEL,
                messages: [{ role: "user", content: triagePrompt }],
                temperature: 0.1,
                max_tokens: 50,
                response_format: { type: "json_object" },
            });

            const parsed = extractJson<{ intent: string }>(result.content);
            const intent = parsed?.intent === "chat" ? "chat" : "deliberation";
            return NextResponse.json({ intent });
        } catch (parseError) {
            console.warn("Failed to parse council triage response:", parseError);
            // Default to deliberation — safer to run than error out
            return NextResponse.json({ intent: "deliberation" });
        }
    } catch (error) {
        console.error("Council triage API error:", error);
        return NextResponse.json({ intent: "deliberation" });
    }
}
