import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";
import type { ActivityLogEntry, ResearchStatus } from "./types";

/**
 * Append an entry to a session's activity_log and optionally update status.
 */
export async function appendActivityLog(
    sessionId: string,
    entry: Omit<ActivityLogEntry, "timestamp">,
    statusUpdate?: ResearchStatus
) {
    const { data: session } = await supabase
        .from("deep_research_sessions")
        .select("activity_log")
        .eq("id", sessionId)
        .single();

    const currentLog = (session?.activity_log as ActivityLogEntry[]) || [];
    const newEntry: ActivityLogEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
    };

    const updatePayload: Record<string, unknown> = {
        activity_log: [...currentLog, newEntry],
    };
    if (statusUpdate) {
        updatePayload.status = statusUpdate;
    }

    const { error } = await supabase
        .from("deep_research_sessions")
        .update(updatePayload)
        .eq("id", sessionId);

    if (error) {
        console.error(`Failed to append activity log for session ${sessionId}:`, error);
        throw error;
    }
}

/**
 * Update a session's fields in Supabase.
 */
export async function updateSession(
    sessionId: string,
    fields: Record<string, unknown>
) {
    const { error } = await supabase
        .from("deep_research_sessions")
        .update(fields)
        .eq("id", sessionId);

    if (error) {
        console.error(`Failed to update session ${sessionId}:`, error);
        throw error;
    }
}
