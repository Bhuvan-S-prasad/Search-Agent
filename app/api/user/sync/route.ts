import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";

export async function POST() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const email = user.primaryEmailAddress?.emailAddress;
        
        if (!email) {
            return NextResponse.json(
                { error: "User email not found" },
                { status: 400 }
            );
        }

        const { data: upsertedUser, error } = await supabase
            .from("Users")
            .upsert(
                {
                    email: email,
                    name: user.fullName || null,
                },
                {
                    onConflict: "email",
                    ignoreDuplicates: false,
                }
            )
            .select()
            .single();

        if (error) {
            console.error("Error syncing user profile:", error);
            return NextResponse.json(
                { error: "Failed to sync user profile" },
                { status: 500 }
            );
        }

        return NextResponse.json(upsertedUser);

    } catch (error) {
        console.error("Unexpected error in user sync:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
