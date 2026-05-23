import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";
import { callOpenRouter, streamOpenRouter } from "@/lib/openrouter";
import { extractJson } from "@/lib/json-utils";
import { inngest } from "@/inngest/client";
import { DEEP_RESEARCH_EVENT } from "@/inngest/events";
import { compressReportForContext } from "@/inngest/deep-research/summarize-report";
import type {
    DeepResearchSession,
    ActivityLogEntry,
} from "@/inngest/deep-research/types";

const TRIAGE_MODEL = "google/gemini-2.0-flash-lite-001";
const CHAT_MODEL = "google/gemini-2.0-flash-lite-001";

/**
 * POST /api/deep-research/followup
 *
 * Handles follow-up interactions on a completed deep research session.
 * - Triages the follow-up as "chat" or "research"
 * - If "chat": streams a contextual response using the compressed report as context
 * - If "research": creates a new session and dispatches the orchestrator
 */
export async function POST(req: NextRequest) {
    const clientSignal = req.signal;
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const { sessionId, query } = await req.json();

        if (!sessionId || !query?.trim()) {
            return new Response(
                JSON.stringify({ error: "sessionId and query are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Fetch the parent session (with ownership check)
        const { data: parentSession, error: fetchError } = await supabase
            .from("deep_research_sessions")
            .select("*")
            .eq("id", sessionId)
            .eq("user_id", userId)
            .single();

        if (fetchError || !parentSession) {
            return new Response(
                JSON.stringify({ error: "Session not found or unauthorized" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // Compress the report for context
        const reportContext = compressReportForContext(
            parentSession as unknown as DeepResearchSession
        );

        // Step 1: Triage the follow-up query
        let intent = "research";
        try {
            const triagePrompt = `You are an intent classifier for a deep research system. The user has already received a research report and is now asking a follow-up question.

Previous research context:
${reportContext}

Given their follow-up input, classify it into one of two categories:

1. "chat" — Follow-up questions that can be answered using the existing research report context:
   - Questions about the report: "summarize the key findings", "what did you find about X?"
   - Clarification requests: "explain section 3 in simpler terms", "what does this mean?"
   - Greetings or casual messages: "thanks", "great work", "hi"
   - Simple opinions or reflections: "that's interesting", "I agree"
   - Questions answerable from the existing report content

2. "research" — Follow-up queries that need NEW deep research:
   - New topics not covered in the report: "now research Y instead"
   - Requests to go deeper on a specific angle: "do a deep dive into the economic impact"
   - Comparative analysis with new subjects: "compare this with Z"
   - Updated/current information requests: "what are the latest developments in this area"
   - Complex questions requiring new web searches

User's follow-up input: "${query.trim().replace(/"/g, '\\"')}"

Respond with ONLY a JSON object:
{"intent": "chat"} or {"intent": "research"}`;

            const triageResult = await callOpenRouter({
                model: TRIAGE_MODEL,
                messages: [{ role: "user", content: triagePrompt }],
                temperature: 0.1,
                max_tokens: 50,
                response_format: { type: "json_object" },
            });

            const parsed = extractJson<{ intent: string }>(triageResult.content);
            intent = parsed?.intent === "chat" ? "chat" : "research";
        } catch (triageError) {
            console.warn("Follow-up triage failed, defaulting to research:", triageError);
        }

        // Step 2: Handle based on intent
        if (intent === "research") {
            // Create a new research session
            const userEmail = user.primaryEmailAddress?.emailAddress || "anonymous";

            const initialLog: ActivityLogEntry = {
                timestamp: new Date().toISOString(),
                agent: "system",
                action: "session_created",
                detail: `Follow-up research session initiated: "${query.trim().substring(0, 100)}..."`,
            };

            const { data: newSession, error: insertError } = await supabase
                .from("deep_research_sessions")
                .insert({
                    query: query.trim(),
                    user_email: userEmail,
                    user_id: userId,
                    status: "planning",
                    report_plan: null,
                    section_findings: [],
                    citations: [],
                    final_report: "",
                    activity_log: [initialLog],
                    iteration_count: 0,
                })
                .select("id")
                .single();

            if (insertError || !newSession) {
                console.error("Failed to create follow-up session:", insertError);
                return new Response(
                    JSON.stringify({ error: "Failed to create research session" }),
                    { status: 500, headers: { "Content-Type": "application/json" } }
                );
            }

            // Dispatch the Inngest orchestrator
            await inngest.send({
                name: DEEP_RESEARCH_EVENT,
                data: {
                    sessionId: newSession.id,
                    query: query.trim(),
                    userEmail,
                    userId,
                },
            });

            return new Response(
                JSON.stringify({
                    type: "research",
                    sessionId: newSession.id,
                }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Intent is "chat" — stream a contextual response
        const chatSystemPrompt = `You are NOMI, a helpful AI research assistant. The user previously received a deep research report and is now asking a follow-up question about it.

Use the research context below to inform your response. Be conversational, accurate, and reference specific findings from the report when relevant.

Research Context:
${reportContext}

Rules:
- Answer based on the research context provided
- Be concise but thorough
- If the question is about something not covered in the research, say so honestly
- Do not make up information not present in the research context
- Use markdown formatting for readability
- Do not use citations (the user already has the full report with citations)`;

        const messages = [
            { role: "system", content: chatSystemPrompt },
            { role: "user", content: query.trim() },
        ];

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    let fullText = "";

                    try {
                        const llmResponse = await streamOpenRouter({
                            model: CHAT_MODEL,
                            messages,
                            temperature: 0.5,
                            max_tokens: 2048,
                            signal: clientSignal,
                        });

                        if (!llmResponse.body) {
                            throw new Error("No response body from OpenRouter");
                        }

                        const reader = llmResponse.body.getReader();
                        const decoder = new TextDecoder();
                        let buffer = "";

                        clientSignal.addEventListener("abort", () => {
                            reader.cancel("client disconnected").catch(() => {});
                        });

                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            if (clientSignal.aborted) break;

                            buffer += decoder.decode(value, { stream: true });

                            const lines = buffer.split("\n");
                            buffer = lines.pop() || "";

                            for (const line of lines) {
                                const trimmed = line.trim();
                                if (!trimmed || trimmed === "data: [DONE]") continue;
                                if (!trimmed.startsWith("data: ")) continue;

                                try {
                                    const json = JSON.parse(trimmed.slice(6));
                                    const token = json?.choices?.[0]?.delta?.content;
                                    if (typeof token === "string" && token.length > 0) {
                                        fullText += token;
                                        controller.enqueue(
                                            encoder.encode(
                                                `data: ${JSON.stringify({ type: "chat", token })}\n\n`
                                            )
                                        );
                                    }
                                } catch (parseErr) {
                                    console.warn("SSE parse error:", trimmed, parseErr);
                                }
                            }
                        }
                    } catch (streamError) {
                        // Fallback to non-streaming
                        console.warn("Streaming failed, falling back:", streamError);
                        const fallbackResult = await callOpenRouter({
                            model: CHAT_MODEL,
                            messages,
                            temperature: 0.5,
                            max_tokens: 2048,
                        });
                        fullText = fallbackResult.content || "";
                        if (fullText) {
                            controller.enqueue(
                                encoder.encode(
                                    `data: ${JSON.stringify({ type: "chat", token: fullText })}\n\n`
                                )
                            );
                        }
                    }

                    if (!clientSignal.aborted) {
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({ type: "chat", done: true })}\n\n`
                            )
                        );
                    }
                    controller.close();
                } catch (error) {
                    console.error("Follow-up chat stream error:", error);
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ error: "Generation failed" })}\n\n`
                        )
                    );
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        console.error("Follow-up API error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
