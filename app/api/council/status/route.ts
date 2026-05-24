import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";

/**
 * POST /api/council/status
 */
export async function POST(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { sessionId } = await req.json();

        if (!sessionId || typeof sessionId !== "string") {
            return NextResponse.json(
                { error: "sessionId is required" },
                { status: 400 }
            );
        }

        const { data: session, error } = await supabase
            .from("council_sessions")
            .select("*")
            .eq("id", sessionId)
            .eq("user_id", userId) // Ownership check
            .single();

        if (error || !session) {
            return NextResponse.json(
                { error: "Session not found or unauthorized" },
                { status: 404 }
            );
        }

        return NextResponse.json({ session });

    } catch (error) {
        console.error("Council status API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
