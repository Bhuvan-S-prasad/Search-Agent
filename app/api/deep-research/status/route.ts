import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";

/**
 * POST /api/deep-research/status
 */
export async function POST(req: NextRequest) {
    try {
        const { sessionId } = await req.json();

        if (!sessionId || typeof sessionId !== "string") {
            return NextResponse.json(
                { error: "sessionId is required" },
                { status: 400 }
            );
        }

        const { data: session, error } = await supabase
            .from("deep_research_sessions")
            .select("*")
            .eq("id", sessionId)
            .single();

        if (error || !session) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ session });

    } catch (error) {
        console.error("Deep research status API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
