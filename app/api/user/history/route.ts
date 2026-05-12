import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";

export async function GET() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const userEmail = user.primaryEmailAddress?.emailAddress;
        
        if (!userEmail) {
             return NextResponse.json({ error: "User email not found" }, { status: 400 });
        }

        // Fetch Search History (Library)
        const { data: libraryHistory, error: libraryError } = await supabase
            .from("Library")
            .select("*")
            .eq("userEmail", userEmail)
            .order("id", { ascending: false });

        if (libraryError) throw libraryError;

        // Fetch Research History
        const { data: researchHistory, error: researchError } = await supabase
            .from("deep_research_sessions")
            .select("id, query, status, user_email, created_at")
            .eq("user_email", userEmail)
            .order("created_at", { ascending: false })
            .limit(10);

        if (researchError) throw researchError;

        return NextResponse.json({
            library: libraryHistory || [],
            research: researchHistory || []
        });

    } catch (error) {
        console.error("Error fetching user history:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
