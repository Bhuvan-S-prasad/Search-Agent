import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { libId, searchResult, userSearchInput, intent } = await req.json();
        const userEmail = user.primaryEmailAddress?.emailAddress;

        // 1. Verify ownership of the library record first
        const { data: Library, error: libError } = await supabase
            .from("Library")
            .select("id")
            .eq("libId", libId)
            .eq("userEmail", userEmail)
            .maybeSingle();

        if (libError || !Library) {
            return NextResponse.json({ error: "Unauthorized access to this library" }, { status: 403 });
        }

        // 2. Insert the chat record
        const { data, error } = await supabase
            .from("chats")
            .insert([
                {
                    libId: libId,
                    searchResult: searchResult,
                    userSearchInput: userSearchInput,
                    intent: intent
                },
            ])
            .select();

        if (error) {
            console.error("Error inserting chat:", error);
            return NextResponse.json({ error: "Failed to insert chat" }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Error in search chat API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
