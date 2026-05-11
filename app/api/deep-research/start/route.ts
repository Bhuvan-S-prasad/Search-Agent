import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";
import { inngest } from "@/inngest/client";
import { DEEP_RESEARCH_EVENT } from "@/inngest/events";
import type { ActivityLogEntry } from "@/inngest/deep-research/types";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * POST /api/deep-research/start
 */
export async function POST(req: NextRequest) {
    const { userId: clerkUserId } = await auth();
    const user = await currentUser();

    if (!clerkUserId) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { query } = await req.json();
        const userEmail = user?.primaryEmailAddress?.emailAddress || "anonymous";

        if (!query || typeof query !== "string" || !query.trim()) {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 }
            );
        }

        // Create the initial activity log entry
        const initialLog: ActivityLogEntry = {
            timestamp: new Date().toISOString(),
            agent: "system",
            action: "session_created",
            detail: `Deep research session initiated for query: "${query.trim().substring(0, 100)}..."`,
        };

        // Insert a new deep research session
        const { data: session, error: insertError } = await supabase
            .from("deep_research_sessions")
            .insert({
                query: query.trim(),
                user_email: userEmail,
                user_id: clerkUserId,
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

        if (insertError || !session) {
            console.error("Failed to create deep research session:", insertError);
            return NextResponse.json(
                { error: "Failed to create research session" },
                { status: 500 }
            );
        }

        const sessionId = session.id;

        // Dispatch the Inngest event to start the orchestrator
        await inngest.send({
            name: DEEP_RESEARCH_EVENT,
            data: {
                sessionId,
                query: query.trim(),
                userEmail: userEmail,
                userId: clerkUserId,
            },
        });

        console.log(`Deep research session ${sessionId} created and orchestrator dispatched`);

        // Return the session ID as chatId (matches input-box.tsx expectations)
        return NextResponse.json({ chatId: sessionId });

    } catch (error) {
        console.error("Deep research start API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

