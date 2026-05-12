import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const libId = searchParams.get("libId");

    if (!libId) {
        return NextResponse.json({ error: "libId is required" }, { status: 400 });
    }

    try {
        const userEmail = user.primaryEmailAddress?.emailAddress;

        const { data: Library, error } = await supabase
            .from("Library")
            .select("*,chats(*)")
            .eq("libId", libId)
            .eq("userEmail", userEmail) 
            .order('id', { foreignTable: 'chats', ascending: true })
            .maybeSingle();

        if (error || !Library) {
            return NextResponse.json({ error: "Record not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json(Library);

    } catch (error) {
        console.error("Error fetching search record:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
