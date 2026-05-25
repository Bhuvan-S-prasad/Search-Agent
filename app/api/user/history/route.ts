import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";
import { CouncilItem } from "@/types";

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

        // Fetch Council Sessions History
        let councilHistory: Omit<CouncilItem, "user_email">[] = [];
        const { data: councilData, error: councilError } = await supabase
            .from("council_sessions")
            .select("id, query, status, created_at")
            .eq("user_email", userEmail)
            .order("created_at", { ascending: false })
            .limit(10);

        if (councilError) {
            console.error("Error fetching council history:", councilError);
        } else {
            councilHistory = councilData || [];
        }

        return NextResponse.json({
            library: libraryHistory || [],
            research: researchHistory || [],
            council: councilHistory || []
        });

    } catch (error) {
        console.error("Error fetching user history:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
