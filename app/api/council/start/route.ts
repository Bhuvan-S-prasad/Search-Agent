import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";

/**
 * POST /api/council/start
 */
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { query } = await req.json();
        const userEmail = user.primaryEmailAddress?.emailAddress || "anonymous";

        if (!query || typeof query !== "string" || !query.trim()) {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 }
            );
        }

        // Create the council session
        const { data: session, error: insertError } = await supabase
            .from("council_sessions")
            .insert({
                query: query.trim(),
                user_email: userEmail,
                user_id: userId,
                status: "collecting",
                stage1_results: [],
                stage2_results: [],
                stage3_result: null,
                aggregate_rankings: [],
                label_to_model: {},
            })
            .select("id")
            .single();

        if (insertError || !session) {
            console.error("Failed to create council session:", insertError);
            return NextResponse.json(
                { error: "Failed to create council session" },
                { status: 500 }
            );
        }

        console.log(`[Council] Session ${session.id} created. Metadata: query_length=${query.trim().length}, user_id=${userId}`);

        return NextResponse.json({ sessionId: session.id });

    } catch (error) {
        console.error("Council start API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
