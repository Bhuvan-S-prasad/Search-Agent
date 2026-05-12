import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchInput } = await req.json();
        const userEmail = user.primaryEmailAddress?.emailAddress;
        const libId = uuidv4();

        if (!searchInput) {
            return NextResponse.json({ error: "searchInput is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("Library")
            .insert([
                {
                    libId: libId,
                    searchInput: searchInput,
                    userEmail: userEmail,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error("Error creating library record:", error);
            return NextResponse.json({ error: "Failed to create search record" }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Error in search create API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
