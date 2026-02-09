import { NextResponse } from "next/server";
// Force rebuild
import { supabase } from "@/services/supabase";
import { v4 as uuidv4 } from "uuid";
import { inngest } from "@/inngest/client";

export async function POST(req: Request) {
  try {
    const { query, userId, userEmail, libId: existingLibId } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    let libId = existingLibId;

    // -------------------------------------------
    // 1. Create new Library entry ONLY if this is the first query
    // -------------------------------------------
    if (!existingLibId) {
      libId = uuidv4();

      const { error: libraryError } = await supabase
        .from("Library")
        .insert([
          {
            searchInput: query,
            userEmail: userEmail || null,
            type: "DeepSearch",
            libId: libId,
            deepResearchStatus: "pending",
            deepResearchProgress: "Initializing...",
            deepResearchReport: null
          }
        ]);

      if (libraryError) {
        console.error("Error creating library entry:", libraryError);
        return NextResponse.json(
          { error: "Failed to create research session" },
          { status: 500 }
        );
      }
    } else {
      // For follow-up queries, reset status to pending
      await supabase
        .from("Library")
        .update({
          deepResearchStatus: "pending",
          deepResearchProgress: "Initializing new query..."
        })
        .eq("libId", libId);
    }

    // -------------------------------------------
    // 2. Create a new chat record for THIS query
    // -------------------------------------------
    const { data: chatData, error: chatError } = await supabase
      .from("chats")
      .insert([
        {
          libId: libId,
          userSearchInput: query,
          searchResult: [],
          aiResponce: null
        }
      ])
      .select()
      .single();

    if (chatError) {
      console.error("Error creating chat entry:", chatError);
      return NextResponse.json(
        { error: "Failed to create chat record" },
        { status: 500 }
      );
    }

    // -------------------------------------------
    // 3. Trigger the Inngest deep research agent
    // -------------------------------------------
    await inngest.send({
      name: "deep-research",
      data: {
        libId,
        chatId: chatData.id,
        query,
        userEmail: userEmail || null
      }
    });

    // -------------------------------------------
    // 4. Return successful start
    // -------------------------------------------
    return NextResponse.json({
      libId,
      chatId: chatData.id,
      message: "Deep research started"
    });

  } catch (error: unknown) {
    console.error("Error starting deep research:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}