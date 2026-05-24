import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";
import {
    stage1CollectResponses,
    stage2CollectRankings,
    stage3SynthesizeFinal,
    calculateAggregateRankings,
} from "@/lib/council/orchestrator";
import type {
    CouncilStage1Result,
    CouncilStage2Result,
    CouncilSSEEvent,
} from "@/lib/council/types";

/**
 * POST /api/council/run
 */
export async function POST(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }

    let sessionId: string;

    try {
        const body = await req.json();
        sessionId = body.sessionId;
    } catch {
        return new Response(
            JSON.stringify({ error: "Invalid request body" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    if (!sessionId || typeof sessionId !== "string") {
        return new Response(
            JSON.stringify({ error: "sessionId is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    // Fetch session with ownership check
    const { data: session, error: fetchError } = await supabase
        .from("council_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .single();

    if (fetchError || !session) {
        return new Response(
            JSON.stringify({ error: "Session not found or unauthorized" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
        );
    }

    // Prevent re-running completed/failed sessions
    if (session.status !== "collecting") {
        return new Response(
            JSON.stringify({ error: "Session already processed", status: session.status }),
            { status: 409, headers: { "Content-Type": "application/json" } }
        );
    }

    const query = session.query;
    const clientSignal = req.signal;
    const encoder = new TextEncoder();

    // Helper to send an SSE event
    function sendEvent(
        controller: ReadableStreamDefaultController,
        event: CouncilSSEEvent
    ) {
        if (clientSignal.aborted) return;
        controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
    }

    const stream = new ReadableStream({
        async start(controller) {
            try {
                // ─── Stage 1: Collect Individual Responses ──────────
                sendEvent(controller, {
                    stage: 1,
                    type: "stage_start",
                    content: "Council members are deliberating...",
                });

                let stage1Results: CouncilStage1Result[];

                try {
                    stage1Results = await stage1CollectResponses(query);
                } catch (error) {
                    console.error("[Council] Stage 1 failed:", error);
                    await updateSessionStatus(sessionId, "failed");
                    sendEvent(controller, {
                        stage: 1,
                        type: "error",
                        content: "Failed to collect responses from council models.",
                    });
                    controller.close();
                    return;
                }

                if (clientSignal.aborted) { controller.close(); return; }

                if (stage1Results.length === 0) {
                    await updateSessionStatus(sessionId, "failed");
                    sendEvent(controller, {
                        stage: 1,
                        type: "error",
                        content: "No council models responded. Please try again.",
                    });
                    controller.close();
                    return;
                }

                // Stream each model's response to the client
                for (const result of stage1Results) {
                    sendEvent(controller, {
                        stage: 1,
                        type: "model_response",
                        model: result.model,
                        content: result.response,
                    });
                }

                // Persist Stage 1 results & update status
                await supabase
                    .from("council_sessions")
                    .update({
                        stage1_results: stage1Results,
                        status: "ranking",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", sessionId);

                sendEvent(controller, {
                    stage: 1,
                    type: "stage_complete",
                    content: `${stage1Results.length} council members responded.`,
                });

                if (clientSignal.aborted) { controller.close(); return; }

                // ─── Stage 2: Peer Rankings ─────────────────────────
                sendEvent(controller, {
                    stage: 2,
                    type: "stage_start",
                    content: "Council members are reviewing and ranking responses...",
                });

                let stage2Results: CouncilStage2Result[];
                let labelToModel: Record<string, string>;

                try {
                    const rankingResult = await stage2CollectRankings(query, stage1Results);
                    stage2Results = rankingResult.rankings;
                    labelToModel = rankingResult.labelToModel;
                } catch (error) {
                    console.error("[Council] Stage 2 failed:", error);
                    await updateSessionStatus(sessionId, "failed");
                    sendEvent(controller, {
                        stage: 2,
                        type: "error",
                        content: "Failed to collect rankings from council models.",
                    });
                    controller.close();
                    return;
                }

                if (clientSignal.aborted) { controller.close(); return; }

                // Calculate aggregate rankings
                const aggregateRankings = calculateAggregateRankings(
                    stage2Results,
                    labelToModel
                );

                // Stream each model's ranking to the client
                for (const result of stage2Results) {
                    sendEvent(controller, {
                        stage: 2,
                        type: "model_response",
                        model: result.model,
                        content: result.ranking,
                        data: { parsed_ranking: result.parsed_ranking },
                    });
                }

                // Send aggregate rankings
                sendEvent(controller, {
                    stage: 2,
                    type: "rankings_ready",
                    data: {
                        aggregate_rankings: aggregateRankings,
                        label_to_model: labelToModel,
                    },
                });

                // Persist Stage 2 results & update status
                await supabase
                    .from("council_sessions")
                    .update({
                        stage2_results: stage2Results,
                        aggregate_rankings: aggregateRankings,
                        label_to_model: labelToModel,
                        status: "synthesizing",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", sessionId);

                sendEvent(controller, {
                    stage: 2,
                    type: "stage_complete",
                    content: "Peer rankings collected and aggregated.",
                });

                if (clientSignal.aborted) { controller.close(); return; }

                // ─── Stage 3: Chairman Synthesis ────────────────────
                sendEvent(controller, {
                    stage: 3,
                    type: "stage_start",
                    content: "The Chairman is synthesizing the council's collective wisdom...",
                });

                let stage3Result;

                try {
                    stage3Result = await stage3SynthesizeFinal(
                        query,
                        stage1Results,
                        stage2Results
                    );
                } catch (error) {
                    console.error("[Council] Stage 3 failed:", error);
                    await updateSessionStatus(sessionId, "failed");
                    sendEvent(controller, {
                        stage: 3,
                        type: "error",
                        content: "Chairman failed to synthesize the final answer.",
                    });
                    controller.close();
                    return;
                }

                if (clientSignal.aborted) { controller.close(); return; }

                // Stream the synthesis
                sendEvent(controller, {
                    stage: 3,
                    type: "synthesis_chunk",
                    model: stage3Result.model,
                    content: stage3Result.response,
                });

                // Persist Stage 3 result & mark completed
                await supabase
                    .from("council_sessions")
                    .update({
                        stage3_result: stage3Result,
                        status: "completed",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", sessionId);

                sendEvent(controller, {
                    stage: 3,
                    type: "stage_complete",
                    content: "Chairman synthesis complete.",
                });

                // Final completion event
                sendEvent(controller, {
                    stage: 3,
                    type: "council_complete",
                    content: "The Council of NOMI has reached its verdict.",
                });

                controller.close();

            } catch (error) {
                console.error("[Council] Pipeline error:", error);

                try {
                    await updateSessionStatus(sessionId, "failed");
                } catch {
                    // Ignore cleanup errors
                }

                if (!clientSignal.aborted) {
                    sendEvent(controller, {
                        stage: 1,
                        type: "error",
                        content: "An unexpected error occurred during the council process.",
                    });
                }

                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", // Disable Nginx buffering if behind proxy
        },
    });
}

/**
 * Helper to update session status in Supabase.
 */
async function updateSessionStatus(sessionId: string, status: string) {
    await supabase
        .from("council_sessions")
        .update({
            status,
            updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
}
