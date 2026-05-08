import { inngest } from "../client";
import { DEEP_RESEARCH_EVENT } from "../events";
import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";
import type { ActivityLogEntry } from "./types";

/**
 * Deep Research Orchestrator
 */
export const deepResearchOrchestrator = inngest.createFunction(
    {
        id: "deep-research-orchestrator",
        retries: 1,
    },
    { event: DEEP_RESEARCH_EVENT },
    async ({ event, step }) => {
        const { sessionId, query } = event.data;

        // Step 1: Acknowledge 
        await step.run("acknowledge-session", async () => {
            const logEntry: ActivityLogEntry = {
                timestamp: new Date().toISOString(),
                agent: "orchestrator",
                action: "started",
                detail: `Orchestrator received query: "${query.substring(0, 100)}"`,
            };

            // Fetch current activity log, append new entry, and update status
            const { data: session } = await supabase
                .from("deep_research_sessions")
                .select("activity_log")
                .eq("id", sessionId)
                .single();

            const currentLog = (session?.activity_log as ActivityLogEntry[]) || [];

            const { error } = await supabase
                .from("deep_research_sessions")
                .update({
                    status: "planning",
                    activity_log: [...currentLog, logEntry],
                })
                .eq("id", sessionId);

            if (error) {
                console.error("Failed to update session status:", error);
                throw error;
            }

            return { sessionId, status: "planning" };
        });

        // Plan Report Structure
        // Spawn Sub-Agents for parallel research
        // Citation processing, Synthesis, Review

        return {
            success: true,
            sessionId,
            message: "Orchestrator skeleton executed — full pipeline coming in Phase 2-4",
        };
    }
);
